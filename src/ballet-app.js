/**
 * src/ballet-app.js — 60 Hz Meditative Glide Loop & Chime Pulse Dispatcher
 */

import { toQ16, fromQ16, createSeededRng } from "./core.js";
import { buildInitialBalletThreads } from "./ballet-threads.js";
import {
  createTravelerState,
  stepTravelerGlide,
  updateThreadsAlignment,
} from "./ballet-physics.js";
import { renderBalletFrame } from "./ballet-renderer.js";
import { createBalletAudio } from "./ballet-audio.js";

const FIXED_DT_MS = 1000 / 60;
const ARENA_W = 640;
const ARENA_H = 460;

function initBallet() {
  const canvas = document.getElementById("ballet-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const audio = createBalletAudio();

  const statusEl = document.getElementById("hud-alignment");
  const whisperEl = document.getElementById("hud-whisper");
  const audioBtn = document.getElementById("btn-audio");

  let rng = createSeededRng(0x20260831);
  let state = null;

  const resetManifold = () => {
    rng = createSeededRng(0x20260831);
    state = {
      tick: 0,
      traveler: createTravelerState(ARENA_W / 2, ARENA_H - 75),
      threads: buildInitialBalletThreads(rng, ARENA_W, ARENA_H),
      alignedCount: 0,
      summitCelebrated: false,
      netLiftQ16: 0,
    };
    if (statusEl) statusEl.textContent = "Threads Aligned: 0 / 9";
    if (whisperEl) {
      whisperEl.textContent =
        "Glide gently through the manifold and chime near each chromatic thread to weave harmony.";
    }
  };

  resetManifold();

  const keys = { up: false, down: false, left: false, right: false };
  let pointerDown = false;
  let pointerX = ARENA_W / 2;
  let pointerY = ARENA_H - 75;

  const emitChime = () => {
    if (state.traveler.chimeRadiusQ16 === 0) {
      state.traveler.chimeRadiusQ16 = toQ16(8.0);
      audio.playTravelerChime(state.alignedCount);
    }
  };

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "w" || ev.key === "W" || ev.key === "ArrowUp") keys.up = true;
    if (ev.key === "s" || ev.key === "S" || ev.key === "ArrowDown") keys.down = true;
    if (ev.key === "a" || ev.key === "A" || ev.key === "ArrowLeft") keys.left = true;
    if (ev.key === "d" || ev.key === "D" || ev.key === "ArrowRight") keys.right = true;
    if (ev.key === " ") emitChime();
  });

  window.addEventListener("keyup", (ev) => {
    if (ev.key === "w" || ev.key === "W" || ev.key === "ArrowUp") keys.up = false;
    if (ev.key === "s" || ev.key === "S" || ev.key === "ArrowDown") keys.down = false;
    if (ev.key === "a" || ev.key === "A" || ev.key === "ArrowLeft") keys.left = false;
    if (ev.key === "d" || ev.key === "D" || ev.key === "ArrowRight") keys.right = false;
  });

  const updatePointer = (ev) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerX = ((ev.clientX - rect.left) / rect.width) * ARENA_W;
    pointerY = ((ev.clientY - rect.top) / rect.height) * ARENA_H;
  };

  canvas?.addEventListener("pointerdown", (ev) => {
    pointerDown = true;
    updatePointer(ev);
    emitChime();
  });

  canvas?.addEventListener("pointermove", (ev) => {
    if (!pointerDown) return;
    updatePointer(ev);
  });

  window.addEventListener("pointerup", () => {
    pointerDown = false;
  });

  document.getElementById("btn-chime")?.addEventListener("click", emitChime);
  document.getElementById("btn-reset")?.addEventListener("click", resetManifold);

  audioBtn?.addEventListener("click", () => {
    const muted = audio.toggleMute();
    audioBtn.textContent = muted ? "Sound: Muted" : "Sound: Wind & Chimes";
  });

  function stepSimulation() {
    state.tick++;

    let ax = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 340;
    let ay = ((keys.down ? 1 : 0) - (keys.up ? 1 : 0)) * 340;

    if (pointerDown && ax === 0 && ay === 0) {
      const dx = pointerX - fromQ16(state.traveler.xQ16);
      const dy = pointerY - fromQ16(state.traveler.yQ16);
      ax = Math.max(-360, Math.min(360, dx * 2.4));
      ay = Math.max(-360, Math.min(360, dy * 2.4));
    }

    const totalAyQ16 = toQ16(ay) + state.netLiftQ16;
    state.traveler = stepTravelerGlide(
      state.traveler,
      toQ16(ax),
      totalAyQ16,
      ARENA_W,
      ARENA_H
    );

    const alignOut = updateThreadsAlignment(
      state.threads,
      state.traveler,
      state.tick,
      ARENA_W
    );
    state.threads = alignOut.threads;
    state.alignedCount = alignOut.alignedCount;
    state.netLiftQ16 = alignOut.netLiftQ16;

    if (alignOut.newlyAligned.length > 0) {
      const latest = alignOut.newlyAligned[alignOut.newlyAligned.length - 1];
      audio.playThreadAligned(latest.freqHz);
      if (statusEl) statusEl.textContent = `Threads Aligned: ${state.alignedCount} / 9`;
      if (whisperEl) whisperEl.textContent = latest.whisper;
    }

    if (alignOut.allAligned && !state.summitCelebrated) {
      state.summitCelebrated = true;
      audio.playSummitChord();
      if (whisperEl) {
        whisperEl.textContent =
          "The Cosmic Ballet settles—all nine micro-motions woven into reversible stillness (Śānta).";
      }
    }
  }

  let lastTime = performance.now();
  let accumulator = 0;

  function loop(now) {
    accumulator += Math.min(100, now - lastTime);
    lastTime = now;

    while (accumulator >= FIXED_DT_MS) {
      stepSimulation();
      accumulator -= FIXED_DT_MS;
    }

    if (ctx) renderBalletFrame(ctx, state);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

window.addEventListener("DOMContentLoaded", initBallet);
