// Tiny synthesised sound effects (no audio files needed).

let ctx = null;
let enabled = true;

export function setSoundEnabled(v) {
  enabled = v;
}

function audio() {
  if (!enabled) return null;
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try {
      ctx = new C();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'square', vol = 0.06, at = 0, slide } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  click: () => tone(660, 0.05, { vol: 0.03 }),
  select: () => tone(520, 0.06, { vol: 0.04, type: 'triangle' }),
  correct: () => {
    tone(880, 0.09, { type: 'triangle', vol: 0.08 });
    tone(1320, 0.14, { type: 'triangle', vol: 0.08, at: 0.08 });
  },
  wrong: () => tone(180, 0.25, { type: 'sawtooth', vol: 0.05, slide: 110 }),
  orb: () => tone(1400 + Math.random() * 600, 0.08, { type: 'sine', vol: 0.06 }),
  complete: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.07, at: i * 0.1 })),
  levelup: () => [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.12, { type: 'square', vol: 0.04, at: i * 0.07 })),
  coin: () => {
    tone(988, 0.06, { vol: 0.05 });
    tone(1319, 0.12, { vol: 0.05, at: 0.06 });
  },
  boom: () => tone(120, 0.4, { type: 'sawtooth', vol: 0.06, slide: 40 }),
};
