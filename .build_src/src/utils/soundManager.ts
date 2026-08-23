// ============================================================
// Sound Manager — Web Audio API procedural sound generation
// No external audio files needed. Zero bundle size overhead.
// ============================================================

let audioCtx: AudioContext | null = null;
let ambientNodes: {
  gain: GainNode;
  lfo: OscillatorNode;
  _oscillators: OscillatorNode[];
} | null = null;

let _enabled = true;
let _initialized = false;

function getCtx(): AudioContext | null {
  if (!_enabled) return null;
  if (!audioCtx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Initialize audio on first user interaction (browser policy) */
function ensureInit() {
  if (_initialized) return;
  _initialized = true;
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// Auto-init on any click/touch — also retry BGM if autoplay was blocked
if (typeof window !== 'undefined') {
  const initEvents = ['click', 'touchend', 'keydown'];
  const onceInit = () => {
    // Play BGM first — must be the first call inside user gesture handler
    if (_bgmEnabled && bgmAudio && bgmAudio.paused && currentTrack) {
      bgmAudio.play().catch(() => {});
    }
    ensureInit();
    initEvents.forEach((e) => window.removeEventListener(e, onceInit));
  };
  initEvents.forEach((e) => window.addEventListener(e, onceInit, { passive: true }));
}

// ============================================================
// Sound Effects
// ============================================================

/** Bubble pop — quick pitch-drop sine */
export function playBubblePop() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

/** Page turn — short noise burst simulating paper rustle */
export function playPageTurn() {
  const ctx = getCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * 0.04; // 40ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // decaying noise
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.5;
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime);
}

/** Reaction sounds — different timbre per type */
export function playReaction(type: string) {
  const ctx = getCtx();
  if (!ctx) return;

  if (type === 'heart') {
    // Gentle bell — two harmonic sine tones
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.03;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } else if (type === 'like') {
    // Light woodblock — short triangle + low sine
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } else if (type === 'share') {
    // Whoosh — noise sweep downward
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  }
}

// ============================================================
// Ambient Sound (meditative drone)
// ============================================================

export function startAmbient(variant: 'breathing' | 'slideshow' = 'breathing') {
  const ctx = getCtx();
  if (!ctx) return;
  stopAmbient();

  // Create sustained multi-oscillator drone
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);

  const freqs = variant === 'breathing'
    ? [110, 164.81, 196]  // A2, E3, G3 — calming
    : [146.83, 220, 261.63]; // D3, A3, C4 — slightly brighter

  const oscillators: OscillatorNode[] = [];
  freqs.forEach((f) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    g.gain.value = 0.3;
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    oscillators.push(osc);
  });

  // Subtle LFO volume modulation (breathing-like)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.2; // 5-second breath cycle
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);
  lfo.start();

  ambientNodes = {
    gain: masterGain,
    lfo,
    _oscillators: oscillators,
  };
}

export function stopAmbient() {
  if (!ambientNodes || !audioCtx) return;
  const nodes = ambientNodes;

  // Fade out over 1 second
  nodes.gain.gain.cancelScheduledValues(audioCtx.currentTime);
  nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, audioCtx.currentTime);
  nodes.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);

  // Stop all oscillators after fade
  setTimeout(() => {
    nodes._oscillators.forEach((o) => { try { o.stop(); } catch {} });
    try { nodes.lfo.stop(); } catch {}
  }, 1100);

  ambientNodes = null;
}

// ============================================================
// Global Enable / Disable
// ============================================================

export function setSoundEnabled(enabled: boolean) {
  _enabled = enabled;
  if (!enabled) {
    stopAmbient();
  } else {
    ensureInit();
  }
}

export function isSoundEnabled(): boolean {
  return _enabled;
}

/** Toggle and return new state */
export function toggleSound(): boolean {
  _enabled = !_enabled;
  if (!_enabled) {
    stopAmbient();
  } else {
    ensureInit();
  }
  return _enabled;
}

// ============================================================
// Background Music (HTML5 Audio)
// ============================================================

type MusicTrack = 'healing' | 'gallery' | 'ending' | null;

const MUSIC_URLS: Record<string, string> = {
  healing: '/music/healing.mp3',
  gallery: '/music/gallery.mp3',
  ending: '/music/ending.mp3',
};

let bgmAudio: HTMLAudioElement | null = null;
let currentTrack: MusicTrack = null;
let _bgmEnabled = true; // default ON — user can toggle off
let _bgmVolume = 0.3;

function createAudio(url: string): HTMLAudioElement {
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = _bgmVolume;
  audio.preload = 'auto';
  return audio;
}

/** Play a background music track — sequential fade out then fade in */
export function playMusic(track: MusicTrack) {
  if (track === currentTrack) return;

  const prevAudio = bgmAudio;
  currentTrack = track;

  if (!track) {
    // Stop current music
    if (prevAudio) {
      fadeOutAudio(prevAudio, 3000, () => {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      });
    }
    bgmAudio = null;
    return;
  }

  // Sequential transition: fade out old → then fade in new
  const startNewTrack = () => {
    const newAudio = createAudio(MUSIC_URLS[track]);

    // Slow down Canon for healing gallery pace (target ~60 BPM from ~72 BPM)
    if (track === 'gallery') {
      newAudio.playbackRate = 0.85;
    }

    newAudio.addEventListener('canplaythrough', () => {
      newAudio.play().catch(() => {});
    }, { once: true });

    newAudio.addEventListener('error', () => {
      console.warn('[BGM] Failed to load:', MUSIC_URLS[track]);
    }, { once: true });

    bgmAudio = newAudio;
    newAudio.load();
  };

  if (prevAudio) {
    // Fade out old track first, then start new track
    fadeOutAudio(prevAudio, 3000, () => {
      prevAudio.pause();
      prevAudio.currentTime = 0;
      startNewTrack();
    });
  } else {
    // No old track — start new track immediately
    startNewTrack();
  }
}

// Smooth ease-in-out curve for natural volume transitions
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function fadeInAudio(audio: HTMLAudioElement, durationMs: number) {
  const start = audio.volume || 0;
  const end = _bgmVolume;
  const startTime = performance.now();

  function tick(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = easeInOutQuad(progress);
    audio.volume = start + (end - start) * eased;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function fadeOutAudio(audio: HTMLAudioElement, durationMs: number, onComplete?: () => void) {
  const start = audio.volume || _bgmVolume;
  const startTime = performance.now();

  function tick(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = easeInOutQuad(progress);
    audio.volume = start * (1 - eased);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  }
  requestAnimationFrame(tick);
}

export function setBgmEnabled(enabled: boolean) {
  _bgmEnabled = enabled;
  if (!enabled) {
    playMusic(null);
  } else if (currentTrack) {
    playMusic(currentTrack);
  }
}

export function isBgmEnabled(): boolean {
  return _bgmEnabled;
}

export function toggleBgm(): boolean {
  _bgmEnabled = !_bgmEnabled;
  setBgmEnabled(_bgmEnabled);
  return _bgmEnabled;
}

export function setBgmVolume(vol: number) {
  _bgmVolume = Math.max(0, Math.min(1, vol));
  if (bgmAudio) bgmAudio.volume = _bgmVolume;
}

export function getBgmVolume(): number {
  return _bgmVolume;
}

export function getCurrentTrack(): MusicTrack {
  return currentTrack;
}
