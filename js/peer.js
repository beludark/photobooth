// PeerJS-based signaling + WebRTC layer.
// Uses the free public PeerJS cloud broker (no server to host ourselves).
// Room code -> Peer ID is "pb-<code>". Host owns that ID. Guest connects to it.
// Max 2 people: host refuses any second incoming call/connection.

const PeerNet = {
  peer: null,
  conn: null,          // data connection
  call: null,          // media call
  localStream: null,
  hasGuest: false,

  handlers: {
    onLocalStream: null,
    onRemoteStream: null,
    onPeerConnected: null,
    onPeerDisconnected: null,
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

  async createRoom() {
    await this.getLocalStream();
    const code = genRoomCode();
    return new Promise((resolve, reject) => {
      const peer = new Peer('pb-' + code.toLowerCase());
      this.peer = peer;

      peer.on('open', () => {
        AppState.role = 'host';
        AppState.roomCode = code;
        resolve(code);
      });

      peer.on('connection', (conn) => {
        if (this.hasGuest) { conn.on('open', () => { conn.send({ type: 'room-full' }); conn.close(); }); return; }
        this._bindDataConn(conn);
      });

      peer.on('call', (call) => {
        if (this.hasGuest && this.call) { call.close(); return; }
        call.answer(this.localStream);
        this._bindCall(call);
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // extremely rare collision, retry with a new code
          this.createRoom().then(resolve).catch(reject);
        } else {
          if (this.handlers.onError) this.handlers.onError(err);
          reject(err);
        }
      });
    });
  },

  async joinRoom(code) {
    await this.getLocalStream();
    const cleanCode = code.trim().toLowerCase().replace(/\s+/g, '');
    return new Promise((resolve, reject) => {
      const peer = new Peer();
      this.peer = peer;

      peer.on('open', () => {
        AppState.role = 'guest';
        AppState.roomCode = code.trim().toUpperCase();

        const conn = peer.connect('pb-' + cleanCode, { reliable: true });
        this._bindDataConn(conn, () => resolve());

        const call = peer.call('pb-' + cleanCode, this.localStream);
        this._bindCall(call);

        conn.on('error', () => reject(new Error('room-not-found')));
      });

      peer.on('error', (err) => {
        if (this.handlers.onError) this.handlers.onError(err);
        reject(err);
      });
    });
  },

  _bindDataConn(conn, onOpenExtra) {
    this.conn = conn;
    conn.on('open', () => {
      this.hasGuest = true;
      AppState.connected = true;
      if (this.handlers.onPeerConnected) this.handlers.onPeerConnected();
      if (onOpenExtra) onOpenExtra();
    });
    conn.on('data', (data) => {
      if (data && data.type === 'room-full') {
        if (this.handlers.onRoomFull) this.handlers.onRoomFull();
        return;
      }
      if (this.handlers.onMessage) this.handlers.onMessage(data);
    });
    conn.on('close', () => {
      this.hasGuest = false;
      AppState.connected = false;
      if (this.handlers.onPeerDisconnected) this.handlers.onPeerDisconnected();
    });
  },

  _bindCall(call) {
    this.call = call;
    call.on('stream', (remoteStream) => {
      if (this.handlers.onRemoteStream) this.handlers.onRemoteStream(remoteStream);
    });
    call.on('close', () => {
      if (this.handlers.onPeerDisconnected) this.handlers.onPeerDisconnected();
    });
  },

  send(msg) {
    if (this.conn && this.conn.open) this.conn.send(msg);
  },
};
