/**
 * src/ballet-audio.js — Zero-Dependency Ambient Wind Pad & Pentatonic Chime Engine
 */

export function createBalletAudio() {
  let muted = true;
  let ctx = null;
  let padTimer = null;

  const ensureCtx = () => {
    if (!ctx && typeof window !== "undefined") {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) ctx = new Ctor();
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  const triggerBell = (freqHz, durationSec = 1.6, peakGain = 0.04) => {
    if (muted) return;
    const ac = ensureCtx();
    if (!ac) return;

    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const overtone = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freqHz, now);

    overtone.type = "triangle";
    overtone.frequency.setValueAtTime(freqHz * 2.0, now);

    const overGain = ac.createGain();
    overGain.gain.setValueAtTime(0.22, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    overtone.connect(overGain);
    overGain.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + durationSec + 0.05);
    overtone.stop(now + durationSec + 0.05);
  };

  const startAmbientPad = () => {
    const ac = ensureCtx();
    if (!ac) return;
    if (padTimer) clearInterval(padTimer);

    const playPadChord = () => {
      if (muted || !ctx) return;
      [130.81, 196.0, 293.66].forEach((freq) => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(420, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.015, now + 1.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 4.3);
      });
    };

    playPadChord();
    padTimer = setInterval(playPadChord, 4000);
  };

  const stopAmbientPad = () => {
    if (padTimer) {
      clearInterval(padTimer);
      padTimer = null;
    }
  };

  return {
    isMuted: () => muted,
    toggleMute: () => {
      muted = !muted;
      if (!muted) {
        startAmbientPad();
      } else {
        stopAmbientPad();
      }
      return muted;
    },
    playTravelerChime: (alignedCount = 0) => {
      const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
      triggerBell(notes[alignedCount % notes.length], 1.4, 0.035);
    },
    playThreadAligned: (freqHz) => {
      triggerBell(freqHz, 2.2, 0.05);
    },
    playSummitChord: () => {
      [261.63, 329.63, 392.0, 523.25, 783.99].forEach((f, idx) => {
        setTimeout(() => triggerBell(f, 3.2, 0.032), idx * 140);
      });
    },
  };
}
