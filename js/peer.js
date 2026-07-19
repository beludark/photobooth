// WebRTC signaling via Firebase Firestore (see js/firebase-config.js).
// Firestore is only used to exchange the initial connection handshake
// (SDP offer/answer + ICE candidates) — the actual video and messages
// travel directly between the two browsers over WebRTC, never through Firebase.
// Max 2 people: a Firestore transaction atomically reserves the second seat,
// so a genuine "room not found" or "room full" can be reported honestly.

const RTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
};

const PeerNet = {
  pc: null,
  dataChannel: null,
  localStream: null,
  roomRef: null,
  unsubs: [],
  connectedFired: false,

  handlers: {
    onLocalStream: null,
    onRemoteStream: null,
    onPeerConnected: null,
    onPeerDisconnected: null,
    onConnStateChange: null,
    onMessage: null,
    onError: null,
    onRoomFull: null,
  },

  async getLocalStream() {
    if (this.localStream) return this.localStream;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream = stream;
    if (this.handlers.onLocalStream) this.handlers.onLocalStream(stream);
    return stream;
  },

  _setupPeerConnection() {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;
    this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
    pc.ontrack = (event) => {
      if (this.handlers.onRemoteStream) this.handlers.onRemoteStream(event.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      if (this.handlers.onConnStateChange) this.handlers.onConnStateChange(pc.connectionState);
      if (pc.connectionState === 'connected' && !this.connectedFired) {
        this.connectedFired = true;
        AppState.connected = true;
        if (this.handlers.onPeerConnected) this.handlers.onPeerConnected();
      }
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        AppState.connected = false;
        if (this.handlers.onPeerDisconnected) this.handlers.onPeerDisconnected();
      }
    };
    return pc;
  },

  _bindDataChannel(channel) {
    this.dataChannel = channel;
    channel.onmessage = (event) => {
      if (this.handlers.onMessage) {
        try { this.handlers.onMessage(JSON.parse(event.data)); } catch (e) {}
      }
    };
  },

  async createRoom() {
    await this.getLocalStream();

    let code, roomRef, snap;
    do {
      code = genRoomCode();
      roomRef = db.collection('rooms').doc(code);
      snap = await roomRef.get();
    } while (snap.exists);

    this.roomRef = roomRef;
    AppState.role = 'host';
    AppState.roomCode = code;

    const pc = this._setupPeerConnection();
    this._bindDataChannel(pc.createDataChannel('game'));

    const callerCandidates = roomRef.collection('callerCandidates');
    pc.onicecandidate = (event) => {
      if (event.candidate) callerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);
    await roomRef.set({
      offer: { type: offerDescription.type, sdp: offerDescription.sdp },
      createdAt: Date.now(),
    });

    this.unsubs.push(roomRef.onSnapshot(async (snap) => {
      const data = snap.data();
      if (data && data.answer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    }));

    this.unsubs.push(roomRef.collection('calleeCandidates').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      });
    }));

    window.addEventListener('beforeunload', () => this._cleanupRoom(code));
    return code;
  },

  async joinRoom(code) {
    await this.getLocalStream();
    const cleanCode = code.trim().toUpperCase();
    const roomRef = db.collection('rooms').doc(cleanCode);

    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(roomRef);
        if (!snap.exists) throw new Error('not-found');
        if (snap.data().guestClaimed) throw new Error('full');
        tx.update(roomRef, { guestClaimed: true });
      });
    } catch (e) {
      if (e.message === 'full' && this.handlers.onRoomFull) this.handlers.onRoomFull();
      throw e;
    }

    this.roomRef = roomRef;
    AppState.role = 'guest';
    AppState.roomCode = cleanCode;

    const pc = this._setupPeerConnection();
    pc.ondatachannel = (event) => this._bindDataChannel(event.channel);

    const calleeCandidates = roomRef.collection('calleeCandidates');
    pc.onicecandidate = (event) => {
      if (event.candidate) calleeCandidates.add(event.candidate.toJSON());
    };

    const roomSnap = await roomRef.get();
    await pc.setRemoteDescription(new RTCSessionDescription(roomSnap.data().offer));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);
    await roomRef.update({ answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

    this.unsubs.push(roomRef.collection('callerCandidates').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      });
    }));
  },

  send(msg) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(msg));
    }
  },

  async _cleanupRoom(code) {
    try {
      const roomRef = db.collection('rooms').doc(code);
      for (const sub of ['callerCandidates', 'calleeCandidates']) {
        const docs = await roomRef.collection(sub).get();
        await Promise.all(docs.docs.map(d => d.ref.delete()));
      }
      await roomRef.delete();
    } catch (e) { /* best effort */ }
  },
};
