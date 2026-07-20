// ---- Constants ----
const FORMATS = [
  { id: 'strip4', shots: 6, keep: 4, layout: 'strip' },
  { id: 'strip3', shots: 5, keep: 3, layout: 'strip' },
  { id: 'grid4',  shots: 6, keep: 4, layout: 'grid' },
];

const FRAMES = [
  { id: 'pink',     color: '#FFC9DD' },
  { id: 'mint',     color: '#BDEBD5' },
  { id: 'lavender', color: '#DCD0F5' },
  { id: 'yellow',   color: '#FFE9A8' },
  { id: 'plum',     color: '#3B2A46' },
  { id: 'white',    color: '#FFFFFF' },
  { id: 'sunset',   gradient: ['#FFD3A5', '#FD6585'] },
  { id: 'dreamy',   gradient: ['#B8F1D9', '#DCD0F5'] },
  { id: 'hearts',   pattern: 'hearts', color: '#FFF3F7' },
  { id: 'polaroid', polaroid: true, color: '#FFFFFF' },
];

const FILTERS = [
  { id: 'none',   css: 'none' },
  { id: 'bw',     css: 'grayscale(1) contrast(1.05)' },
  { id: 'sepia',  css: 'sepia(0.55) contrast(1.05) saturate(1.1)' },
  { id: 'bright', css: 'brightness(1.12) saturate(1.2)' },
];

const COUNTDOWN_OPTIONS = [
  { id: 'c3',  seconds: 3 },
  { id: 'c5',  seconds: 5 },
  { id: 'c10', seconds: 10 },
];

const STICKER_EMOJIS = ['💗','✨','⭐','🌸','😊','😘','🎀','🐻','🍓','☁️','🔥','💫','🌈','🥰','👍','💌'];

const REST_SECONDS = 3;
const PREVIEW_MS = 1300;

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
    countdownId: 'c3',
  },

  photos: [],           // array of dataURLs, each a composite of both faces for one shot
  selectedIndices: [],  // indices into photos[] chosen to keep
  stickers: [],         // {id, emoji, x, y, size}  x/y in final canvas coordinate space
  customText: '',        // optional free message printed on the strip

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
function currentCountdownSeconds() {
  const c = COUNTDOWN_OPTIONS.find(c => c.id === AppState.settings.countdownId);
  return c ? c.seconds : 3;
}

function genRoomCode() {
  const words = ['LUNE','ROSE','MIEL','SOIE','PERLE','NUIT','CIEL','FLEUR'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-${n}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}
