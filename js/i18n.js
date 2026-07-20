const I18N = {
  fr: {
    appTitle: "둘의 부스 — Photobooth à deux",
    login: {
      subtitle: "Connecte-toi pour accéder à votre photobooth.",
      placeholderEmail: "Identifiant",
      placeholderPassword: "Mot de passe",
      button: "Se connecter",
      errorEmpty: "Entre l'identifiant et le mot de passe.",
      errorWrong: "Identifiant ou mot de passe incorrect.",
    },
    topbar: { history: "📖 Historique", logout: "Se déconnecter" },
    home: {
      title: "Prenez-vous en photo,<br>même à distance.",
      subtitle: "Crée une salle, envoie le lien à ta copine, souriez ensemble. Chaque salle est unique et limitée à deux personnes.",
      createTitle: "Créer une salle",
      createHint: "Tu deviens l'hôte, tu lances la séance.",
      createButton: "Créer ma salle",
      or: "ou",
      joinTitle: "Rejoindre une salle",
      joinHint: "Colle le code reçu par ta moitié.",
      joinPlaceholder: "ex : LUNE-42",
      joinButton: "Rejoindre",
      errorCameraCreate: "Impossible de créer la salle. Vérifie l'accès à ta caméra et réessaie.",
      errorEmptyCode: "Entre le code de la salle.",
      errorNotFound: "Salle introuvable. Vérifie le code ou demande un nouveau lien.",
      errorFull: "Cette salle est déjà complète (2 personnes maximum).",
      errorGeneric: "Une erreur de connexion est survenue. Réessaie.",
    },
    waiting: {
      roomPrefix: "Salle",
      shareHint: "Partage ce lien avec ta copine :",
      copy: "Copier", copied: "Copié !",
      you: "Toi", her: "Elle",
      waitingPlaceholder: "En attente de connexion…",
      goButton: "On y va →",
      hintWaitingForHer: "En attente que ta copine se connecte…",
      hintHostReady: "Ta copine est connectée. Quand vous êtes prêtes, on y va !",
      hintGuestReady: "Connectée ! En attente que l'hôte démarre…",
      hintDisconnected: "La connexion a été coupée.",
    },
    setup: {
      title: "Choisissez votre format",
      formatHeader: "Format de bande", frameHeader: "Couleur du cadre",
      filterHeader: "Filtre", countdownHeader: "Décompte",
      startButton: "Démarrer la séance 📸",
      syncHint: "Les deux écrans se synchronisent automatiquement.",
    },
    formats: { strip4: '4 poses (bande)', strip3: '3 poses (bande)', grid4: '4 poses (grille)' },
    frames: { pink:'Rose', mint:'Menthe', lavender:'Lavande', yellow:'Beurre', plum:'Prune', white:'Blanc', sunset:'Coucher de soleil', dreamy:'Rêverie', hearts:'Petits cœurs', polaroid:'Polaroid' },
    filters: { none:'Naturel', bw:'Noir & blanc', sepia:'Rétro', bright:'Lumineux' },
    countdowns: { c3:'3 s', c5:'5 s', c10:'10 s' },
    capture: {
      photoProgress: 'Photo {i} / {n}',
      retakeProgress: 'Reprise de la photo {i}',
      restText: 'Prochaine pose dans {s}…',
    },
    select: {
      title: 'Choisissez vos {n} préférées',
      hint: '{count} / {n} sélectionnées',
      retake: '🔄 Reprendre',
      continue: 'Continuer →',
    },
    edit: {
      title: 'Décorez votre bande',
      messageHeader: 'Message (optionnel)',
      messagePlaceholder: 'Un petit mot...',
      stickersHeader: 'Stickers',
      stickersHint: "Clique un sticker puis clique sur la bande pour le poser. Glisse pour déplacer, reclique sans glisser pour retirer, molette pour redimensionner.",
      clearButton: 'Tout effacer',
      restartButton: 'Nouvelle séance',
      shareButton: 'Partager',
      downloadButton: 'Télécharger 💾',
    },
    history: {
      title: 'Vos bandes précédentes',
      subtitle: 'Enregistrées uniquement dans ce navigateur, sur cet appareil.',
      empty: "Aucune bande enregistrée pour l'instant. Elles apparaissent ici dès que vous en téléchargez une.",
      download: 'Télécharger', delete: 'Supprimer',
      clearAll: 'Tout effacer', back: '← Retour',
    },
    conn: { connecting: 'Connexion…', connected: 'Connecté(e)', disconnected: 'Déconnecté(e)' },
  },

  kr: {
    appTitle: "둘의 부스 — 함께 찍는 포토부스",
    login: {
      subtitle: "포토부스에 접속하려면 로그인하세요.",
      placeholderEmail: "아이디",
      placeholderPassword: "비밀번호",
      button: "로그인",
      errorEmpty: "아이디와 비밀번호를 입력하세요.",
      errorWrong: "아이디 또는 비밀번호가 올바르지 않습니다.",
    },
    topbar: { history: "📖 기록", logout: "로그아웃" },
    home: {
      title: "멀리 있어도<br>함께 사진을 찍어요.",
      subtitle: "방을 만들고 링크를 보내서 함께 웃어보세요. 각 방은 단 두 명만 입장할 수 있어요.",
      createTitle: "방 만들기",
      createHint: "당신이 호스트가 되어 촬영을 시작해요.",
      createButton: "방 만들기",
      or: "또는",
      joinTitle: "방 참여하기",
      joinHint: "받은 코드를 입력하세요.",
      joinPlaceholder: "예: LUNE-42",
      joinButton: "참여하기",
      errorCameraCreate: "방을 만들 수 없습니다. 카메라 접근 권한을 확인하고 다시 시도하세요.",
      errorEmptyCode: "방 코드를 입력하세요.",
      errorNotFound: "방을 찾을 수 없습니다. 코드를 확인하거나 새 링크를 요청하세요.",
      errorFull: "이 방은 이미 가득 찼습니다 (최대 2인).",
      errorGeneric: "연결 오류가 발생했습니다. 다시 시도하세요.",
    },
    waiting: {
      roomPrefix: "방",
      shareHint: "이 링크를 상대에게 보내세요:",
      copy: "복사", copied: "복사됨!",
      you: "나", her: "상대",
      waitingPlaceholder: "연결을 기다리는 중…",
      goButton: "시작하기 →",
      hintWaitingForHer: "상대가 접속하기를 기다리는 중…",
      hintHostReady: "상대가 연결되었습니다. 준비되면 시작하세요!",
      hintGuestReady: "연결됨! 호스트가 시작하기를 기다리는 중…",
      hintDisconnected: "연결이 끊어졌습니다.",
    },
    setup: {
      title: "포맷을 선택하세요",
      formatHeader: "필름 포맷", frameHeader: "프레임 색상",
      filterHeader: "필터", countdownHeader: "카운트다운",
      startButton: "촬영 시작 📸",
      syncHint: "두 화면이 자동으로 동기화됩니다.",
    },
    formats: { strip4: '4컷 (스트립)', strip3: '3컷 (스트립)', grid4: '4컷 (그리드)' },
    frames: { pink:'핑크', mint:'민트', lavender:'라벤더', yellow:'버터', plum:'플럼', white:'화이트', sunset:'선셋', dreamy:'드리미', hearts:'하트무늬', polaroid:'폴라로이드' },
    filters: { none:'자연스럽게', bw:'흑백', sepia:'레트로', bright:'화사하게' },
    countdowns: { c3:'3초', c5:'5초', c10:'10초' },
    capture: {
      photoProgress: '사진 {i} / {n}',
      retakeProgress: '{i}번째 사진 다시 찍기',
      restText: '{s}초 후 다음 포즈…',
    },
    select: {
      title: '가장 좋아하는 {n}장을 선택하세요',
      hint: '{count} / {n} 선택됨',
      retake: '🔄 다시 찍기',
      continue: '계속 →',
    },
    edit: {
      title: '스트립을 꾸며보세요',
      messageHeader: '메시지 (선택)',
      messagePlaceholder: '짧은 메시지를 남겨보세요...',
      stickersHeader: '스티커',
      stickersHint: '스티커를 선택한 뒤 스트립을 클릭해 붙이세요. 드래그로 이동, 이동 없이 다시 클릭하면 삭제, 스크롤로 크기 조절.',
      clearButton: '모두 지우기',
      restartButton: '새로운 촬영',
      shareButton: '공유하기',
      downloadButton: '다운로드 💾',
    },
    history: {
      title: '이전 스트립',
      subtitle: '이 브라우저, 이 기기에만 저장됩니다.',
      empty: '아직 저장된 스트립이 없습니다. 다운로드하면 여기에 나타나요.',
      download: '다운로드', delete: '삭제',
      clearAll: '모두 지우기', back: '← 뒤로',
    },
    conn: { connecting: '연결 중…', connected: '연결됨', disconnected: '연결 끊김' },
  },
};

let currentLang = localStorage.getItem('photobooth_lang') || 'fr';

function t(path, vars) {
  const dict = I18N[currentLang] || I18N.fr;
  const lookup = (root) => path.split('.').reduce((v, k) => (v ? v[k] : undefined), root);
  let val = lookup(dict);
  if (val == null) val = lookup(I18N.fr);
  if (val == null) return path;
  if (vars) {
    Object.keys(vars).forEach(k => { val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]); });
  }
  return val;
}

function applyStaticTranslations() {
  document.title = t('appTitle');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent = currentLang === 'fr' ? '한국어' : 'Français';
  });
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('photobooth_lang', lang);
  applyStaticTranslations();
  if (window.onLangChange) window.onLangChange();
}

function toggleLang() {
  setLang(currentLang === 'fr' ? 'kr' : 'fr');
}

document.addEventListener('DOMContentLoaded', () => {
  applyStaticTranslations();
  document.querySelectorAll('.lang-toggle').forEach(btn => btn.addEventListener('click', toggleLang));
});
