// Capture sequence: only the initiator (whoever clicks "Démarrer" or "Reprendre")
// actually composites frames from the two <video> elements. It streams the
// resulting images to the other peer over the data channel, along with
// tick/rest events, so both screens stay in sync without needing precise
// clock synchronization.

const SHOT_W = 480;
const SHOT_H = 320;

const Booth = {
  isDriver: false,
  localVideoEl: null,
  remoteVideoEl: null,
  onProgress: null,   // (index, total, isRetake) => void
  onCountdown: null,  // (n | null) => void   null = hide
  onRest: null,       // (secondsLeft | null) => void
  onFlash: null,      // () => void
  onPhoto: null,      // (index, dataUrl) => void
  onDone: null,       // () => void

  init({ localVideoEl, remoteVideoEl }) {
    this.localVideoEl = localVideoEl;
    this.remoteVideoEl = remoteVideoEl;
  },

  // ---- shutter sound, synthesized so no external audio file is needed ----
  _audioCtx: null,
  playShutterSound() {
    try {
      this._audioCtx = this._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this._audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) { /* audio not available, ignore */ }
  },
  playBeep() {
    try {
      this._audioCtx = this._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this._audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* ignore */ }
  },

  drawVideoCover(ctx, video, x, y, w, h) {
    if (!video || !video.videoWidth) {
      ctx.fillStyle = '#e9def2';
      ctx.fillRect(x, y, w, h);
      return;
    }
    const vw = video.videoWidth, vh = video.videoHeight;
    const scale = Math.max(w / vw, h / vh);
    const sw = w / scale, sh = h / scale;
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    ctx.restore();
  },

  captureComposite(filterCss) {
    const canvas = document.getElementById('workCanvas');
    canvas.width = SHOT_W;
    canvas.height = SHOT_H;
    const ctx = canvas.getContext('2d');
    ctx.filter = filterCss || 'none';
    const half = SHOT_W / 2;
    this.drawVideoCover(ctx, this.localVideoEl, 0, 0, half, SHOT_H);
    this.drawVideoCover(ctx, this.remoteVideoEl, half, 0, half, SHOT_H);
    ctx.filter = 'none';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(half, 0);
    ctx.lineTo(half, SHOT_H);
    ctx.stroke();
    return canvas.toDataURL('image/jpeg', 0.85);
  },

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

  // Called by whoever clicks "Démarrer la séance"
  async runAsDriver() {
    this.isDriver = true;
    const format = currentFormat();
    const filter = currentFilter().css;
    AppState.photos = [];
    AppState.selectedIndices = [];
    AppState.captureInProgress = true;

    PeerNet.send({ type: 'sequence-init', total: format.shots, settings: AppState.settings });
    if (this.onProgress) this.onProgress(0, format.shots, false);

    for (let i = 0; i < format.shots; i++) {
      await this._countdownPhase(i, format.shots, false);
      const dataUrl = this.captureComposite(filter);
      AppState.photos.push(dataUrl);
      this._localFlash();
      PeerNet.send({ type: 'photo', index: i, dataUrl });
      if (this.onPhoto) this.onPhoto(i, dataUrl);

      if (i < format.shots - 1) await this._restPhase();
    }

    AppState.captureInProgress = false;
    PeerNet.send({ type: 'sequence-done' });
    this.isDriver = false;
    if (this.onDone) this.onDone();
  },

  // Retake a single already-taken photo, without disturbing the others
  async runRetake(index) {
    this.isDriver = true;
    const filter = currentFilter().css;
    const total = currentFormat().shots;
    AppState.captureInProgress = true;

    PeerNet.send({ type: 'retake-init', index });
    if (this.onProgress) this.onProgress(index, total, true);

    await this._countdownPhase(index, total, true);
    const dataUrl = this.captureComposite(filter);
    AppState.photos[index] = dataUrl;
    this._localFlash();
    PeerNet.send({ type: 'photo', index, dataUrl });
    if (this.onPhoto) this.onPhoto(index, dataUrl);

    AppState.captureInProgress = false;
    PeerNet.send({ type: 'sequence-done' });
    this.isDriver = false;
    if (this.onDone) this.onDone();
  },

  async _countdownPhase(index, total, isRetake) {
    if (this.onProgress) this.onProgress(index, total, isRetake);
    const seconds = currentCountdownSeconds();
    for (let n = seconds; n >= 1; n--) {
      PeerNet.send({ type: 'tick', n });
      if (this.onCountdown) this.onCountdown(n);
      if (n <= 3) this.playBeep();
      await this.sleep(1000);
    }
    if (this.onCountdown) this.onCountdown(null);
  },

  _localFlash() {
    PeerNet.send({ type: 'flash' });
    this.playShutterSound();
    if (this.onFlash) this.onFlash();
  },

  async _restPhase() {
    for (let s = REST_SECONDS; s >= 1; s--) {
      PeerNet.send({ type: 'rest', s });
      if (this.onRest) this.onRest(s);
      await this.sleep(1000);
    }
    if (this.onRest) this.onRest(null);
  },

  // Mirrors the driver's events on the non-driving side
  handleRemoteEvent(msg) {
    switch (msg.type) {
      case 'sequence-init':
        AppState.photos = [];
        AppState.selectedIndices = [];
        AppState.settings = msg.settings;
        AppState.captureInProgress = true;
        if (this.onProgress) this.onProgress(0, msg.total, false);
        break;
      case 'retake-init':
        AppState.captureInProgress = true;
        if (this.onProgress) this.onProgress(msg.index, currentFormat().shots, true);
        break;
      case 'tick':
        if (this.onCountdown) this.onCountdown(msg.n);
        break;
      case 'flash':
        if (this.onCountdown) this.onCountdown(null);
        this.playShutterSound();
        if (this.onFlash) this.onFlash();
        break;
      case 'photo':
        AppState.photos[msg.index] = msg.dataUrl;
        if (this.onProgress) this.onProgress(msg.index, currentFormat().shots, false);
        if (this.onPhoto) this.onPhoto(msg.index, msg.dataUrl);
        break;
      case 'rest':
        if (this.onRest) this.onRest(msg.s);
        break;
      case 'sequence-done':
        AppState.captureInProgress = false;
        if (this.onDone) this.onDone();
        break;
    }
  },
};
