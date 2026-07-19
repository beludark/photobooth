// ---- Constants ----
const FORMATS = [
  { id: 'strip4', label: '4 poses (bande)', shots: 6, keep: 4, layout: 'strip' },
  { id: 'strip3', label: '3 poses (bande)', shots: 5, keep: 3, layout: 'strip' },
  { id: 'grid4',  label: '4 poses (grille)', shots: 6, keep: 4, layout: 'grid' },
];

const FRAMES = [
  { id: 'pink',   label: 'Rose',    color: '#FFC9DD' },
  { id: 'mint',   label: 'Menthe',  color: '#BDEBD5' },
  { id: 'lavender', label: 'Lavande', color: '#DCD0F5' },
  { id: 'yellow', label: 'Beurre',  color: '#FFE9A8' },
  { id: 'plum',   label: 'Prune',   color: '#3B2A46' },
  { id: 'white',  label: 'Blanc',   color: '#FFFFFF' },
];

const FILTERS = [
  { id: 'none',   label: 'Naturel', css: 'none' },
  { id: 'bw',     label: 'Noir & blanc', css: 'grayscale(1) contrast(1.05)' },
  { id: 'sepia',  label: 'Rétro', css: 'sepia(0.55) contrast(1.05) saturate(1.1)' },
  { id: 'bright', label: 'Lumineux', css: 'brightness(1.12) saturate(1.2)' },
];

const STICKER_EMOJIS = ['💗','✨','⭐','🌸','😊','😘','🎀','🐻','🍓','☁️','🔥','💫','🌈','🥰','👍','💌'];

const COUNTDOWN_SECONDS = 3;
const REST_SECONDS = 3;

// ---- Mutable shared state ----
const AppState = {
  role: null,           // 'host' | 'guest'
  roomCode: null,
  connected: false,
  step: 'home',

  settings: {
    formatId: 'strip4',
    frameId: 'pink',
    filterId: 'none',
  },

  photos: [],           // array of dataURLs, each a composite of both faces for one shot
  selectedIndices: [],  // indices into photos[] chosen to keep
  stickers: [],         // {emoji, x, y, size}  x/y in final canvas coordinate space

  captureInProgress: false,
};

function currentFormat() {
  return FORMATS.find(f => f.id === AppState.settings.formatId) || FORMATS[0];
}
function currentFrame() {
  return FRAMES.find(f => f.id === AppState.settings.frameId) || FRAMES[0];
}
function currentFilter() {
  return FILTERS.find(f => f.id === AppState.settings.filterId) || FILTERS[0];
}

function genRoomCode() {
  const words = ['LUNE','ROSE','MIEL','SOIE','PERLE','NUIT','CIEL','FLEUR'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-${n}`;
}
