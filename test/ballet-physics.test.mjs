/**
 * test/ballet-physics.test.mjs — Deterministic Q16.16 Glide & Alignment Tests
 */

import test from "node:test";
import assert from "node:assert/strict";

import { toQ16, fromQ16, createSeededRng } from "../src/core.js";
import { buildInitialBalletThreads } from "../src/ballet-threads.js";
import {
  createTravelerState,
  stepTravelerGlide,
  updateThreadsAlignment,
} from "../src/ballet-physics.js";

test("1. Nine-Rasa Chromatic Threads Initialization", () => {
  const rng = createSeededRng(0x20260831);
  const threads = buildInitialBalletThreads(rng, 640, 460);
  assert.equal(threads.length, 9);
  assert.equal(threads[0].id, "sringara");
  assert.equal(threads[8].id, "santa");
});

test("2. Q16.16 Wind-Glide & Verlet Ribbon Trail Step", () => {
  let traveler = createTravelerState(320, 360);
  traveler = stepTravelerGlide(traveler, toQ16(180), toQ16(-120), 640, 460);
  assert.ok(fromQ16(traveler.xQ16) > 320);
  assert.ok(fromQ16(traveler.yQ16) < 360);
  assert.equal(traveler.ribbon.length, 14);
});

test("3. Chime Resonance & Non-Merging Thread Alignment", () => {
  const rng = createSeededRng(0x20260831);
  let threads = buildInitialBalletThreads(rng, 640, 460);
  let traveler = createTravelerState(fromQ16(threads[0].xQ16), fromQ16(threads[0].yQ16));

  for (let t = 0; t < 40; t++) {
    const out = updateThreadsAlignment(threads, traveler, t, 640);
    threads = out.threads;
  }
  assert.equal(threads[0].aligned, true);
});
