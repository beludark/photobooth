const History = {
  KEY: 'photobooth_history_v1',
  MAX: 12,

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  save(dataUrl) {
    const items = this.load();
    items.unshift({ id: uid(), dataUrl, date: Date.now() });
    while (items.length > this.MAX) items.pop();
    try { localStorage.setItem(this.KEY, JSON.stringify(items)); } catch (e) { /* storage full, ignore */ }
  },

  remove(id) {
    const items = this.load().filter(it => it.id !== id);
    localStorage.setItem(this.KEY, JSON.stringify(items));
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },

  render(container) {
    const items = this.load();
    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = `<p class="hint center">${t('history.empty')}</p>`;
      return;
    }
    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const dateStr = new Date(it.date).toLocaleDateString(currentLang === 'kr' ? 'ko-KR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      card.innerHTML = `
        <img src="${it.dataUrl}" alt="${dateStr}">
        <div class="history-meta">
          <span>${dateStr}</span>
          <div class="history-actions">
            <button class="btn-small history-download">${t('history.download')}</button>
            <button class="btn-small history-delete">${t('history.delete')}</button>
          </div>
        </div>`;
      card.querySelector('.history-download').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `photobooth-${it.id}.png`;
        link.href = it.dataUrl;
        link.click();
      });
      card.querySelector('.history-delete').addEventListener('click', () => {
        this.remove(it.id);
        this.render(container);
      });
      container.appendChild(card);
    });
  },
};
