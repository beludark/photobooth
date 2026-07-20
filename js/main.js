document.addEventListener('DOMContentLoaded', () => {

  const screens = {};
  document.querySelectorAll('.screen').forEach(s => screens[s.id] = s);
  let screenBeforeHistory = 'screen-home';
  let lastConnState = null;

  function showScreen(id) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[id].classList.add('active');
    AppState.step = id;
  }

  const connStatus = document.getElementById('connStatus');
  const connDot = document.getElementById('connDot');
  const connText = document.getElementById('connText');
  function setConnState(state) {
    lastConnState = state;
    connStatus.classList.remove('hidden');
    connDot.className = 'conn-dot';
    if (state === 'connected') { connDot.classList.add('dot-green'); connText.textContent = t('conn.connected'); }
    else if (state === 'connecting' || state === 'new' || state === 'checking') { connDot.classList.add('dot-orange'); connText.textContent = t('conn.connecting'); }
    else { connDot.classList.add('dot-red'); connText.textContent = t('conn.disconnected'); }
  }

  // ---------- HOME ----------
  const homeError = document.getElementById('homeError');
  function showHomeError(msg) {
    homeError.textContent = msg;
    homeError.classList.remove('hidden');
  }

  const params = new URLSearchParams(location.search);
  if (params.get('room')) {
    document.getElementById('joinCodeInput').value = params.get('room');
  }

  document.getElementById('btnCreateRoom').addEventListener('click', async () => {
    homeError.classList.add('hidden');
    try {
      const code = await PeerNet.createRoom();
      enterWaitingRoom(code);
    } catch (e) {
      showHomeError(t('home.errorCameraCreate'));
    }
  });

  document.getElementById('btnJoinRoom').addEventListener('click', async () => {
    homeError.classList.add('hidden');
    const code = document.getElementById('joinCodeInput').value.trim();
    if (!code) { showHomeError(t('home.errorEmptyCode')); return; }
    try {
      await PeerNet.joinRoom(code);
      enterWaitingRoom(code.toUpperCase());
    } catch (e) {
      if (e.message !== 'full') {
        showHomeError(t('home.errorNotFound'));
      }
    }
  });

  // ---------- PEER EVENT HANDLERS ----------
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const localVideo2 = document.getElementById('localVideo2');
  const remoteVideo2 = document.getElementById('remoteVideo2');
  const remotePlaceholder = document.getElementById('remotePlaceholder');
  const btnGoSetup = document.getElementById('btnGoSetup');
  const waitingHint = document.getElementById('waitingHint');

  PeerNet.handlers.onLocalStream = (stream) => {
    localVideo.srcObject = stream;
    localVideo2.srcObject = stream;
  };
  PeerNet.handlers.onRemoteStream = (stream) => {
    remoteVideo.srcObject = stream;
    remoteVideo2.srcObject = stream;
    remotePlaceholder.classList.add('hidden');
  };
  PeerNet.handlers.onConnStateChange = (state) => setConnState(state);
  PeerNet.handlers.onPeerConnected = () => {
    if (AppState.role === 'host') {
      btnGoSetup.classList.remove('hidden');
      waitingHint.textContent = t('waiting.hintHostReady');
    } else {
      waitingHint.textContent = t('waiting.hintGuestReady');
    }
  };
  PeerNet.handlers.onPeerDisconnected = () => {
    remotePlaceholder.textContent = t('waiting.hintDisconnected');
    remotePlaceholder.classList.remove('hidden');
    btnGoSetup.classList.add('hidden');
  };
  PeerNet.handlers.onRoomFull = () => {
    showHomeError(t('home.errorFull'));
  };
  PeerNet.handlers.onError = () => {
    showHomeError(t('home.errorGeneric'));
  };
  PeerNet.handlers.onMessage = (msg) => {
    switch (msg.type) {
      case 'goto-setup': showScreen('screen-setup'); renderSetupOptions(); break;
      case 'settings': AppState.settings = msg.settings; renderSetupOptions(); break;
      case 'sequence-init': case 'retake-init': case 'tick': case 'flash': case 'photo': case 'rest': case 'sequence-done':
        if (!Booth.isDriver) {
          if (AppState.step !== 'screen-capture') showScreen('screen-capture');
          Booth.handleRemoteEvent(msg);
        }
        break;
      case 'select':
        AppState.selectedIndices = msg.selectedIndices;
        renderPhotoGrid();
        break;
      case 'goto-edit':
        enterEditScreen();
        break;
      case 'stickers':
        Editor.applyRemoteStickers(msg.stickers);
        break;
      case 'custom-text':
        Editor.applyRemoteCustomText(msg.text);
        document.getElementById('stripTextInput').value = msg.text;
        break;
      case 'restart':
        resetCreativeState();
        showScreen('screen-setup');
        renderSetupOptions();
        break;
    }
  };

  function enterWaitingRoom(code) {
    document.getElementById('roomCodeDisplay').textContent = code;
    const link = `${location.origin}${location.pathname}?room=${encodeURIComponent(code)}`;
    document.getElementById('shareLink').value = link;
    showScreen('screen-waiting');
  }

  document.getElementById('btnCopyLink').addEventListener('click', () => {
    const input = document.getElementById('shareLink');
    input.select();
    navigator.clipboard?.writeText(input.value);
    const btn = document.getElementById('btnCopyLink');
    const old = btn.textContent; btn.textContent = t('waiting.copied');
    setTimeout(() => btn.textContent = t('waiting.copy'), 1500);
  });

  document.getElementById('btnGoSetup').addEventListener('click', () => {
    PeerNet.send({ type: 'goto-setup' });
    showScreen('screen-setup');
    renderSetupOptions();
  });

  // ---------- SETUP ----------
  function chipRow(container, items, currentId, i18nPrefix, onPick) {
    container.innerHTML = '';
    items.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'option-chip' + (item.id === currentId ? ' selected' : '');
      if (item.color && !item.gradient) {
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = item.color;
        chip.appendChild(sw);
      } else if (item.gradient) {
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`;
        chip.appendChild(sw);
      } else if (item.pattern) {
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = item.color;
        chip.appendChild(sw);
      }
      chip.appendChild(document.createTextNode(t(`${i18nPrefix}.${item.id}`)));
      chip.addEventListener('click', () => onPick(item.id));
      container.appendChild(chip);
    });
  }

  function renderSetupOptions() {
    chipRow(document.getElementById('formatOptions'), FORMATS, AppState.settings.formatId, 'formats', (id) => {
      AppState.settings.formatId = id; broadcastSettings(); renderSetupOptions();
    });
    chipRow(document.getElementById('frameOptions'), FRAMES, AppState.settings.frameId, 'frames', (id) => {
      AppState.settings.frameId = id; broadcastSettings(); renderSetupOptions();
    });
    chipRow(document.getElementById('filterOptions'), FILTERS, AppState.settings.filterId, 'filters', (id) => {
      AppState.settings.filterId = id; broadcastSettings(); renderSetupOptions();
    });
    chipRow(document.getElementById('countdownOptions'), COUNTDOWN_OPTIONS, AppState.settings.countdownId, 'countdowns', (id) => {
      AppState.settings.countdownId = id; broadcastSettings(); renderSetupOptions();
    });

    const startBtn = document.getElementById('btnStartSequence');
    startBtn.classList.toggle('hidden', AppState.role === 'guest');
  }

  function broadcastSettings() {
    PeerNet.send({ type: 'settings', settings: AppState.settings });
  }

  document.getElementById('btnStartSequence').addEventListener('click', () => {
    showScreen('screen-capture');
    Booth.runAsDriver();
  });

  // ---------- CAPTURE ----------
  const captureProgress = document.getElementById('captureProgress');
  const countdownOverlay = document.getElementById('countdownOverlay');
  const countdownNumber = document.getElementById('countdownNumber');
  const restOverlay = document.getElementById('restOverlay');
  const restText = document.getElementById('restText');
  const flashOverlay = document.getElementById('flashOverlay');
  const previewOverlay = document.getElementById('previewOverlay');
  const previewImg = document.getElementById('previewImg');

  Booth.init({ localVideoEl: localVideo2, remoteVideoEl: remoteVideo2 });

  Booth.onProgress = (index, total, isRetake) => {
    captureProgress.textContent = isRetake
      ? t('capture.retakeProgress', { i: index + 1 })
      : t('capture.photoProgress', { i: Math.min(index + 1, total), n: total });
  };
  Booth.onCountdown = (n) => {
    if (n == null) { countdownOverlay.classList.add('hidden'); return; }
    previewOverlay.classList.add('hidden');
    countdownOverlay.classList.remove('hidden');
    countdownNumber.textContent = n;
  };
  Booth.onRest = (s) => {
    if (s == null) { restOverlay.classList.add('hidden'); return; }
    previewOverlay.classList.add('hidden');
    restOverlay.classList.remove('hidden');
    restText.textContent = t('capture.restText', { s });
  };
  Booth.onFlash = () => {
    flashOverlay.classList.remove('flashing');
    void flashOverlay.offsetWidth;
    flashOverlay.classList.add('flashing');
  };
  Booth.onPreview = (dataUrl) => {
    previewImg.src = dataUrl;
    previewOverlay.classList.remove('hidden');
  };
  Booth.onDone = () => {
    previewOverlay.classList.add('hidden');
    showScreen('screen-select');
    renderPhotoGrid();
  };

  // ---------- SELECT ----------
  function renderPhotoGrid() {
    const format = currentFormat();
    document.getElementById('selectTitle').textContent = t('select.title', { n: format.keep });
    const grid = document.getElementById('photoGrid');
    grid.innerHTML = '';
    AppState.photos.forEach((url, i) => {
      const div = document.createElement('div');
      div.className = 'photo-thumb' + (AppState.selectedIndices.includes(i) ? ' selected' : '');
      div.innerHTML = `<img src="${url}"><span class="check">✓</span><button class="retake-btn" type="button">${t('select.retake')}</button>`;
      div.querySelector('img').addEventListener('click', () => toggleSelect(i));
      div.querySelector('.retake-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showScreen('screen-capture');
        Booth.runRetake(i);
      });
      grid.appendChild(div);
    });
    const hint = document.getElementById('selectHint');
    hint.textContent = t('select.hint', { count: AppState.selectedIndices.length, n: format.keep });
    document.getElementById('btnGoEdit').disabled = AppState.selectedIndices.length !== format.keep;
  }

  function toggleSelect(i) {
    const format = currentFormat();
    const idx = AppState.selectedIndices.indexOf(i);
    if (idx !== -1) {
      AppState.selectedIndices.splice(idx, 1);
    } else if (AppState.selectedIndices.length < format.keep) {
      AppState.selectedIndices.push(i);
    }
    PeerNet.send({ type: 'select', selectedIndices: AppState.selectedIndices });
    renderPhotoGrid();
  }

  document.getElementById('btnGoEdit').addEventListener('click', () => {
    PeerNet.send({ type: 'goto-edit' });
    enterEditScreen();
  });

  // ---------- EDIT ----------
  Editor.init(document.getElementById('finalCanvas'));

  function enterEditScreen() {
    showScreen('screen-edit');
    renderStickerPalette();
    document.getElementById('stripTextInput').value = AppState.customText || '';
    const shareBtn = document.getElementById('btnShare');
    shareBtn.classList.toggle('hidden', !Editor.supportsFileShare());
    Editor.render();
  }

  function renderStickerPalette() {
    const palette = document.getElementById('stickerPalette');
    palette.innerHTML = '';
    STICKER_EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.className = 'sticker-btn';
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        Editor.setActiveSticker(emoji);
        [...palette.children].forEach(c => c.classList.toggle('active', c === btn && Editor.selectedEmoji === emoji));
      });
      palette.appendChild(btn);
    });
  }

  document.getElementById('btnClearStickers').addEventListener('click', () => Editor.clearAll());
  document.getElementById('btnDownload').addEventListener('click', () => Editor.download());
  document.getElementById('btnShare').addEventListener('click', async () => {
    try {
      await Editor.share();
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error('share failed', e);
      Editor.download();
    }
  });

  let textDebounce = null;
  document.getElementById('stripTextInput').addEventListener('input', (e) => {
    clearTimeout(textDebounce);
    textDebounce = setTimeout(() => Editor.setCustomText(e.target.value), 200);
  });

  document.getElementById('btnRestart').addEventListener('click', () => {
    PeerNet.send({ type: 'restart' });
    resetCreativeState();
    showScreen('screen-setup');
    renderSetupOptions();
  });

  function resetCreativeState() {
    AppState.photos = [];
    AppState.selectedIndices = [];
    AppState.stickers = [];
    AppState.customText = '';
  }

  // ---------- HISTORY ----------
  document.getElementById('btnHistory').addEventListener('click', () => {
    screenBeforeHistory = AppState.step;
    showScreen('screen-history');
    History.render(document.getElementById('historyGrid'));
  });
  document.getElementById('btnHistoryBack').addEventListener('click', () => {
    showScreen(screenBeforeHistory);
  });
  document.getElementById('btnHistoryClear').addEventListener('click', () => {
    History.clear();
    History.render(document.getElementById('historyGrid'));
  });

  // ---------- LANGUAGE ----------
  window.onLangChange = () => {
    if (AppState.step === 'screen-setup') renderSetupOptions();
    if (AppState.step === 'screen-select') renderPhotoGrid();
    if (AppState.step === 'screen-history') History.render(document.getElementById('historyGrid'));
    if (lastConnState) setConnState(lastConnState);
  };

});
