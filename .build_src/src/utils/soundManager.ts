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

let _enabled = false;
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

// Auto-init on any click/touch
if (typeof window !== 'undefined') {
  const initEvents = ['click', 'touchstart', 'keydown'];
  const onceInit = () => {
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
