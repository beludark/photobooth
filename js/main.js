document.addEventListener('DOMContentLoaded', () => {

  const screens = {};
  document.querySelectorAll('.screen').forEach(s => screens[s.id] = s);
  function showScreen(id) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[id].classList.add('active');
    AppState.step = id;
  }

  const connStatus = document.getElementById('connStatus');
  function setConnStatus(text) {
    connStatus.textContent = text;
    connStatus.classList.remove('hidden');
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
      showHomeError("Impossible de créer la salle. Vérifie l'accès à ta caméra et réessaie.");
    }
  });

  document.getElementById('btnJoinRoom').addEventListener('click', async () => {
    homeError.classList.add('hidden');
    const code = document.getElementById('joinCodeInput').value.trim();
    if (!code) { showHomeError('Entre le code de la salle.'); return; }
    try {
      await PeerNet.joinRoom(code);
      enterWaitingRoom(code.toUpperCase());
    } catch (e) {
      showHomeError("Salle introuvable. Vérifie le code ou demande un nouveau lien.");
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
  PeerNet.handlers.onPeerConnected = () => {
    setConnStatus('Connecté(e) ✓');
    if (AppState.role === 'host') {
      btnGoSetup.classList.remove('hidden');
      waitingHint.textContent = 'Ta copine est connectée. Quand vous êtes prêtes, on y va !';
    } else {
      waitingHint.textContent = "Connectée ! En attente que l'hôte démarre…";
    }
  };
  PeerNet.handlers.onPeerDisconnected = () => {
    setConnStatus('Déconnecté(e)');
    remotePlaceholder.textContent = "La connexion a été coupée.";
    remotePlaceholder.classList.remove('hidden');
    btnGoSetup.classList.add('hidden');
  };
  PeerNet.handlers.onRoomFull = () => {
    showHomeError('Cette salle est déjà complète (2 personnes maximum).');
  };
  PeerNet.handlers.onError = () => {
    showHomeError('Une erreur de connexion est survenue. Réessaie.');
  };
  PeerNet.handlers.onMessage = (msg) => {
    switch (msg.type) {
      case 'goto-setup': showScreen('screen-setup'); renderSetupOptions(); break;
      case 'settings': AppState.settings = msg.settings; renderSetupOptions(); break;
      case 'sequence-init': case 'tick': case 'flash': case 'photo': case 'rest': case 'sequence-done':
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
    const old = btn.textContent; btn.textContent = 'Copié !';
    setTimeout(() => btn.textContent = old, 1500);
  });

  document.getElementById('btnGoSetup').addEventListener('click', () => {
    PeerNet.send({ type: 'goto-setup' });
    showScreen('screen-setup');
    renderSetupOptions();
  });

  // ---------- SETUP ----------
  function chipRow(container, items, currentId, onPick) {
    container.innerHTML = '';
    items.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'option-chip' + (item.id === currentId ? ' selected' : '');
      if (item.color) {
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = item.color;
        chip.appendChild(sw);
      }
      chip.appendChild(document.createTextNode(item.label));
      chip.addEventListener('click', () => onPick(item.id));
      container.appendChild(chip);
    });
  }

  function renderSetupOptions() {
    chipRow(document.getElementById('formatOptions'), FORMATS, AppState.settings.formatId, (id) => {
      AppState.settings.formatId = id; broadcastSettings(); renderSetupOptions();
    });
    chipRow(document.getElementById('frameOptions'), FRAMES, AppState.settings.frameId, (id) => {
      AppState.settings.frameId = id; broadcastSettings(); renderSetupOptions();
    });
    chipRow(document.getElementById('filterOptions'), FILTERS, AppState.settings.filterId, (id) => {
      AppState.settings.filterId = id; broadcastSettings(); renderSetupOptions();
    });

    const startBtn = document.getElementById('btnStartSequence');
    if (AppState.role === 'guest') {
      startBtn.classList.add('hidden');
    } else {
      startBtn.classList.remove('hidden');
    }
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

  Booth.init({ localVideoEl: localVideo2, remoteVideoEl: remoteVideo2 });

  Booth.onProgress = (index, total) => {
    captureProgress.textContent = `Photo ${Math.min(index + 1, total)} / ${total}`;
  };
  Booth.onCountdown = (n) => {
    if (n == null) { countdownOverlay.classList.add('hidden'); return; }
    countdownOverlay.classList.remove('hidden');
    countdownNumber.textContent = n;
  };
  Booth.onRest = (s) => {
    if (s == null) { restOverlay.classList.add('hidden'); return; }
    restOverlay.classList.remove('hidden');
    restText.textContent = `Prochaine pose dans ${s}…`;
  };
  Booth.onFlash = () => {
    flashOverlay.classList.remove('flashing');
    void flashOverlay.offsetWidth;
    flashOverlay.classList.add('flashing');
  };
  Booth.onDone = () => {
    showScreen('screen-select');
    renderPhotoGrid();
  };

  // ---------- SELECT ----------
  function renderPhotoGrid() {
    const format = currentFormat();
    document.getElementById('keepCountLabel').textContent = format.keep;
    const grid = document.getElementById('photoGrid');
    grid.innerHTML = '';
    AppState.photos.forEach((url, i) => {
      const div = document.createElement('div');
      div.className = 'photo-thumb' + (AppState.selectedIndices.includes(i) ? ' selected' : '');
      div.innerHTML = `<img src="${url}"><span class="check">✓</span>`;
      div.addEventListener('click', () => toggleSelect(i));
      grid.appendChild(div);
    });
    const hint = document.getElementById('selectHint');
    hint.textContent = `${AppState.selectedIndices.length} / ${format.keep} sélectionnées`;
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
  }

});
