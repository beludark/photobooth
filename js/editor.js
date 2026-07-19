const Editor = {
  canvas: null,
  ctx: null,
  images: [],        // loaded HTMLImageElement cache matching AppState.selectedIndices order
  selectedEmoji: null,
  layoutRects: [],

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    canvasEl.addEventListener('click', (e) => this._onCanvasClick(e));
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
    const margin = 26, gap = 14;
    const headerH = 54, footerH = 44;
    const rects = [];

    if (format.layout === 'grid') {
      const cols = 2, rows = Math.ceil(n / cols);
      const cellW = photoW, cellH = photoH;
      const width = margin * 2 + cols * cellW + (cols - 1) * gap;
      const height = margin + headerH + rows * cellH + (rows - 1) * gap + margin + footerH;
      for (let i = 0; i < n; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        rects.push({
          x: margin + col * (cellW + gap),
          y: margin + headerH + row * (cellH + gap),
          w: cellW, h: cellH,
        });
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
    ctx.fillStyle = frame.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // header
    const isDark = frame.id === 'plum';
    ctx.fillStyle = isDark ? '#fff' : '#3B2A46';
    ctx.font = '700 26px Gaegu, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('둘의 부스 · Our Booth', canvas.width / 2, 40);

    // photos
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
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 4;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    });

    // footer date
    ctx.fillStyle = isDark ? '#f0e6fa' : '#6b5a78';
    ctx.font = '13px Poppins, sans-serif';
    const dateStr = new Date().toLocaleDateString('fr-FR');
    ctx.fillText(`${dateStr} · à deux, à distance`, canvas.width / 2, canvas.height - 16);

    // stickers
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

  _onCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // check if clicking an existing sticker -> remove it
    const hitRadius = 26;
    const hitIndex = AppState.stickers.findIndex(st => Math.hypot(st.x - x, st.y - y) < hitRadius);
    if (hitIndex !== -1) {
      AppState.stickers.splice(hitIndex, 1);
      this._broadcastStickers();
      this.render();
      return;
    }
    if (this.selectedEmoji) {
      AppState.stickers.push({ emoji: this.selectedEmoji, x, y, size: 40 });
      this._broadcastStickers();
      this.render();
    }
  },

  clearAll() {
    AppState.stickers = [];
    this._broadcastStickers();
    this.render();
  },

  _broadcastStickers() {
    PeerNet.send({ type: 'stickers', stickers: AppState.stickers });
  },

  applyRemoteStickers(stickers) {
    AppState.stickers = stickers;
    this.render();
  },

  download() {
    const link = document.createElement('a');
    link.download = `photobooth-${AppState.roomCode || 'nous'}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  },
};
