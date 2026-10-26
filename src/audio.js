// WebAudio 合成的音效与 BGM，无外部音频文件
let ctx = null;
let master = null;
let bgmGain = null;
let windGain = null;
let noiseBuffer = null;
let muted = false;
let bgmTimer = null;
let nextNoteTime = 0;
let noteIndex = 0;
let stepScale = 1; // 存活越久节奏越快

export function setBgmTempo(seconds) {
  stepScale = 1 / (1 + Math.min(0.9, seconds * 0.007));
}

const STEP = 0.21; // 八分音符时长（秒）
// C 大调两段循环：旋律 + 低音
const LEAD = [76, 79, 81, 79, 76, 74, 72, 74, 76, 79, 84, 81, 79, 76, 74, 72];
const BASS = [48, 43, 52, 43, 48, 43, 52, 43, 45, 40, 45, 40, 53, 48, 43, 43];

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.9;
  bgmGain.connect(master);
  // 风声：循环白噪声过低通，增益随速度
  const length = ctx.sampleRate * 2;
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 480;
  windGain = ctx.createGain();
  windGain.gain.value = 0;
  source.connect(filter).connect(windGain).connect(master);
  source.start();
}

export function isMuted() { return muted; }

export function setMuted(value) {
  muted = value;
  if (master) master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.03);
  if (value) stopBgm();
}

export function setWind(speed) {
  if (!ctx || !windGain) return;
  const target = Math.min(0.16, speed * 0.006);
  windGain.gain.setTargetAtTime(target, ctx.currentTime, 0.2);
}

function tone(type, midi, at, duration, volume, slideTo = null, destination = master) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq(midi), at);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(freq(slideTo), at + duration);
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
  osc.connect(gain).connect(destination);
  osc.start(at);
  osc.stop(at + duration + 0.03);
}

function noiseBurst(at, duration, volume) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 700;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
  source.connect(filter).connect(gain).connect(master);
  source.start(at);
  source.stop(at + duration + 0.03);
}

function scheduleStep(at, index) {
  tone('square', LEAD[index], at, STEP * stepScale * 0.9, 0.045, null, bgmGain);
  tone('triangle', BASS[index], at, STEP * stepScale * 1.7, 0.09, null, bgmGain);
}

function schedulerTick() {
  while (nextNoteTime < ctx.currentTime + 0.6) {
    scheduleStep(nextNoteTime, noteIndex % LEAD.length);
    nextNoteTime += STEP * stepScale;
    noteIndex += 1;
  }
}

export function startBgm() {
  if (!ctx || bgmTimer) return;
  noteIndex = 0;
  nextNoteTime = ctx.currentTime + 0.06;
  bgmTimer = setInterval(schedulerTick, 180);
}

export function stopBgm() {
  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

function guard() { return ctx && !muted; }

export const sfx = {
  collect() {
    if (!guard()) return;
    const t = ctx.currentTime;
    tone('triangle', 88, t, 0.09, 0.16);
    tone('triangle', 93, t + 0.07, 0.12, 0.14);
  },
  heart() {
    if (!guard()) return;
    const t = ctx.currentTime;
    for (const [i, midi] of [72, 76, 79].entries()) tone('sine', midi, t + i * 0.05, 0.35, 0.14);
  },
  crash() {
    if (!guard()) return;
    const t = ctx.currentTime;
    noiseBurst(t, 0.28, 0.3);
    tone('square', 45, t, 0.32, 0.22, 33);
  },
  finish() {
    if (!guard()) return;
    const t = ctx.currentTime;
    for (const [i, midi] of [72, 76, 79, 84].entries()) tone('triangle', midi, t + i * 0.11, 0.3, 0.16);
  },
  fail() {
    if (!guard()) return;
    const t = ctx.currentTime;
    for (const [i, midi] of [67, 63, 60, 55].entries()) tone('sawtooth', midi, t + i * 0.16, 0.28, 0.1);
  },
};
