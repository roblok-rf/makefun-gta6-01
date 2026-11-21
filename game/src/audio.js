// audio.js — all sound is synthesized live with WebAudio: engine hum, siren
// wail, gunshots, punches, pickups and mission jingles. No audio files, no
// network, nothing to load. The context starts on the first user gesture.
let ctx = null;
let engineOsc = null;
let engineGain = null;
let muted = false;

export function setMuted(m) { muted = m; if (engineGain) engineGain.gain.value = 0; }
export function isMuted() { return muted; }

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(ctx.destination);
    engineOsc.start();
  } catch { ctx = null; }
}

export function engineSound(speed, driving) {
  if (!ctx || !engineGain || muted) return;
  const target = driving ? 0.02 + Math.min(0.05, Math.abs(speed) / 9000) : 0;
  engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
  if (engineOsc) engineOsc.frequency.setTargetAtTime(50 + Math.abs(speed) * 0.12, ctx.currentTime, 0.1);
}

function tone(freq, dur, type = 'sine', vol = 0.15, slideTo = 0) {
  if (!ctx || muted) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    // Clamp the slide target so exponential ramps never hit zero.
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* audio is best-effort */ }
}

function noise(dur, vol = 0.2) {
  if (!ctx || muted) return;
  try {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(g); g.connect(ctx.destination);
    src.start();
  } catch { /* best-effort */ }
}

let sirenT = 0;
export function sirenSound(dt, wanted) {
  if (!ctx || muted || wanted === 0) return;
  sirenT -= dt;
  if (sirenT <= 0) {
    sirenT = 0.9;
    tone(720, 0.42, 'sine', 0.05, 980);
    setTimeout(() => tone(980, 0.42, 'sine', 0.05, 720), 420);
  }
}

export function sfx(name) {
  if (!ctx || muted) return;
  switch (name) {
    case 'shot': noise(0.12, 0.35); tone(180, 0.1, 'square', 0.12, 60); break;
    case 'punch': noise(0.08, 0.2); break;
    case 'pickup': tone(660, 0.12, 'sine', 0.18); setTimeout(() => tone(880, 0.18, 'sine', 0.18), 90); break;
    case 'mission': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.18), i * 110)); break;
    case 'cash': tone(1200, 0.1, 'sine', 0.15, 1600); break;
    case 'busted': tone(220, 0.5, 'sawtooth', 0.15, 110); break;
    case 'click': tone(440, 0.05, 'square', 0.08); break;
    default: tone(440, 0.1, 'sine', 0.1);
  }
}
