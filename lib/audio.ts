let context: AudioContext | null = null;
let master: GainNode | null = null;
let timer = 0;
let step = 0;
let nextTime = 0;
let running = false;

const chords = [
  [220, 261.63, 329.63, 392],
  [174.61, 220, 261.63, 329.63],
  [196, 246.94, 293.66, 349.23],
  [174.61, 220, 261.63, 329.63],
];

const bass = [110, 87.31, 98, 82.41];
const melody = [440, 392, 349.23, 329.63, 392, 440, 493.88, 440];

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    context = new Ctx();
    master = context.createGain();
    master.gain.value = 0.045;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1600;
    master.connect(filter);
    filter.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(freq: number, time: number, duration: number, type: OscillatorType, volume: number) {
  if (!context || !master) return;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + duration + 0.02);
}

function brush(time: number) {
  if (!context || !master) return;
  const length = Math.floor(context.sampleRate * 0.08);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1200;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.03, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  noise.start(time);
  noise.stop(time + 0.09);
}

function schedule() {
  if (!context || !running) return;
  const beat = 60 / 78;
  while (nextTime < context.currentTime + 0.4) {
    const bar = Math.floor(step / 8) % chords.length;
    const eighth = step % 8;
    const swing = eighth % 2 === 0 ? beat * 0.62 : beat * 0.38;
    if (eighth % 2 === 0) {
      tone(bass[bar] * (eighth === 4 ? 1.5 : 1), nextTime, beat * 0.7, "sine", 0.12);
      brush(nextTime);
    }
    if (eighth === 0 || eighth === 4) {
      for (const freq of chords[bar]) tone(freq, nextTime, beat * 1.4, "triangle", 0.025);
    }
    if (eighth === 2 || eighth === 6) {
      tone(melody[(bar * 2 + (eighth === 6 ? 1 : 0)) % melody.length], nextTime, beat * 0.5, "sine", 0.03);
    }
    nextTime += swing;
    step += 1;
  }
}

export const jazz = {
  start() {
    const ctx = ensure();
    if (!ctx || running) return;
    running = true;
    nextTime = ctx.currentTime + 0.05;
    step = 0;
    schedule();
    timer = window.setInterval(schedule, 120);
  },
  stop() {
    running = false;
    window.clearInterval(timer);
  },
  set(on: boolean) {
    if (on) this.start();
    else this.stop();
  },
};

export function playSfx(kind: "chip" | "card" | "win" | "lose", enabled: boolean) {
  if (!enabled) return;
  const ctx = ensure();
  if (!ctx) return;
  const now = ctx.currentTime;
  if (kind === "chip") {
    tone(880, now, 0.08, "sine", 0.05);
    tone(1320, now + 0.06, 0.1, "sine", 0.04);
  } else if (kind === "card") {
    tone(240, now, 0.05, "triangle", 0.04);
  } else if (kind === "win") {
    [523, 659, 784].forEach((freq, index) => tone(freq, now + index * 0.08, 0.18, "triangle", 0.05));
  } else {
    tone(196, now, 0.2, "sine", 0.04);
  }
}
