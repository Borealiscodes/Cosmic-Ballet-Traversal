/**
 * src/ballet-renderer.js — Read-Only 2D Canvas Meditative Horizon & Ribbon Renderer
 */

import { fromQ16 } from "./core.js";

export function renderBalletFrame(ctx, state) {
  const { width, height } = ctx.canvas;
  const progress = state.alignedCount / Math.max(1, state.threads.length);

  // 1. Twilight sky gradient shifting from deep indigo toward warm silver-rose dawn
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, progress >= 1 ? "#1e1b4b" : "#0b0f1f");
  sky.addColorStop(0.65, progress >= 1 ? "#312e81" : "#172038");
  sky.addColorStop(1, progress >= 1 ? "#4c1d95" : "#1e293b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // 2. Soft horizon dunes
  ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width; x += 20) {
    const y = height - 48 + Math.sin(x * 0.008 + state.tick * 0.006) * 14;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // 3. Interleaved canopy weave lines between aligned threads (sealed adjacency: parallel arcs)
  const alignedThreads = state.threads.filter((t) => t.aligned);
  if (alignedThreads.length > 1) {
    for (let i = 0; i < alignedThreads.length - 1; i++) {
      const a = alignedThreads[i];
      const b = alignedThreads[i + 1];
      ctx.strokeStyle = a.glow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fromQ16(a.xQ16), fromQ16(a.yQ16));
      ctx.quadraticCurveTo(
        (fromQ16(a.xQ16) + fromQ16(b.xQ16)) / 2,
        fromQ16(a.yQ16) + 22,
        fromQ16(b.xQ16),
        fromQ16(b.yQ16)
      );
      ctx.stroke();
    }
  }

  // 4. Nine Rasa Chromatic Thread Nodes
  for (const th of state.threads) {
    const tx = fromQ16(th.xQ16);
    const ty = fromQ16(th.yQ16);
    const resRatio = fromQ16(th.resonanceQ16);

    // Outer resonance aura
    const auraR = 14 + resRatio * 14 + Math.sin(state.tick * 0.05 + th.phaseOffset) * 2;
    ctx.fillStyle = th.glow;
    ctx.beginPath();
    ctx.arc(tx, ty, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Inner chromatic core
    ctx.fillStyle = th.color;
    ctx.beginPath();
    ctx.arc(tx, ty, th.aligned ? 6.5 : 5.0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle label
    ctx.fillStyle = th.aligned ? "#f8fafc" : "rgba(226, 232, 240, 0.65)";
    ctx.font = th.aligned ? "bold 11px sans-serif" : "10px sans-serif";
    ctx.fillText(th.name, tx + 10, ty + 4);
  }

  // 5. Traveler Expanding Harmonic Chime Ring
  const traveler = state.traveler;
  const px = fromQ16(traveler.xQ16);
  const py = fromQ16(traveler.yQ16);
  const chimeR = fromQ16(traveler.chimeRadiusQ16);

  if (chimeR > 0) {
    const alpha = Math.max(0, 1 - chimeR / 150);
    ctx.strokeStyle = `rgba(248, 250, 252, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.arc(px, py, chimeR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 6. Traveler Flowing Verlet Ribbon Scarf Trail
  const ribbon = traveler.ribbon;
  if (ribbon.length > 1) {
    for (let i = 0; i < ribbon.length - 1; i++) {
      const cur = ribbon[i];
      const next = ribbon[i + 1];
      const fade = 1 - i / ribbon.length;
      ctx.strokeStyle = `rgba(248, 250, 252, ${(0.85 * fade).toFixed(3)})`;
      ctx.lineWidth = Math.max(1.5, 6 * fade);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(fromQ16(cur.xQ16), fromQ16(cur.yQ16));
      ctx.lineTo(fromQ16(next.xQ16), fromQ16(next.yQ16));
      ctx.stroke();
    }
  }

  // 7. Traveler Luminous Core
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();
}
