// Capture sequence: only the initiator (whoever clicks "Démarrer") actually
// composites frames from the two <video> elements. It streams the resulting
// images to the other peer over the data channel, along with tick/rest
// events, so both screens stay perfectly in sync without needing precise
// clock synchronization.

const SHOT_W = 480;
const SHOT_H = 320;

const Booth = {
  isDriver: false,
  localVideoEl: null,
  remoteVideoEl: null,
  onProgress: null,   // (index, total) => void
  onCountdown: null,  // (n | null) => void   null = hide
  onRest: null,       // (secondsLeft | null) => void
  onFlash: null,      // () => void
  onPhoto: null,      // (index, dataUrl) => void
  onDone: null,       // () => void

  init({ localVideoEl, remoteVideoEl }) {
    this.localVideoEl = localVideoEl;
    this.remoteVideoEl = remoteVideoEl;
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
    // mirror, matching the on-screen preview
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

  // Called by whoever clicks "Démarrer la séance" (the driver for this round)
  async runAsDriver() {
    this.isDriver = true;
    const format = currentFormat();
    const filter = currentFilter().css;
    AppState.photos = [];
    AppState.selectedIndices = [];
    AppState.captureInProgress = true;

    PeerNet.send({ type: 'sequence-init', total: format.shots, settings: AppState.settings });
    this._localSequenceInit(format.shots);

    for (let i = 0; i < format.shots; i++) {
      await this._countdownPhase(i, format.shots);
      const dataUrl = this.captureComposite(filter);
      AppState.photos.push(dataUrl);
      this._localFlash();
      PeerNet.send({ type: 'photo', index: i, dataUrl });
      if (this.onPhoto) this.onPhoto(i, dataUrl);

      if (i < format.shots - 1) {
        await this._restPhase();
      }
    }

    AppState.captureInProgress = false;
    PeerNet.send({ type: 'sequence-done' });
    if (this.onDone) this.onDone();
  },

  _localSequenceInit(total) {
    if (this.onProgress) this.onProgress(0, total);
  },

  async _countdownPhase(index, total) {
    if (this.onProgress) this.onProgress(index, total);
    for (let n = COUNTDOWN_SECONDS; n >= 1; n--) {
      PeerNet.send({ type: 'tick', n });
      if (this.onCountdown) this.onCountdown(n);
      await this.sleep(1000);
    }
    if (this.onCountdown) this.onCountdown(null);
  },

  _localFlash() {
    PeerNet.send({ type: 'flash' });
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

  // Called on the non-driver side to mirror the driver's events
  handleRemoteEvent(msg) {
    switch (msg.type) {
      case 'sequence-init':
        AppState.photos = [];
        AppState.selectedIndices = [];
        AppState.settings = msg.settings;
        AppState.captureInProgress = true;
        if (this.onProgress) this.onProgress(0, msg.total);
        break;
      case 'tick':
        if (this.onCountdown) this.onCountdown(msg.n);
        break;
      case 'flash':
        if (this.onCountdown) this.onCountdown(null);
        if (this.onFlash) this.onFlash();
        break;
      case 'photo':
        AppState.photos[msg.index] = msg.dataUrl;
        if (this.onProgress) this.onProgress(msg.index, currentFormat().shots);
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
