/**
 * src/ballet-physics.js — Zero-Float Q16.16 Wind-Glide & Verlet Ribbon Kinematics
 * Implements smooth inertial gliding across the manifold, a 14-node flowing ribbon
 * scarf trail, and gentle non-merging orbital alignment for the nine rasa threads.
 *
 * Signed-off-by: Borealis Serenity Hedling <chguard-sentinel@vaked.dev>
 */

import { Q_ONE, qAdd, qSub, qMul, toQ16, fromQ16 } from "./core.js";

export const DT_60HZ_Q16 = toQ16(1.0 / 60.0);
export const GLIDE_DAMPING_Q16 = toQ16(0.955); // Smooth inertial wind-glide
export const RIBBON_DAMPING_Q16 = toQ16(0.86);

export function clampQ16(valQ16, minQ16, maxQ16) {
  if (valQ16 < minQ16) return minQ16 | 0;
  if (valQ16 > maxQ16) return maxQ16 | 0;
  return valQ16 | 0;
}

/**
 * Create traveler state with a 14-segment Verlet ribbon trail in Q16.16.
 */
export function createTravelerState(startX = 320, startY = 360) {
  const xQ16 = toQ16(startX);
  const yQ16 = toQ16(startY);
  const ribbon = Array.from({ length: 14 }, (_, i) => ({
    xQ16,
    yQ16: qAdd(yQ16, toQ16(i * 4)),
    oldXQ16: xQ16,
    oldYQ16: qAdd(yQ16, toQ16(i * 4)),
  }));

  return {
    xQ16,
    yQ16,
    vxQ16: 0,
    vyQ16: 0,
    chimeRadiusQ16: 0,
    ribbon,
  };
}

/**
 * Step traveler wind-glide physics and update the 14-segment ribbon trail.
 */
export function stepTravelerGlide(traveler, accelXQ16, accelYQ16, arenaW = 640, arenaH = 460) {
  // Integrate damped velocity
  let vxQ16 = qMul(qAdd(traveler.vxQ16, qMul(accelXQ16, DT_60HZ_Q16)), GLIDE_DAMPING_Q16);
  let vyQ16 = qMul(qAdd(traveler.vyQ16, qMul(accelYQ16, DT_60HZ_Q16)), GLIDE_DAMPING_Q16);

  let xQ16 = qAdd(traveler.xQ16, qMul(vxQ16, DT_60HZ_Q16));
  let yQ16 = qAdd(traveler.yQ16, qMul(vyQ16, DT_60HZ_Q16));

  // Soft cushion at manifold edges
  const margin = toQ16(24);
  const maxX = toQ16(arenaW - 24);
  const maxY = toQ16(arenaH - 24);
  if (xQ16 < margin) { xQ16 = margin; vxQ16 = Math.abs(vxQ16) >> 1; }
  if (xQ16 > maxX) { xQ16 = maxX; vxQ16 = -(Math.abs(vxQ16) >> 1); }
  if (yQ16 < margin) { yQ16 = margin; vyQ16 = Math.abs(vyQ16) >> 1; }
  if (yQ16 > maxY) { yQ16 = maxY; vyQ16 = -(Math.abs(vyQ16) >> 1); }

  // Expand and fade harmonic chime ring
  const maxChime = toQ16(150.0);
  const chimeRadiusQ16 =
    traveler.chimeRadiusQ16 > 0 && traveler.chimeRadiusQ16 < maxChime
      ? qAdd(traveler.chimeRadiusQ16, toQ16(4.5))
      : 0;

  // Update Verlet ribbon nodes trailing behind traveler
  const nextRibbon = traveler.ribbon.map((node) => ({ ...node }));
  nextRibbon[0].xQ16 = xQ16;
  nextRibbon[0].yQ16 = yQ16;

  const segLen = 6.5;
  for (let i = 1; i < nextRibbon.length; i++) {
    const cur = nextRibbon[i];
    const prev = nextRibbon[i - 1];

    const dxVel = qMul(qSub(cur.xQ16, cur.oldXQ16), RIBBON_DAMPING_Q16);
    const dyVel = qMul(qSub(cur.yQ16, cur.oldYQ16), RIBBON_DAMPING_Q16);

    cur.oldXQ16 = cur.xQ16;
    cur.oldYQ16 = cur.yQ16;

    // Gentle upward thermal breeze on ribbon tail
    cur.xQ16 = qAdd(cur.xQ16, dxVel);
    cur.yQ16 = qAdd(cur.yQ16, qSub(dyVel, toQ16(0.22)));

    // Distance constraint to previous ribbon segment
    const dx = fromQ16(qSub(cur.xQ16, prev.xQ16));
    const dy = fromQ16(qSub(cur.yQ16, prev.yQ16));
    const dist = Math.hypot(dx, dy);
    if (dist > segLen && dist > 0.001) {
      const diff = (dist - segLen) / dist;
      cur.xQ16 = qSub(cur.xQ16, toQ16(dx * diff));
      cur.yQ16 = qSub(cur.yQ16, toQ16(dy * diff));
    }
  }

  return {
    ...traveler,
    xQ16,
    yQ16,
    vxQ16,
    vyQ16,
    chimeRadiusQ16,
    ribbon: nextRibbon,
  };
}

/**
 * Evaluate thread proximity, chime resonance, and non-merging harmonic orbit alignment.
 * Returns { threads, newlyAligned, netLiftQ16, allAligned }.
 */
export function updateThreadsAlignment(threads, traveler, tick, arenaW = 640) {
  const tx = fromQ16(traveler.xQ16);
  const ty = fromQ16(traveler.yQ16);
  const chimeR = fromQ16(traveler.chimeRadiusQ16);

  let netLiftQ16 = 0;
  const newlyAligned = [];
  let alignedCount = 0;

  const updated = threads.map((th, idx) => {
    const curX = fromQ16(th.xQ16);
    const curY = fromQ16(th.yQ16);
    const dist = Math.hypot(tx - curX, ty - curY);

    // Chime pulse or close gentle glide awakens thread resonance
    const touchedByChime = chimeR > 0 && Math.abs(dist - chimeR) < 28;
    const closeGlide = dist < 44;
    let resonanceQ16 = th.resonanceQ16;

    if (touchedByChime || closeGlide) {
      resonanceQ16 = Math.min(Q_ONE, qAdd(resonanceQ16, touchedByChime ? toQ16(0.38) : toQ16(0.035)));
    }

    let aligned = th.aligned;
    if (!aligned && resonanceQ16 >= Q_ONE) {
      aligned = true;
      newlyAligned.push(th);
    }

    if (aligned) {
      alignedCount++;
      netLiftQ16 = qAdd(netLiftQ16, th.liftBiasQ16);
    }

    // Target position: either gentle idle hover around anchor, or interleaved harmonic ribbon arc
    let targetX;
    let targetY;
    if (!aligned) {
      targetX = fromQ16(th.anchorXQ16) + Math.cos(tick * 0.02 + th.phaseOffset) * 14;
      targetY = fromQ16(th.anchorYQ16) + Math.sin(tick * 0.025 + th.phaseOffset) * 10;
    } else {
      // Interleaved upper canopy arc (sealed adjacency: each thread keeps its own lane)
      const spacing = (arenaW - 140) / 8;
      targetX = 70 + idx * spacing + Math.sin(tick * 0.03 + th.phaseOffset) * 8;
      targetY = 62 + Math.cos(tick * 0.025 + th.phaseOffset) * 10;
    }

    const nextXQ16 = qAdd(th.xQ16, toQ16((targetX - curX) * 0.04));
    const nextYQ16 = qAdd(th.yQ16, toQ16((targetY - curY) * 0.04));

    return {
      ...th,
      xQ16: nextXQ16,
      yQ16: nextYQ16,
      aligned,
      resonanceQ16,
    };
  });

  return {
    threads: updated,
    newlyAligned,
    netLiftQ16,
    alignedCount,
    allAligned: alignedCount === threads.length,
  };
}
