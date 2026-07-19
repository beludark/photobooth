const Editor = {
  canvas: null,
  ctx: null,
  images: [],
  selectedEmoji: null,
  layoutRects: [],
  canvasW: 0,
  canvasH: 0,
  drag: null, // { index, offsetX, offsetY }

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    canvasEl.style.touchAction = 'none';
    canvasEl.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    canvasEl.addEventListener('pointermove', (e) => this._onPointerMove(e));
    canvasEl.addEventListener('pointerup', (e) => this._onPointerUp(e));
    canvasEl.addEventListener('pointercancel', (e) => this._onPointerUp(e));
    canvasEl.addEventListener('dblclick', (e) => this._onDoubleClick(e));
    canvasEl.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
  },

  async loadSelectedImages() {
    const urls = AppState.selectedIndices.map(i => AppState.photos[i]);
    this.images = await Promise.all(urls.map(url => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = url;
    })));
  },

  computeLayout() {
    const format = currentFormat();
    const n = AppState.selectedIndices.length;
    const photoW = 380, photoH = photoW * (SHOT_H / SHOT_W);
    const frame = currentFrame();
    const margin = frame.polaroid ? 34 : 26;
    const gap = frame.polaroid ? 20 : 14;
    const headerH = 54;
    const footerH = AppState.customText ? 68 : 44;
    const rects = [];

    if (format.layout === 'grid') {
      const cols = 2, rows = Math.ceil(n / cols);
      const width = margin * 2 + cols * photoW + (cols - 1) * gap;
      const height = margin + headerH + rows * photoH + (rows - 1) * gap + margin + footerH;
      for (let i = 0; i < n; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        rects.push({ x: margin + col * (photoW + gap), y: margin + headerH + row * (photoH + gap), w: photoW, h: photoH });
      }
      this.canvasW = width; this.canvasH = height;
    } else {
      const width = margin * 2 + photoW;
      const height = margin + headerH + n * photoH + (n - 1) * gap + margin + footerH;
      for (let i = 0; i < n; i++) {
        rects.push({ x: margin, y: margin + headerH + i * (photoH + gap), w: photoW, h: photoH });
      }
      this.canvasW = width; this.canvasH = height;
    }
    this.layoutRects = rects;
  },

  _paintBackground(frame) {
    const ctx = this.ctx;
    if (frame.gradient) {
      const g = ctx.createLinearGradient(0, 0, this.canvasW, this.canvasH);
      g.addColorStop(0, frame.gradient[0]);
      g.addColorStop(1, frame.gradient[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    } else {
      ctx.fillStyle = frame.color;
      ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    }
    if (frame.pattern === 'hearts') {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      let toggle = 0;
      for (let y = 10; y < this.canvasH; y += 34) {
        for (let x = 18 + (toggle % 2) * 17; x < this.canvasW; x += 34) {
          ctx.fillText('♥', x, y);
        }
        toggle++;
      }
      ctx.restore();
    }
  },

  _paintGrain() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#000';
    const dots = Math.floor((this.canvasW * this.canvasH) / 260);
    for (let i = 0; i < dots; i++) {
      const x = Math.random() * this.canvasW;
      const y = Math.random() * this.canvasH;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  },

  async render() {
    if (document.fonts && document.fonts.load) {
      try { await document.fonts.load('700 30px Gaegu'); } catch (e) {}
    }
    await this.loadSelectedImages();
    this.computeLayout();
    const canvas = this.canvas, ctx = this.ctx;
    canvas.width = this.canvasW;
    canvas.height = this.canvasH;

    const frame = currentFrame();
    this._paintBackground(frame);

    const isDark = frame.id === 'plum';
    ctx.fillStyle = isDark ? '#fff' : '#3B2A46';
    ctx.font = '700 26px Gaegu, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('둘의 부스 · Our Booth', canvas.width / 2, 40);

    const borderWidth = frame.polaroid ? 8 : 4;
    this.images.forEach((img, i) => {
      const r = this.layoutRects[i];
      if (!r) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      ctx.fillStyle = '#fff';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.drawImage(img, r.x, r.y, r.w, r.h);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      if (frame.polaroid) {
        ctx.strokeStyle = 'rgba(59,42,70,0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x - borderWidth / 2, r.y - borderWidth / 2, r.w + borderWidth, r.h + borderWidth);
      }
    });

    if (AppState.customText) {
      ctx.fillStyle = isDark ? '#fff' : '#3B2A46';
      ctx.font = '700 22px Gaegu, cursive';
      ctx.textAlign = 'center';
      ctx.fillText(AppState.customText, canvas.width / 2, canvas.height - (AppState.customText ? 40 : 16));
    }

    ctx.fillStyle = isDark ? '#f0e6fa' : '#6b5a78';
    ctx.font = '13px Poppins, sans-serif';
    const dateStr = new Date().toLocaleDateString('fr-FR');
    ctx.fillText(`${dateStr} · à deux, à distance`, canvas.width / 2, canvas.height - 16);

    if (frame.polaroid) this._paintGrain();

    AppState.stickers.forEach(st => {
      ctx.font = `${st.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st.emoji, st.x, st.y);
    });
  },

  setActiveSticker(emoji) {
    this.selectedEmoji = (this.selectedEmoji === emoji) ? null : emoji;
  },

  _pointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  },

  _hitSticker(x, y) {
    for (let i = AppState.stickers.length - 1; i >= 0; i--) {
      const st = AppState.stickers[i];
      if (Math.hypot(st.x - x, st.y - y) < st.size * 0.6) return i;
    }
    return -1;
  },

  _onPointerDown(e) {
    const { x, y } = this._pointerPos(e);
    const hit = this._hitSticker(x, y);
    if (hit !== -1) {
      this.drag = { index: hit, offsetX: x - AppState.stickers[hit].x, offsetY: y - AppState.stickers[hit].y };
      this.canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (this.selectedEmoji) {
      AppState.stickers.push({ id: uid(), emoji: this.selectedEmoji, x, y, size: 40 });
      this._broadcastStickers();
      this.render();
    }
  },

  _onPointerMove(e) {
    if (!this.drag) return;
    const { x, y } = this._pointerPos(e);
    const st = AppState.stickers[this.drag.index];
    if (!st) return;
    st.x = x - this.drag.offsetX;
    st.y = y - this.drag.offsetY;
    this.render();
  },

  _onPointerUp() {
    if (this.drag) {
      this.drag = null;
      this._broadcastStickers();
    }
  },

  _onDoubleClick(e) {
    const { x, y } = this._pointerPos(e);
    const hit = this._hitSticker(x, y);
    if (hit !== -1) {
      AppState.stickers.splice(hit, 1);
      this._broadcastStickers();
      this.render();
    }
  },

  _onWheel(e) {
    const { x, y } = this._pointerPos(e);
    const hit = this._hitSticker(x, y);
    if (hit === -1) return;
    e.preventDefault();
    const st = AppState.stickers[hit];
    st.size = Math.max(16, Math.min(120, st.size - Math.sign(e.deltaY) * 4));
    this.render();
    this._broadcastStickers();
  },

  clearAll() {
    AppState.stickers = [];
    this._broadcastStickers();
    this.render();
  },

  setCustomText(text) {
    AppState.customText = text.slice(0, 40);
    PeerNet.send({ type: 'custom-text', text: AppState.customText });
    this.render();
  },

  applyRemoteCustomText(text) {
    AppState.customText = text;
    this.render();
  },

  _broadcastStickers() {
    PeerNet.send({ type: 'stickers', stickers: AppState.stickers });
  },

  applyRemoteStickers(stickers) {
    AppState.stickers = stickers;
    this.render();
  },

  toBlob() {
    return new Promise(resolve => this.canvas.toBlob(resolve, 'image/png'));
  },

  download() {
    const link = document.createElement('a');
    link.download = `photobooth-${AppState.roomCode || 'nous'}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    if (window.History) History.save(this.canvas.toDataURL('image/png'));
  },

  async share() {
    if (!navigator.share) return false;
    try {
      const blob = await this.toBlob();
      const file = new File([blob], `photobooth-${AppState.roomCode || 'nous'}.png`, { type: 'image/png' });
      if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
      await navigator.share({ files: [file], title: 'Notre bande photobooth', text: 'On s\'est pris en photo à distance ✨' });
      return true;
    } catch (e) {
      return false;
    }
  },
};
