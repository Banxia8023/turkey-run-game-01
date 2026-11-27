// All of the game's art, drawn with canvas paths: the turkey, the farmer,
// the farmyard, the barn lane and the kitchen, and every obstacle. Nothing
// is loaded from a file, so the game has no art assets to fetch.

import { FIELD, PALETTE, STAGES } from './tuning.js';

/** The turkey, standing on `feetY`, facing right. `bob` animates its legs. */
export function drawTurkey(ctx, x, feetY, { ducking = false, bob = 0, flash = false, scale = 1 } = {}) {
  ctx.save();
  ctx.translate(x, feetY);
  ctx.scale(scale, scale);
  if (flash && Math.floor(bob * 14) % 2 === 0) ctx.globalAlpha = 0.35;
  const legSwing = Math.sin(bob) * 10;
  const bodyY = ducking ? -26 : -46;
  // Fanned tail, in autumn colours.
  ctx.save();
  ctx.translate(-26, bodyY + 8);
  for (let i = 0; i < 5; i += 1) {
    const angle = -0.9 + i * 0.45;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = PALETTE.tail[i % PALETTE.tail.length];
    ctx.beginPath();
    ctx.ellipse(-16, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // Legs, running.
  ctx.strokeStyle = PALETTE.leg;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, bodyY + 16);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(6, bodyY + 16);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();
  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(0, bodyY, 30, ducking ? 18 : 24, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = PALETTE.turkeyWing;
  ctx.beginPath();
  ctx.ellipse(-4, bodyY + 2, 16, 10, -0.4 + Math.sin(bob * 2) * 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Head and neck.
  const headX = ducking ? 22 : 24;
  const headY = ducking ? bodyY - 6 : bodyY - 28;
  ctx.strokeStyle = PALETTE.turkeyBody;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(16, bodyY - 8);
  ctx.quadraticCurveTo(24, bodyY - 18, headX, headY);
  ctx.stroke();
  ctx.fillStyle = PALETTE.head;
  ctx.beginPath();
  ctx.arc(headX, headY, 11, 0, Math.PI * 2);
  ctx.fill();
  // Beak, wattle, eye.
  ctx.fillStyle = PALETTE.beak;
  ctx.beginPath();
  ctx.moveTo(headX + 8, headY - 2);
  ctx.lineTo(headX + 20, headY + 2);
  ctx.lineTo(headX + 8, headY + 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.wattle;
  ctx.beginPath();
  ctx.ellipse(headX + 6, headY + 9, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d1712';
  ctx.beginPath();
  ctx.arc(headX + 4, headY - 3, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The farmer, standing on `feetY`, running right. `searching` makes him look around. */
export function drawFarmer(ctx, x, feetY, { bob = 0, searching = false } = {}) {
  ctx.save();
  ctx.translate(x, feetY);
  const legSwing = Math.sin(bob) * 12;
  const lean = searching ? 0 : 0.12;
  ctx.rotate(lean);
  // Legs in overalls.
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -52);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(6, -52);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();
  // Body: shirt and overalls.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.beginPath();
  ctx.roundRect(-20, -96, 44, 48, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.beginPath();
  ctx.roundRect(-18, -72, 40, 26, 6);
  ctx.fill();
  // Arms, pumping as he runs (or on his hips while searching).
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 8;
  ctx.beginPath();
  if (searching) {
    ctx.moveTo(-18, -88);
    ctx.lineTo(-26, -62);
    ctx.moveTo(20, -88);
    ctx.lineTo(28, -62);
  } else {
    ctx.moveTo(-16, -90);
    ctx.lineTo(-30, -66 + legSwing * 0.5);
    ctx.moveTo(20, -90);
    ctx.lineTo(32, -66 - legSwing * 0.5);
  }
  ctx.stroke();
  // Head, beard and straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(4, -108, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerBeard;
  ctx.beginPath();
  ctx.ellipse(8, -98, 10, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d1712';
  ctx.beginPath();
  ctx.arc(10, -110, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(4, -120, 24, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-8, -134, 24, 14, 5);
  ctx.fill();
  ctx.restore();
}

function drawCloud(ctx, x, y, scale, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 20 * scale, y - 8 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.arc(x + 44 * scale, y, 18 * scale, 0, Math.PI * 2);
  ctx.fill();
}

/** The scenery behind the run: sky, sun, clouds, distant farm, fences, ground. */
export function drawScenery(ctx, state) {
  const stage = STAGES[state.stage];
  const { width, height, groundY } = FIELD;
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, stage.skyTop);
  sky.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY + 2);
  // Sun.
  ctx.fillStyle = stage.sun;
  ctx.beginPath();
  ctx.arc(1060, 110, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(1060, 110, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Drifting clouds outdoors; the kitchen has a ceiling instead.
  if (state.stage !== 2) {
    drawCloud(ctx, 200 - (state.scroll * 0.08) % 1400, 90, 1, 'rgba(255,255,255,0.75)');
    drawCloud(ctx, 760 - (state.scroll * 0.08) % 1400, 150, 0.8, 'rgba(255,255,255,0.6)');
    drawCloud(ctx, 1180 - (state.scroll * 0.08) % 1400, 70, 1.1, 'rgba(255,255,255,0.5)');
  }
  // Distant silhouettes: barns and trees outdoors, a long table and shelves in the kitchen.
  ctx.fillStyle = stage.far;
  const farStep = state.stage === 2 ? 520 : 420;
  const farOffset = (state.scroll * 0.25) % farStep;
  for (let x = -farOffset; x < width + farStep; x += farStep) {
    if (state.stage === 2) {
      // A kitchen table with a pie and a pot, and a shelf of plates.
      ctx.fillRect(x + 40, groundY - 150, 240, 16);
      ctx.fillRect(x + 60, groundY - 134, 14, 134);
      ctx.fillRect(x + 246, groundY - 134, 14, 134);
      ctx.beginPath();
      ctx.arc(x + 120, groundY - 168, 26, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x + 190, groundY - 190, 40, 40);
      ctx.fillRect(x + 340, groundY - 260, 140, 10);
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(x + 370 + i * 40, groundY - 282, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      continue;
    }
    // A barn.
    ctx.beginPath();
    ctx.moveTo(x + 40, groundY - 90);
    ctx.lineTo(x + 40, groundY - 150);
    ctx.lineTo(x + 110, groundY - 185);
    ctx.lineTo(x + 180, groundY - 150);
    ctx.lineTo(x + 180, groundY - 90);
    ctx.closePath();
    ctx.fill();
    // A tree.
    ctx.beginPath();
    ctx.arc(x + 300, groundY - 130, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 292, groundY - 100, 16, 40);
  }
  if (state.stage === 2) {
    // The kitchen: a window with evening light and a hanging pan or two.
    ctx.fillStyle = 'rgba(255, 233, 176, 0.9)';
    ctx.fillRect(120, 120, 180, 200);
    ctx.strokeStyle = stage.near;
    ctx.lineWidth = 10;
    ctx.strokeRect(120, 120, 180, 200);
    ctx.beginPath();
    ctx.moveTo(210, 120);
    ctx.lineTo(210, 320);
    ctx.moveTo(120, 220);
    ctx.lineTo(300, 220);
    ctx.stroke();
    ctx.fillStyle = stage.near;
    ctx.beginPath();
    ctx.arc(900, 180, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(894, 180, 12, 44);
  }
  // Near fence posts outdoors, scrolling at full speed; a skirting board in the kitchen.
  ctx.fillStyle = stage.near;
  if (state.stage === 2) {
    ctx.fillRect(0, groundY - 14, width, 14);
  } else {
    const postOffset = state.scroll % 180;
    for (let x = -postOffset; x < width + 180; x += 180) {
      ctx.fillRect(x, groundY - 64, 10, 64);
    }
    ctx.fillRect(0, groundY - 56, width, 6);
    ctx.fillRect(0, groundY - 34, width, 6);
  }
  // Ground: grass tufts outdoors, floorboard seams in the kitchen.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, groundY, width, height - groundY);
  if (state.stage === 2) {
    ctx.strokeStyle = stage.near;
    ctx.lineWidth = 2;
    const seamOffset = state.scroll % 130;
    for (let x = -seamOffset; x < width + 130; x += 130) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    return;
  }
  ctx.fillStyle = stage.grass;
  const tuftOffset = state.scroll % 90;
  for (let x = -tuftOffset; x < width + 90; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 8);
    ctx.lineTo(x + 6, groundY - 6);
    ctx.lineTo(x + 12, groundY + 8);
    ctx.closePath();
    ctx.fill();
  }
}

/** A bush the turkey can hide in while the farmer searches. */
export function drawBush(ctx, bush) {
  ctx.fillStyle = '#4e7a34';
  ctx.beginPath();
  ctx.arc(bush.x + 20, FIELD.groundY - 26, 26, 0, Math.PI * 2);
  ctx.arc(bush.x + 55, FIELD.groundY - 36, 32, 0, Math.PI * 2);
  ctx.arc(bush.x + 90, FIELD.groundY - 24, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d8f3e';
  ctx.beginPath();
  ctx.arc(bush.x + 38, FIELD.groundY - 40, 12, 0, Math.PI * 2);
  ctx.arc(bush.x + 70, FIELD.groundY - 46, 10, 0, Math.PI * 2);
  ctx.fill();
}

/** Corn, pie and the golden feather. */
export function drawPickup(ctx, pickup) {
  const bob = Math.sin(pickup.x * 0.02) * 3;
  if (pickup.kind === 'corn') {
    ctx.fillStyle = PALETTE.corn;
    ctx.beginPath();
    ctx.ellipse(pickup.x + 11, pickup.y + 11 + bob, 9, 13, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9962e';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(pickup.x + 11 + i * 5, pickup.y + 2 + bob);
      ctx.lineTo(pickup.x + 11 + i * 5, pickup.y + 20 + bob);
      ctx.stroke();
    }
  } else if (pickup.kind === 'pie') {
    ctx.fillStyle = PALETTE.pie;
    ctx.beginPath();
    ctx.moveTo(pickup.x, pickup.y + 22 + bob);
    ctx.lineTo(pickup.x + 13, pickup.y + bob);
    ctx.lineTo(pickup.x + 26, pickup.y + 22 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f6d9a0';
    ctx.beginPath();
    ctx.arc(pickup.x + 13, pickup.y + 16 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = PALETTE.feather;
    ctx.save();
    ctx.translate(pickup.x + 13, pickup.y + 13 + bob);
    ctx.rotate(0.6);
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 217, 77, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pickup.x + 13, pickup.y + 13 + bob, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** One obstacle, drawn in its own style. */
export function drawObstacle(ctx, obstacle) {
  const { kind, x, y, w, h } = obstacle;
  if (kind === 'fence') {
    ctx.fillStyle = PALETTE.fence;
    ctx.fillRect(x, y, 8, h);
    ctx.fillRect(x + w - 8, y, 8, h);
    ctx.fillRect(x - 6, y + 8, w + 12, 8);
    ctx.fillRect(x - 6, y + 34, w + 12, 8);
  } else if (kind === 'hay') {
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h, w / 2, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c9962e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h, (w / 2) * (0.35 + i * 0.2), Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  } else if (kind === 'pumpkin') {
    ctx.fillStyle = '#e8892e';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45a12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 4, h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#4e7a34';
    ctx.fillRect(x + w / 2 - 3, y - 8, 6, 12);
  } else if (kind === 'puddle') {
    ctx.fillStyle = '#5a8fc4';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2 + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2 - 20, y + h / 2, w / 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'line') {
    // A washing line with a sheet to duck under.
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 30, y + 6);
    ctx.lineTo(x + w + 30, y + 6);
    ctx.stroke();
    ctx.fillStyle = '#f2ede2';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 6, w - 4, 34, 4);
    ctx.fill();
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.arc(x + 12, y + 44, 8, 0, Math.PI * 2);
    ctx.arc(x + w - 12, y + 44, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'knife') {
    // A carving knife swinging from a hook.
    const swingX = Math.sin(obstacle.swing) * 26;
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, 0);
    ctx.lineTo(x + w / 2 + swingX, y + 10);
    ctx.stroke();
    ctx.save();
    ctx.translate(x + w / 2 + swingX, y + 10);
    ctx.rotate(Math.sin(obstacle.swing) * 0.35);
    ctx.fillStyle = PALETTE.knife;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.lineTo(4, 78);
    ctx.lineTo(0, 96);
    ctx.lineTo(-4, 78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeHandle;
    ctx.fillRect(-11, -22, 22, 24);
    ctx.restore();
  } else if (kind === 'oven') {
    // The kitchen oven, door glowing with heat.
    ctx.fillStyle = PALETTE.oven;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#22262d';
    ctx.beginPath();
    ctx.roundRect(x + 14, y + 30, w - 28, h - 44, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.ovenFire;
    ctx.globalAlpha = 0.75 + Math.sin(obstacle.swing * 3) * 0.2;
    ctx.beginPath();
    ctx.roundRect(x + 22, y + 38, w - 44, h - 58, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#dfe4ea';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(x + 40 + i * 30, y + 14, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Heat shimmer marks above the oven.
    ctx.strokeStyle = 'rgba(255, 154, 60, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 30, y - 8);
    ctx.quadraticCurveTo(x + 36, y - 20, x + 30, y - 30);
    ctx.moveTo(x + w - 30, y - 8);
    ctx.quadraticCurveTo(x + w - 36, y - 20, x + w - 30, y - 30);
    ctx.stroke();
  }
}

/** Feathers, dust and splashes. */
export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.max);
    if (p.kind === 'feather') {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = PALETTE.tail[1];
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 6, 3, p.vx * 0.01, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'splash') {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#7fb2e0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = '#d8c9a8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
