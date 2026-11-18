/**
 * src/ballet-threads.js — Declarative Nine-Rasa Chromatic Threads & Breath Envelopes
 * Encodes the nine interleaved micro-curvatures from Spiral 1 — Stage 3: Cosmic Ballet
 * with hex palette tints, micro-motions, pentatonic chime frequencies, and poetic E-stream whispers.
 *
 * Signed-off-by: Borealis Serenity Hedling <chguard-sentinel@vaked.dev>
 */

import { toQ16 } from "./core.js";

export const NINE_RASA_THREADS = [
  {
    id: "sringara",
    name: "Śṛṅgāra",
    motion: "attraction",
    color: "#f9a8d4", // Rose-blush
    glow: "rgba(249, 168, 212, 0.45)",
    freqHz: 261.63,   // C4
    liftBiasQ16: toQ16(-18.0),
    whisper: "The rose-blush of Śṛṅgāra rises—a gentle attraction lifting your ribbon.",
  },
  {
    id: "hasya",
    name: "Hāsya",
    motion: "levity",
    color: "#fef08a", // Pale laughter-yellow
    glow: "rgba(254, 240, 138, 0.45)",
    freqHz: 293.66,   // D4
    liftBiasQ16: toQ16(-24.0),
    whisper: "The pale laughter-yellow of Hāsya drifts—weightless levity across open air.",
  },
  {
    id: "raudra",
    name: "Raudra",
    motion: "intensity",
    color: "#fca5a5", // Muted ember-red
    glow: "rgba(252, 165, 165, 0.45)",
    freqHz: 329.63,   // E4
    liftBiasQ16: toQ16(-12.0),
    whisper: "The muted ember-red of Raudra warms—quiet intensity without friction.",
  },
  {
    id: "karuna",
    name: "Karuṇa",
    motion: "tenderness",
    color: "#93c5fd", // Soft sorrow-blue
    glow: "rgba(147, 197, 253, 0.45)",
    freqHz: 392.00,   // G4
    liftBiasQ16: toQ16(8.0),
    whisper: "The soft sorrow-blue of Karuṇa weaves close—tenderness answering stillness.",
  },
  {
    id: "bibhatsa",
    name: "Bībhatsa",
    motion: "recoil",
    color: "#86efac", // Cool distaste-green
    glow: "rgba(134, 239, 172, 0.45)",
    freqHz: 440.00,   // A4
    liftBiasQ16: toQ16(0.0),
    whisper: "The cool distaste-green of Bībhatsa curves cleanly—recoil preserving sealed adjacency.",
  },
  {
    id: "bhaya",
    name: "Bhaya",
    motion: "vigilance",
    color: "#c4b5fd", // Violet-grey
    glow: "rgba(196, 181, 253, 0.45)",
    freqHz: 523.25,   // C5
    liftBiasQ16: toQ16(-6.0),
    whisper: "The violet-grey of Bhaya chimes softly—vigilance illuminating misted dunes.",
  },
  {
    id: "vira",
    name: "Vīra",
    motion: "resolve",
    color: "#fcd34d", // Warm resolve-gold
    glow: "rgba(252, 211, 77, 0.45)",
    freqHz: 587.33,   // D5
    liftBiasQ16: toQ16(-14.0),
    whisper: "The warm resolve-gold of Vīra steadies—a quiet tailwind across the manifold.",
  },
  {
    id: "adbhuta",
    name: "Adbhuta",
    motion: "curiosity",
    color: "#bae6fd", // Pale wonder-blue
    glow: "rgba(186, 230, 253, 0.45)",
    freqHz: 659.25,   // E5
    liftBiasQ16: toQ16(-20.0),
    whisper: "The pale wonder-blue of Adbhuta echoes—curiosity resonating in rising fifths.",
  },
  {
    id: "santa",
    name: "Śānta",
    motion: "stillness",
    color: "#f8fafc", // White-silver
    glow: "rgba(248, 250, 252, 0.55)",
    freqHz: 783.99,   // G5
    liftBiasQ16: toQ16(0.0),
    whisper: "The white-silver stillness of Śānta settles—nine micro-motions woven without merging.",
  },
];

/**
 * Instantiate the 9 chromatic thread nodes across the manifold expanse.
 */
export function buildInitialBalletThreads(rngNext, arenaWidth = 640, arenaHeight = 460) {
  return NINE_RASA_THREADS.map((spec, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const jitterX = (rngNext() % 90) - 45;
    const jitterY = (rngNext() % 60) - 30;

    const baseX = 130 + col * ((arenaWidth - 260) / 2) + jitterX;
    const baseY = 95 + row * ((arenaHeight - 190) / 2) + jitterY;

    return {
      ...spec,
      index: idx,
      xQ16: toQ16(Math.max(56, Math.min(arenaWidth - 56, baseX))),
      yQ16: toQ16(Math.max(56, Math.min(arenaHeight - 56, baseY))),
      anchorXQ16: toQ16(Math.max(56, Math.min(arenaWidth - 56, baseX))),
      anchorYQ16: toQ16(Math.max(56, Math.min(arenaHeight - 56, baseY))),
      aligned: false,
      resonanceQ16: 0, // 0..65536 (0.0 to 1.0)
      phaseOffset: idx * 0.7,
    };
  });
}
