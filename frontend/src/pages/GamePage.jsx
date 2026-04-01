import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { FRUIT_TYPES, pickFruitType, SKINS, THEMES } from '../constants/gameConfig';

const GRID = 30;
const CELL = 20;
const W = GRID * CELL;
const H = GRID * CELL;

const PX = "'Press Start 2P', monospace";

const LEVEL_CONFIG = {
  easy:   { tickMs: 200, maxFruits: 1, fruitInterval: 8000,  label: 'EASY',   color: '#00ff41' },
  medium: { tickMs: 130, maxFruits: 2, fruitInterval: 4000,  label: 'MEDIUM', color: '#ffdd00' },
  hard:   { tickMs: 70,  maxFruits: 3, fruitInterval: 2000,  label: 'HARD',   color: '#ff2255' },
};

// ── Utils ─────────────────────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha.toFixed(2)})`;
}

function padScore(n) {
  return String(n).padStart(6, '0');
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME BACKGROUNDS
// Each theme has strong, clearly visible animations at 0.4-0.7 opacity
// ─────────────────────────────────────────────────────────────────────────────

function drawBackground(ctx, themeId, t) {
  const theme = THEMES[themeId];
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  if (themeId === 'dark')     drawDarkBg(ctx, t);
  if (themeId === 'pnw')      drawPNWBg(ctx, t);
  if (themeId === 'neonCity') drawNeonCityBg(ctx, t);
  if (themeId === 'desert')   drawDesertBg(ctx, t);
  if (themeId === 'ocean')    drawOceanBg(ctx, t);

  // Grid lines (drawn on top of bg art)
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    if (themeId === 'neonCity') {
      ctx.strokeStyle = i % 5 === 0
        ? `rgba(0,255,255,0.22)`
        : `rgba(0,255,255,0.04)`;
    } else {
      ctx.strokeStyle = theme.gridColor;
    }
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke();
    if (themeId === 'neonCity') {
      ctx.strokeStyle = i % 5 === 0
        ? `rgba(255,0,255,0.18)`
        : `rgba(255,0,255,0.04)`;
    }
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke();
  }
}

// ── DARK: twinkling starfield ─────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 97 + 13) % GRID) * CELL + (i * 7 % CELL),
  y: ((i * 61 + 31) % GRID) * CELL + (i * 11 % CELL),
  r: 0.6 + (i % 3) * 0.5,
  speed: 0.0008 + (i % 5) * 0.0004,
  phase: (i * 0.73),
}));

function drawDarkBg(ctx, t) {
  STARS.forEach(s => {
    const alpha = 0.35 + Math.abs(Math.sin(t * s.speed + s.phase)) * 0.65;
    ctx.fillStyle = `rgba(180,200,255,${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  // Faint purple nebula in corner
  const neb = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, 120);
  neb.addColorStop(0, 'rgba(80,30,140,0.18)');
  neb.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, W, H);
}

// ── PNW: pine trees + animated whale + rain ───────────────────────────────────
function drawPNWBg(ctx, t) {
  // Deep forest sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#010e01');
  sky.addColorStop(0.6, '#020f02');
  sky.addColorStop(1, '#000800');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Moon
  ctx.save();
  ctx.fillStyle = '#c8e8c8';
  ctx.shadowColor = '#aaddaa';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(W * 0.82, H * 0.12, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Stars (few, dim)
  for (let i = 0; i < 30; i++) {
    const sx = ((i * 113 + 7) % W);
    const sy = ((i * 79 + 3) % (H * 0.5));
    const alpha = 0.2 + Math.abs(Math.sin(t * 0.0006 + i)) * 0.3;
    ctx.fillStyle = `rgba(200,255,200,${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rain streaks
  ctx.save();
  ctx.strokeStyle = 'rgba(120,200,120,0.18)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 60; i++) {
    const rx = ((i * 79 + t * 0.08) % W);
    const ry = ((i * 53 + t * 0.22) % H);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 2, ry + 10);
    ctx.stroke();
  }
  ctx.restore();

  // Pine tree silhouettes – full bottom row, strong
  ctx.save();
  const treeCount = 32;
  for (let i = 0; i < treeCount; i++) {
    const cx = (i / treeCount) * W + W / treeCount / 2;
    const tH = 40 + ((i * 17 + 5) % 30);
    drawPineSilhouette(ctx, cx, H, tH);
  }
  // Taller back row
  for (let i = 0; i < 18; i++) {
    const cx = (i / 18) * W + W / 36 + ((i % 3) * 8);
    const tH = 65 + ((i * 11 + 3) % 40);
    drawPineSilhouette(ctx, cx, H - 35, tH, 0.45);
  }
  ctx.restore();

  // Animated WHALE at bottom
  drawPNWWhale(ctx, t);

  // Ground mist
  const mist = ctx.createLinearGradient(0, H - 60, 0, H);
  mist.addColorStop(0, 'rgba(0,40,0,0)');
  mist.addColorStop(1, 'rgba(0,25,0,0.65)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, H - 60, W, 60);
}

function drawPineSilhouette(ctx, cx, baseY, treeH, alpha = 0.7) {
  ctx.globalAlpha = alpha;
  // Trunk
  ctx.fillStyle = '#1a0e04';
  ctx.fillRect(cx - 2, baseY - treeH * 0.3, 4, treeH * 0.3);
  // Three tiers of triangle
  const tiers = [
    { yFrac: 0.85, w: treeH * 0.38 },
    { yFrac: 0.58, w: treeH * 0.27 },
    { yFrac: 0.32, w: treeH * 0.16 },
  ];
  tiers.forEach(({ yFrac, w }, idx) => {
    const ty = baseY - treeH * yFrac;
    ctx.fillStyle = idx === 0 ? '#0d2b0d' : idx === 1 ? '#0a230a' : '#081a08';
    ctx.beginPath();
    ctx.moveTo(cx, ty - treeH * 0.28);
    ctx.lineTo(cx + w, ty);
    ctx.lineTo(cx - w, ty);
    ctx.closePath();
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawPNWWhale(ctx, t) {
  // Whale crosses bottom 4 rows (y ~ H - 55), 28-second loop
  const period = 28000;
  const prog = (t % period) / period;
  const x = -90 + prog * (W + 180);
  const y = H - 52 + Math.sin(t * 0.0015) * 5;

  if (x < -100 || x > W + 100) return;

  ctx.save();
  ctx.globalAlpha = 0.72;

  // Water splash beneath whale
  ctx.fillStyle = 'rgba(0,80,40,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 55, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail flukes
  ctx.fillStyle = '#123d1f';
  ctx.beginPath();
  ctx.moveTo(x - 44, y - 2);
  ctx.lineTo(x - 68, y - 18);
  ctx.lineTo(x - 60, y + 0);
  ctx.lineTo(x - 68, y + 18);
  ctx.closePath();
  ctx.fill();

  // Body
  const bodyGrad = ctx.createLinearGradient(x - 40, y - 18, x + 50, y + 18);
  bodyGrad.addColorStop(0, '#0e3b22');
  bodyGrad.addColorStop(0.5, '#1a5c32');
  bodyGrad.addColorStop(1, '#0e3b22');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(x + 5, y, 50, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly lighter stripe
  ctx.fillStyle = 'rgba(80,160,100,0.45)';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 8, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dorsal fin
  ctx.fillStyle = '#0a2e18';
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x + 16, y - 32);
  ctx.lineTo(x + 22, y - 18);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x + 44, y - 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(x + 45, y - 7, 1, 0, Math.PI * 2);
  ctx.fill();

  // Blowhole spout (every ~4s)
  const spoutPhase = (t % 4200) / 4200;
  if (spoutPhase < 0.25) {
    const spoutAlpha = Math.sin(spoutPhase * Math.PI / 0.25) * 0.6;
    const spoutH = 25 * Math.sin(spoutPhase * Math.PI / 0.25);
    ctx.globalAlpha = spoutAlpha;
    ctx.strokeStyle = '#7eeaaa';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 38 + i * 5, y - 18);
      ctx.quadraticCurveTo(x + 38 + i * 8, y - 18 - spoutH * 0.6, x + 40 + i * 6, y - 18 - spoutH);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ── NEON CITY: buildings + flickering signs + scanlines ──────────────────────
// Pre-bake deterministic buildings
const BUILDINGS = (() => {
  const b = [];
  const heights = [90,130,70,110,60,100,140,80,120,55,95,115,75,105,65,90];
  let x = 0;
  heights.forEach((h, i) => {
    const w = 28 + (i % 4) * 6;
    b.push({ x, w, h, col: i % 2 === 0 ? '#06060e' : '#08081a' });
    x += w + 2;
  });
  return b;
})();

function drawNeonCityBg(ctx, t) {
  // Horizon gradient
  const horiz = ctx.createLinearGradient(0, H - 120, 0, H);
  horiz.addColorStop(0, 'rgba(0,0,0,0)');
  horiz.addColorStop(0.6, 'rgba(30,0,60,0.4)');
  horiz.addColorStop(1, 'rgba(60,0,120,0.55)');
  ctx.fillStyle = horiz;
  ctx.fillRect(0, 0, W, H);

  // Distant city skyline
  BUILDINGS.forEach(b => {
    const by = H - b.h;
    ctx.fillStyle = b.col;
    ctx.fillRect(b.x, by, b.w, b.h);

    // Windows (yellow/white dots, some flicker)
    for (let wy = by + 8; wy < H - 10; wy += 10) {
      for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 8) {
        const seed = (wx * 7 + wy * 13 + b.x);
        const on = (seed % 3 !== 0);
        if (!on) continue;
        const flicker = Math.sin(t * 0.003 + seed * 0.7) > 0.85 ? 0 : 1;
        const alpha = flicker * (0.5 + (seed % 5) * 0.1);
        const warm = seed % 4 === 0;
        ctx.fillStyle = warm
          ? `rgba(255,220,80,${alpha.toFixed(2)})`
          : `rgba(180,200,255,${alpha.toFixed(2)})`;
        ctx.fillRect(wx, wy, 3, 5);
      }
    }

    // Neon sign on top (random colors)
    const signColors = ['#ff00ff', '#00ffff', '#ff4400', '#ffff00'];
    const sc = signColors[b.x % signColors.length];
    const flicker2 = Math.sin(t * 0.005 + b.x) > 0.6 ? 1 : 0.4;
    ctx.fillStyle = sc.replace(')', `,${flicker2})`).replace('rgb', 'rgba');
    ctx.fillStyle = sc;
    ctx.globalAlpha = flicker2 * 0.8;
    ctx.fillRect(b.x + 4, by - 6, b.w - 8, 4);
    ctx.globalAlpha = 1;
  });

  // Ground neon glow lines
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const gy = H - 2 - i * 3;
    const grad = ctx.createLinearGradient(0, gy, W, gy);
    grad.addColorStop(0, 'rgba(255,0,255,0)');
    grad.addColorStop(0.3, 'rgba(255,0,255,0.5)');
    grad.addColorStop(0.7, 'rgba(0,255,255,0.5)');
    grad.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, gy); ctx.lineTo(W, gy);
    ctx.stroke();
  }
  ctx.restore();

  // Moving "car" light streaks along bottom
  const carPeriod = 6000;
  const carX = (t % carPeriod) / carPeriod * (W + 80) - 40;
  ctx.save();
  const carGrad = ctx.createLinearGradient(carX - 60, 0, carX, 0);
  carGrad.addColorStop(0, 'rgba(255,200,0,0)');
  carGrad.addColorStop(1, 'rgba(255,200,0,0.6)');
  ctx.strokeStyle = carGrad;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(carX - 60, H - 8); ctx.lineTo(carX, H - 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(carX - 55, H - 4); ctx.lineTo(carX, H - 4); ctx.stroke();
  // Tail lights going other way
  const car2X = W - (t * 0.7 % (W + 80));
  const carGrad2 = ctx.createLinearGradient(car2X, 0, car2X + 50, 0);
  carGrad2.addColorStop(0, 'rgba(255,20,20,0.6)');
  carGrad2.addColorStop(1, 'rgba(255,20,20,0)');
  ctx.strokeStyle = carGrad2;
  ctx.beginPath(); ctx.moveTo(car2X, H - 12); ctx.lineTo(car2X + 50, H - 12); ctx.stroke();
  ctx.restore();
}

// ── DESERT: starry night sky + sand dunes + walking camel ────────────────────
const DESERT_STARS = Array.from({ length: 120 }, (_, i) => ({
  x: ((i * 89 + 11) % W),
  y: ((i * 67 + 7) % (H * 0.62)),
  r: 0.5 + (i % 3) * 0.4,
  twinkle: 0.001 + (i % 7) * 0.0005,
  phase: i * 1.3,
}));

function drawDesertBg(ctx, t) {
  // Night sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  sky.addColorStop(0, '#020008');
  sky.addColorStop(1, '#0a0508');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.65);

  // Stars
  DESERT_STARS.forEach(s => {
    const alpha = 0.3 + Math.abs(Math.sin(t * s.twinkle + s.phase)) * 0.7;
    ctx.fillStyle = `rgba(255,240,200,${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Moon
  ctx.save();
  const moonGrad = ctx.createRadialGradient(W * 0.18, H * 0.1, 0, W * 0.18, H * 0.1, 22);
  moonGrad.addColorStop(0, '#fffadc');
  moonGrad.addColorStop(0.7, '#f5e680');
  moonGrad.addColorStop(1, 'rgba(240,220,80,0)');
  ctx.fillStyle = moonGrad;
  ctx.shadowColor = '#f5e680';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(W * 0.18, H * 0.1, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Shooting star (every ~8s)
  const shootPhase = (t % 8500) / 8500;
  if (shootPhase < 0.06) {
    const prog = shootPhase / 0.06;
    const sx = W * 0.7 - prog * 120;
    const sy = H * 0.08 + prog * 40;
    ctx.save();
    const shootGrad = ctx.createLinearGradient(sx, sy, sx + 60, sy - 20);
    shootGrad.addColorStop(0, `rgba(255,240,180,${(1 - prog).toFixed(2)})`);
    shootGrad.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.strokeStyle = shootGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(sx + 60, sy - 20);
    ctx.stroke();
    ctx.restore();
  }

  // Sand dunes
  const duneGrad = ctx.createLinearGradient(0, H * 0.62, 0, H);
  duneGrad.addColorStop(0, '#2d1800');
  duneGrad.addColorStop(0.4, '#3d2200');
  duneGrad.addColorStop(1, '#1a0c00');
  ctx.fillStyle = duneGrad;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.74);
  ctx.quadraticCurveTo(W * 0.12, H * 0.62, W * 0.28, H * 0.70);
  ctx.quadraticCurveTo(W * 0.42, H * 0.78, W * 0.56, H * 0.66);
  ctx.quadraticCurveTo(W * 0.70, H * 0.55, W * 0.82, H * 0.68);
  ctx.quadraticCurveTo(W * 0.92, H * 0.76, W, H * 0.70);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Dune shading ridges
  ctx.strokeStyle = 'rgba(80,45,10,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.77);
  ctx.quadraticCurveTo(W * 0.25, H * 0.67, W * 0.55, H * 0.69);
  ctx.quadraticCurveTo(W * 0.75, H * 0.60, W, H * 0.73);
  ctx.stroke();

  // Animated CAMEL
  drawDesertCamel(ctx, t);
}

function drawDesertCamel(ctx, t) {
  // Camel walks right-to-left across the sand line, 18s loop
  const period = 18000;
  const prog = (t % period) / period;
  const x = W + 60 - prog * (W + 120);
  const groundY = H * 0.785;
  const legAnim = Math.sin(t * 0.009);

  if (x < -80 || x > W + 80) return;

  ctx.save();
  ctx.globalAlpha = 0.82;
  const tan = '#7a4e18';
  const darkTan = '#5a3a10';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, groundY + 2, 32, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (4 legs, alternating animation)
  ctx.fillStyle = darkTan;
  const legXs = [-18, -8, 6, 18];
  legXs.forEach((lx, i) => {
    const phase = i % 2 === 0 ? legAnim : -legAnim;
    const legLen = 20 + phase * 3;
    ctx.fillRect(x + lx - 2, groundY - legLen, 4, legLen);
    // Foot
    ctx.fillRect(x + lx - 4, groundY - 2, 8, 3);
  });

  // Body
  ctx.fillStyle = tan;
  ctx.beginPath();
  ctx.ellipse(x, groundY - 28, 28, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front hump
  ctx.fillStyle = '#8a5c20';
  ctx.beginPath();
  ctx.ellipse(x + 10, groundY - 42, 11, 10, -0.2, Math.PI, 0);
  ctx.fill();

  // Back hump
  ctx.beginPath();
  ctx.ellipse(x - 8, groundY - 40, 9, 8, 0.1, Math.PI, 0);
  ctx.fill();

  // Neck
  ctx.fillStyle = tan;
  ctx.save();
  ctx.translate(x + 24, groundY - 30);
  ctx.rotate(-0.3);
  ctx.fillRect(-4, -18, 8, 22);
  ctx.restore();

  // Head
  ctx.fillStyle = '#8a5c20';
  ctx.beginPath();
  ctx.ellipse(x + 36, groundY - 46, 10, 7, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x + 41, groundY - 49, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Nostril
  ctx.fillStyle = '#4a2c08';
  ctx.beginPath();
  ctx.arc(x + 45, groundY - 44, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = darkTan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 26, groundY - 28);
  ctx.quadraticCurveTo(x - 36, groundY - 20 + legAnim * 4, x - 34, groundY - 10);
  ctx.stroke();

  ctx.restore();
}

// ── OCEAN DEEP: waves + whale + bubbles ───────────────────────────────────────
function drawOceanBg(ctx, t) {
  // Depth gradient
  const depth = ctx.createLinearGradient(0, 0, 0, H);
  depth.addColorStop(0, '#000c20');
  depth.addColorStop(0.4, '#001535');
  depth.addColorStop(0.75, '#001848');
  depth.addColorStop(1, '#000d28');
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Bioluminescent plankton dots
  for (let i = 0; i < 40; i++) {
    const px = ((i * 157 + 31) % W);
    const py = H * 0.3 + ((i * 113 + 17) % (H * 0.7));
    const alpha = 0.08 + Math.abs(Math.sin(t * 0.0006 + i * 0.9)) * 0.18;
    const cyan = i % 3 === 0;
    ctx.fillStyle = cyan
      ? `rgba(0,220,255,${alpha.toFixed(2)})`
      : `rgba(80,255,200,${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Light rays from surface (top)
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const rayX = W * 0.1 + i * W * 0.15;
    const rayW = 20 + i * 8;
    const rayAlpha = 0.04 + Math.abs(Math.sin(t * 0.0007 + i * 0.8)) * 0.05;
    const rayGrad = ctx.createLinearGradient(rayX, 0, rayX, H * 0.6);
    rayGrad.addColorStop(0, `rgba(80,160,255,${(rayAlpha * 2).toFixed(2)})`);
    rayGrad.addColorStop(1, 'rgba(0,0,80,0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(rayX - rayW / 2, 0);
    ctx.lineTo(rayX + rayW / 2, 0);
    ctx.lineTo(rayX + rayW * 0.7, H * 0.6);
    ctx.lineTo(rayX - rayW * 0.7, H * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Animated wave layers (filled, strong)
  const waveLayers = [
    { yBase: H * 0.70, amp: 9,  freq: 0.018, speed: 0.0014, color: [0, 45, 100], a: 0.55 },
    { yBase: H * 0.78, amp: 7,  freq: 0.024, speed: 0.0020, color: [0, 60, 130], a: 0.60 },
    { yBase: H * 0.85, amp: 6,  freq: 0.030, speed: 0.0028, color: [0, 75, 150], a: 0.65 },
    { yBase: H * 0.91, amp: 5,  freq: 0.040, speed: 0.0038, color: [0, 90, 170], a: 0.70 },
    { yBase: H * 0.96, amp: 3,  freq: 0.055, speed: 0.005,  color: [0,110, 190], a: 0.75 },
  ];

  waveLayers.forEach(({ yBase, amp, freq, speed, color: [r, g, b], a }) => {
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, yBase);
    for (let x = 0; x <= W; x += 3) {
      const wy = yBase + Math.sin(x * freq + t * speed) * amp
                        + Math.sin(x * freq * 0.7 - t * speed * 0.8) * amp * 0.4;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // Wave crest highlights
    ctx.strokeStyle = `rgba(100,200,255,0.18)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 3) {
      const wy = yBase + Math.sin(x * freq + t * speed) * amp
                        + Math.sin(x * freq * 0.7 - t * speed * 0.8) * amp * 0.4;
      x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
    }
    ctx.stroke();
  });

  // Bubbles rising
  for (let i = 0; i < 18; i++) {
    const bx = ((i * 97 + 41) % W);
    const speed = 0.00025 + (i % 5) * 0.00008;
    const by = H - ((t * speed * 200 + i * 35) % (H * 0.7));
    const bAlpha = 0.25 + Math.abs(Math.sin(t * 0.001 + i * 0.8)) * 0.25;
    const bR = 2 + (i % 3);
    ctx.strokeStyle = `rgba(120,220,255,${bAlpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, bR, 0, Math.PI * 2);
    ctx.stroke();
    // Bubble highlight
    ctx.fillStyle = `rgba(200,240,255,${(bAlpha * 0.5).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(bx - bR * 0.3, by - bR * 0.3, bR * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // WHALE swimming slowly
  drawOceanWhale(ctx, t);
}

function drawOceanWhale(ctx, t) {
  // Whale drifts right-to-left deep underwater, 35s loop
  const period = 35000;
  const prog = (t % period) / period;
  const x = W + 100 - prog * (W + 200);
  const y = H * 0.55 + Math.sin(t * 0.0008) * 18;

  if (x < -120 || x > W + 120) return;

  ctx.save();
  ctx.globalAlpha = 0.55;

  // Tail
  ctx.fillStyle = '#003855';
  ctx.beginPath();
  ctx.moveTo(x - 55, y - 4);
  ctx.lineTo(x - 80, y - 22);
  ctx.lineTo(x - 68, y + 0);
  ctx.lineTo(x - 80, y + 22);
  ctx.closePath();
  ctx.fill();

  // Body
  const bodyGrad = ctx.createLinearGradient(x - 50, y - 24, x + 60, y + 24);
  bodyGrad.addColorStop(0, '#004570');
  bodyGrad.addColorStop(0.5, '#005c8a');
  bodyGrad.addColorStop(1, '#003055');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(x + 5, y, 60, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // White belly
  ctx.fillStyle = 'rgba(150,210,230,0.35)';
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 12, 38, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dorsal fin
  ctx.fillStyle = '#003055';
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x + 18, y - 38);
  ctx.lineTo(x + 26, y - 22);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#001a33';
  ctx.beginPath();
  ctx.arc(x + 52, y - 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(x + 53, y - 9, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// FRUIT RENDERING
// ─────────────────────────────────────────────────────────────────────────────
function drawFruit(ctx, fruit, t) {
  const def = FRUIT_TYPES[fruit.type];
  const cx = fruit.x * CELL + CELL / 2;
  const cy = fruit.y * CELL + CELL / 2;
  const r = CELL / 2 - 1;

  const ringSpeed = fruit.type === 'normal' ? 900 : 600;
  const phase = (t % ringSpeed) / ringSpeed;

  // Pulsing outer ring
  ctx.strokeStyle = hexToRgba(def.glowColor, 0.8 * (1 - phase));
  ctx.lineWidth = fruit.type === 'normal' ? 1.5 : 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3 + phase * 7, 0, Math.PI * 2);
  ctx.stroke();

  if (fruit.type !== 'normal') {
    const phase2 = ((t + ringSpeed / 2) % ringSpeed) / ringSpeed;
    ctx.strokeStyle = hexToRgba(def.glowColor, 0.55 * (1 - phase2));
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3 + phase2 * 7, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting sparkles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + t * 0.002;
      const dist = r + 6 + Math.sin(t * 0.004 + i * 1.1) * 2;
      const sAlpha = 0.6 + Math.abs(Math.sin(t * 0.005 + i * 0.7)) * 0.4;
      ctx.fillStyle = hexToRgba(def.sparkleColor, sAlpha);
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(angle) * dist,
        cy + Math.sin(angle) * dist,
        1.5 + Math.abs(Math.sin(t * 0.006 + i)) * 0.8,
        0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  // Glow halo
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 6);
  glow.addColorStop(0, hexToRgba(def.glowColor, 0.4));
  glow.addColorStop(1, hexToRgba(def.glowColor, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fill();

  // Solid base
  ctx.fillStyle = def.colors[1];
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Gradient on top
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, def.colors[0]);
  grad.addColorStop(1, def.colors[1]);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.32, cy - r * 0.32, r * 0.26, 0, Math.PI * 2);
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────────────────────
// SNAKE RENDERING
// ─────────────────────────────────────────────────────────────────────────────
function drawSnake(ctx, snake, dir, skinId, ghostActive, snailActive) {
  const skin = SKINS[skinId] || SKINS.classic;
  const headColor = ghostActive ? '#a78bfa' : snailActive ? '#fbbf24' : skin.headColor;
  const bodyRGB   = ghostActive ? [109,40,217] : snailActive ? [202,138,4] : skin.bodyRGB;
  const glowRGB   = ghostActive ? [167,139,250] : snailActive ? [251,191,36] : skin.glowRGB;
  const cornerR   = skin.pixel ? 1 : 5;

  snake.forEach((seg, i) => {
    if (i === 0) {
      if (glowRGB) { ctx.shadowColor = `rgba(${glowRGB[0]},${glowRGB[1]},${glowRGB[2]},0.7)`; ctx.shadowBlur = 12; }
      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, cornerR);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = skin.eyeColor;
      const ex = seg.x * CELL + CELL / 2, ey = seg.y * CELL + CELL / 2;
      ctx.beginPath(); ctx.arc(ex + dir.dy * 5 - dir.dx * 2, ey - dir.dx * 5 - dir.dy * 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex - dir.dy * 5 - dir.dx * 2, ey + dir.dx * 5 - dir.dy * 2, 2, 0, Math.PI * 2); ctx.fill();
    } else {
      const alpha = Math.max(0.35, 1 - i * 0.015);
      if (glowRGB && i < 4) { ctx.shadowColor = `rgba(${glowRGB[0]},${glowRGB[1]},${glowRGB[2]},0.28)`; ctx.shadowBlur = 7; }
      ctx.fillStyle = `rgba(${bodyRGB[0]},${bodyRGB[1]},${bodyRGB[2]},${alpha})`;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4, cornerR > 1 ? cornerR - 1 : 1);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });

  if (ghostActive) {
    const head = snake[0];
    const aura = ctx.createRadialGradient(head.x*CELL+CELL/2, head.y*CELL+CELL/2, CELL/2, head.x*CELL+CELL/2, head.y*CELL+CELL/2, CELL*1.4);
    aura.addColorStop(0, 'rgba(167,139,250,0.18)');
    aura.addColorStop(1, 'rgba(167,139,250,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(head.x*CELL+CELL/2, head.y*CELL+CELL/2, CELL*1.4, 0, Math.PI*2);
    ctx.fill();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function GamePage() {
  const { level } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [displayScore, setDisplayScore] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [gameKey, setGameKey] = useState(0);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [powerup, setPowerup] = useState(null);

  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.easy;
  const levelColors = { easy: '#00ff41', medium: '#ffdd00', hard: '#ff2255' };
  const lvlColor = levelColors[level] || '#00ff41';

  // ── Main game effect ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const skinId  = localStorage.getItem('snake_skin')  || 'classic';
    const themeId = localStorage.getItem('snake_theme') || 'dark';

    if (gameKey === 0) { drawIdleScreen(ctx, cfg, themeId, lvlColor); return; }

    let snake = [{ x: 15, y: 15 }, { x: 14, y: 15 }, { x: 13, y: 15 }];
    let dir = { dx: 1, dy: 0 }, pendingDir = null;
    let fruits = [], score = 0, alive = true, tickCount = 0;
    const abilities = { ghost: 0, snail: 0 };
    let notifiedAbility = '';
    let flashes = [];

    setDisplayScore(0); setPhase('running'); setScoreSaved(false); setPowerup(null);

    function randCell() {
      let cell, tries = 0;
      do {
        cell = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
        tries++;
      } while (tries < 500 && (snake.some(s => s.x===cell.x && s.y===cell.y) || fruits.some(f => f.x===cell.x && f.y===cell.y)));
      return cell;
    }

    function spawnFruit() { if (!alive || fruits.length >= cfg.maxFruits) return; fruits.push({ ...randCell(), type: pickFruitType() }); }

    function syncPowerupUI(now) {
      const key = abilities.ghost > now ? 'ghost' : abilities.snail > now ? 'snail' : '';
      if (key !== notifiedAbility) {
        notifiedAbility = key;
        setPowerup(key ? { icon: FRUIT_TYPES[key].icon, label: FRUIT_TYPES[key].label, color: FRUIT_TYPES[key].colors[1] } : null);
      }
    }

    function draw(t) {
      const now = Date.now();
      const ghostActive = abilities.ghost > now, snailActive = abilities.snail > now;

      drawBackground(ctx, themeId, t);

      if (ghostActive) {
        ctx.strokeStyle = 'rgba(167,139,250,0.5)'; ctx.lineWidth = 3;
        ctx.setLineDash([8,6]); ctx.strokeRect(2,2,W-4,H-4); ctx.setLineDash([]);
      }

      fruits.forEach(f => drawFruit(ctx, f, t));
      drawSnake(ctx, snake, dir, skinId, ghostActive, snailActive);

      flashes = flashes.filter(fl => {
        const age = now - fl.born, dur = 1400;
        if (age >= dur) return false;
        const prog = age / dur;
        ctx.globalAlpha = 1 - prog;
        ctx.fillStyle = fl.color;
        ctx.font = `bold 13px ${PX}`;
        ctx.textAlign = 'center';
        ctx.fillText(fl.text, fl.x, fl.y - prog * 34);
        ctx.globalAlpha = 1;
        return true;
      });

      // HUD
      ctx.textAlign = 'right'; let hudY = 16;
      if (abilities.ghost > now) {
        ctx.fillStyle = hexToRgba('#818cf8', 0.95);
        ctx.font = `bold 9px ${PX}`;
        ctx.fillText(`GHOST ${Math.ceil((abilities.ghost-now)/1000)}s`, W-8, hudY); hudY += 16;
      }
      if (abilities.snail > now) {
        ctx.fillStyle = hexToRgba('#eab308', 0.95);
        ctx.font = `bold 9px ${PX}`;
        ctx.fillText(`SLOW ${Math.ceil((abilities.snail-now)/1000)}s`, W-8, hudY);
      }
    }

    function drawGameOver() {
      draw(performance.now());
      ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0,0,W,H);
      // Retro scanlines on overlay
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let y=0; y<H; y+=4) ctx.fillRect(0,y,W,2);
      // Border
      ctx.strokeStyle = '#ff2255'; ctx.lineWidth = 4;
      ctx.strokeRect(20,H/2-70,W-40,140);
      ctx.strokeStyle = '#ff225544'; ctx.lineWidth = 1;
      ctx.strokeRect(24,H/2-66,W-48,132);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff2255';
      ctx.shadowColor = '#ff2255'; ctx.shadowBlur = 20;
      ctx.font = `18px ${PX}`; ctx.fillText('GAME OVER', W/2, H/2-30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffdd00';
      ctx.font = `12px ${PX}`; ctx.fillText(`SCORE  ${padScore(score)}`, W/2, H/2+10);
      ctx.fillStyle = '#4dbb4d';
      ctx.font = `7px ${PX}`; ctx.fillText('PRESS SPACE TO CONTINUE', W/2, H/2+44);
    }

    function endGame() {
      if (!alive) return;
      alive = false; cancelAnimationFrame(rafId); clearInterval(tickTimer); clearInterval(fruitTimer);
      setDisplayScore(score); setPhase('over'); setPowerup(null);
      const prev = parseInt(localStorage.getItem('snake_best_score')||'0',10);
      if (score > prev) localStorage.setItem('snake_best_score', String(score));
      drawGameOver();
      if (user) api.post('/api/scores',{score,level}).then(()=>setScoreSaved(true)).catch(console.error);
    }

    function gameTick() {
      if (!alive) return;
      const now = Date.now(); syncPowerupUI(now);
      tickCount++;
      if (abilities.snail > now && tickCount % 2 === 0) return;
      if (pendingDir) { dir = pendingDir; pendingDir = null; }
      const head = snake[0];
      let nh = { x: head.x+dir.dx, y: head.y+dir.dy };
      if (nh.x<0||nh.x>=GRID||nh.y<0||nh.y>=GRID) {
        if (abilities.ghost > now) nh = { x:((nh.x%GRID)+GRID)%GRID, y:((nh.y%GRID)+GRID)%GRID };
        else { endGame(); return; }
      }
      if (snake.some(s=>s.x===nh.x&&s.y===nh.y)) { endGame(); return; }
      const fi = fruits.findIndex(f=>f.x===nh.x&&f.y===nh.y);
      if (fi !== -1) {
        const eaten = fruits.splice(fi,1)[0];
        const def = FRUIT_TYPES[eaten.type];
        snake = [nh,...snake]; score += def.points; setDisplayScore(score);
        if (def.ability) { abilities[def.ability] = now+def.duration; syncPowerupUI(now+1); flashes.push({text:`${def.icon} ${def.label}!`,color:def.colors[1],x:nh.x*CELL+CELL/2,y:nh.y*CELL,born:now}); }
        else flashes.push({text:`+${def.points}`,color:'#00ff41',x:nh.x*CELL+CELL/2,y:nh.y*CELL,born:now});
      } else snake = [nh,...snake.slice(0,-1)];
    }

    let rafId;
    function renderLoop(t) { if (!alive) return; draw(t); rafId = requestAnimationFrame(renderLoop); }
    rafId = requestAnimationFrame(renderLoop);

    function handleKey(e) {
      if (!alive) return;
      const MAP = { ArrowUp:{dx:0,dy:-1},ArrowDown:{dx:0,dy:1},ArrowLeft:{dx:-1,dy:0},ArrowRight:{dx:1,dy:0},w:{dx:0,dy:-1},s:{dx:0,dy:1},a:{dx:-1,dy:0},d:{dx:1,dy:0} };
      const nd = MAP[e.key]; if (!nd) return;
      if (nd.dx===-dir.dx && nd.dy===-dir.dy) return;
      pendingDir = nd; e.preventDefault();
    }

    spawnFruit();
    const tickTimer = setInterval(gameTick, cfg.tickMs);
    const fruitTimer = setInterval(spawnFruit, cfg.fruitInterval);
    window.addEventListener('keydown', handleKey);

    return () => { alive=false; cancelAnimationFrame(rafId); clearInterval(tickTimer); clearInterval(fruitTimer); window.removeEventListener('keydown',handleKey); };
  }, [gameKey]); // eslint-disable-line

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key===' '||e.key==='Enter') && (phase==='idle'||phase==='over')) { e.preventDefault(); setGameKey(k=>k+1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && gameKey === 0) {
      const ctx = canvas.getContext('2d');
      const themeId = localStorage.getItem('snake_theme') || 'dark';
      drawIdleScreen(ctx, cfg, themeId, lvlColor);
    }
  }, []); // eslint-disable-line

  // ── 90s arcade UI ──────────────────────────────────────────────────────
  const canvasBorderColor = phase==='over' ? '#ff2255' : powerup ? powerup.color+'cc' : lvlColor;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'16px', background:'#000', minHeight:'calc(100vh - 56px)' }}>

      {/* ── Arcade header ── */}
      <div style={{
        width: W, marginBottom: 8,
        background: '#000', border: `2px solid ${lvlColor}`,
        boxShadow: `0 0 12px ${lvlColor}66, inset 0 0 20px rgba(0,0,0,0.8)`,
        padding: '8px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Left: level + powerup */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{
            fontFamily: PX, fontSize: 9,
            color: lvlColor,
            textShadow: `0 0 8px ${lvlColor}`,
            border: `1px solid ${lvlColor}`,
            padding: '3px 8px',
          }}>
            {cfg.label}
          </span>
          {phase === 'running' && (
            <span className="blink" style={{ fontFamily: PX, fontSize: 7, color: '#00ff41' }}>●LIVE</span>
          )}
          {powerup && (
            <span style={{
              fontFamily: PX, fontSize: 7,
              color: powerup.color, border: `1px solid ${powerup.color}`,
              padding: '2px 8px',
              textShadow: `0 0 6px ${powerup.color}`,
              animation: 'blink 0.5s step-end infinite',
            }}>
              {powerup.icon} {powerup.label}
            </span>
          )}
        </div>

        {/* Right: score */}
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily: PX, fontSize: 7, color: '#4dbb4d', marginBottom: 2 }}>SCORE</div>
          <div style={{
            fontFamily: PX, fontSize: 16,
            color: '#ffdd00',
            textShadow: '0 0 10px #ffdd00, 0 0 20px rgba(255,221,0,0.4)',
            letterSpacing: 2,
          }}>
            {padScore(displayScore)}
          </div>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{
        position: 'relative',
        border: `3px solid ${canvasBorderColor}`,
        boxShadow: `0 0 20px ${canvasBorderColor}66, 0 0 40px ${canvasBorderColor}22`,
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <canvas
          ref={canvasRef} width={W} height={H}
          style={{ display:'block', cursor: phase!=='running' ? 'pointer' : 'default' }}
          onClick={() => { if (phase==='idle'||phase==='over') setGameKey(k=>k+1); }}
        />
        {/* Corner pixel decorations */}
        {['0,0','0,auto','auto,0','auto,auto'].map((_,i) => {
          const [t2,b,l,r] = [i<2?0:undefined,i>=2?0:undefined,i%2===0?0:undefined,i%2!==0?0:undefined];
          return (
            <div key={i} style={{
              position:'absolute', top:t2, bottom:b, left:l, right:r,
              width:10, height:10,
              borderTop:    (i<2)  ? `3px solid ${canvasBorderColor}` : undefined,
              borderBottom: (i>=2) ? `3px solid ${canvasBorderColor}` : undefined,
              borderLeft:   (i%2===0) ? `3px solid ${canvasBorderColor}` : undefined,
              borderRight:  (i%2!==0) ? `3px solid ${canvasBorderColor}` : undefined,
              zIndex: 10,
            }}/>
          );
        })}
      </div>

      {/* ── Fruit legend ── */}
      <div style={{
        width: W, marginTop: 8,
        display: 'flex', gap:20, justifyContent:'center',
        fontFamily: PX, fontSize: 7, color: '#2a6e2a',
      }}>
        {[['#e81212','🍎','+10'], ['#818cf8','👻','+20 GHOST'], ['#eab308','🐌','+20 SLOW']].map(([color,icon,text])=>(
          <span key={text} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:color, display:'inline-block', boxShadow:`0 0 5px ${color}` }}/>
            {icon} {text}
          </span>
        ))}
      </div>

      {/* ── Controls panel ── */}
      <div style={{ width: W, marginTop:8, fontFamily: PX }}>
        {phase === 'over' && (
          <div style={{
            background: '#050005', border:'2px solid #ff2255',
            boxShadow: '0 0 12px rgba(255,34,85,0.3)',
            padding:'12px', marginBottom:10,
          }}>
            {user ? (
              scoreSaved
                ? <div style={{color:'#00ff41',fontSize:8,marginBottom:10}}>
                    ✓ SCORE SAVED!{' '}
                    <Link to="/scores" style={{color:'#00ffff'}}>VIEW STATS</Link>
                  </div>
                : <div style={{color:'#4dbb4d',fontSize:8,marginBottom:10}}>SAVING...</div>
            ) : (
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:PX,fontSize:7,color:'#ffdd00',marginBottom:8}}>
                  PLAYING AS GUEST — SCORE NOT SAVED
                </div>
                <div style={{display:'flex',gap:8}}>
                  <Link to="/register">
                    <button className="btn btn-primary" style={{fontSize:'7px',padding:'6px 12px'}}>
                      REGISTER FREE
                    </button>
                  </Link>
                  <Link to="/login">
                    <button className="btn btn-secondary" style={{fontSize:'7px',padding:'6px 12px'}}>
                      LOGIN
                    </button>
                  </Link>
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setGameKey(k=>k+1)} className="btn btn-primary">▶ PLAY AGAIN</button>
              <button onClick={()=>navigate('/')} className="btn btn-secondary">◀ LEVELS</button>
              <Link to="/customize"><button className="btn btn-secondary">🎨 SKINS</button></Link>
            </div>
          </div>
        )}

        {phase === 'idle' && (
          <div style={{display:'flex',gap:10,marginBottom:10}}>
            <button onClick={()=>setGameKey(k=>k+1)} className="btn btn-primary">▶ START</button>
            <button onClick={()=>navigate('/')} className="btn btn-secondary">◀ BACK</button>
            <Link to="/customize"><button className="btn btn-secondary">🎨 SKINS</button></Link>
          </div>
        )}

        <div style={{color:'#1a4d1a',fontSize:7,letterSpacing:1}}>
          ARROW KEYS / WASD TO MOVE &nbsp;·&nbsp; SPACE TO START
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IDLE SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function drawIdleScreen(ctx, cfg, themeId, lvlColor) {
  drawBackground(ctx, themeId, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, W, H);

  // Scanlines on overlay
  for (let y = 0; y < H; y += 4) { ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(0,y,W,2); }

  // Border
  ctx.strokeStyle = lvlColor; ctx.lineWidth = 3;
  ctx.strokeRect(24, H/2-90, W-48, 180);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ff41';
  ctx.shadowColor = '#00ff41'; ctx.shadowBlur = 22;
  ctx.font = `22px ${PX}`; ctx.fillText('🐍 SNAKE', W/2, H/2-52);
  ctx.shadowBlur = 0;

  ctx.fillStyle = lvlColor;
  ctx.shadowColor = lvlColor; ctx.shadowBlur = 12;
  ctx.font = `11px ${PX}`; ctx.fillText(cfg.label + ' MODE', W/2, H/2-14);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#2a7a2a';
  ctx.font = `7px ${PX}`; ctx.fillText('GHOST  SLOW  RARE FRUITS', W/2, H/2+20);

  ctx.fillStyle = '#00ff41';
  ctx.font = `8px ${PX}`;
  // Blinking handled by drawing at fixed time — just show it
  ctx.fillText('PRESS SPACE TO START', W/2, H/2+58);

  ctx.fillStyle = '#1a4d1a';
  ctx.font = `6px ${PX}`; ctx.fillText('INSERT COIN', W/2, H/2+82);
}
