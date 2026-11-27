// The renderer: it paints the world, the HUD and the title, pause and end
// screens onto the canvas. The playfield is a fixed 1280x720 logical area;
// the canvas is scaled by CSS to fit the window.

import { FARMER, FIELD, FONT, PALETTE, PLAYER, STAGES } from './tuning.js';
import { drawBush, drawFarmer, drawObstacle, drawParticles, drawPickup, drawScenery, drawTurkey } from './art.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
}

function heart(ctx, x, y, filled, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = filled ? '#ff5a6e' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
  ctx.fill();
  ctx.restore();
}

function drawHud(ctx, state, best, warning) {
  ctx.textBaseline = 'alphabetic';
  // Score, top left.
  panel(ctx, 20, 16, 250, 64);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 38, 40);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText(String(state.score), 38, 68);
  // Distance and stage, top centre.
  panel(ctx, FIELD.width / 2 - 150, 16, 300, 64);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(STAGES[state.stage].name.toUpperCase(), FIELD.width / 2, 40);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText(`${Math.floor(state.distance)} m`, FIELD.width / 2, 68);
  // Lives, top right.
  panel(ctx, FIELD.width - 210, 16, 190, 64);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('LIVES', FIELD.width - 192, 40);
  for (let i = 0; i < 3; i += 1) {
    heart(ctx, FIELD.width - 168 + i * 34, 58, i < state.lives);
  }
  // Best, under the score.
  ctx.fillStyle = 'rgba(255, 246, 230, 0.75)';
  ctx.font = `600 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`BEST ${Math.max(best, state.score)}`, 38, 102);
  // The farmer is close: warn the player.
  if (warning) {
    ctx.fillStyle = Math.floor(state.time * 6) % 2 === 0 ? PALETTE.danger : '#ff8a7a';
    ctx.font = `800 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('⚠ THE FARMER IS CLOSE! ⚠', FIELD.width / 2, 128);
  }
  if (state.farmer.mode === 'search') {
    ctx.fillStyle = PALETTE.good;
    ctx.font = `800 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Shhh… hidden in the bush!', FIELD.width / 2, 128);
  }
}

function drawTitle(ctx, state, best, now) {
  ctx.fillStyle = 'rgba(30, 16, 8, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // The turkey and the farmer, eyeing each other across the title.
  drawTurkey(ctx, 400, 560, { bob: now * 2 });
  drawFarmer(ctx, 880, 560, { bob: now * 2 });
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 92px ${FONT}`;
  ctx.fillText('TURKEY RUN', FIELD.width / 2, 210);
  ctx.fillStyle = '#ffd94d';
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText('A Thanksgiving Escape', FIELD.width / 2, 262);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText('The farmer wants you for dinner. Run 1000 m to the back gate —', FIELD.width / 2, 330);
  ctx.fillText('and do not let him catch you.', FIELD.width / 2, 362);
  panel(ctx, FIELD.width / 2 - 330, 396, 660, 152);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText('SPACE / ↑ / CLICK — jump      ↓ — duck & hide in bushes', FIELD.width / 2, 432);
  ctx.fillText('P — pause      M — mute      R — restart', FIELD.width / 2, 466);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText('Jump fences and ovens, duck under knives and washing lines,', FIELD.width / 2, 500);
  ctx.fillText('grab corn and pie — and mind the rolling pumpkins.', FIELD.width / 2, 528);
  if (best > 0) {
    ctx.fillStyle = '#ffd94d';
    ctx.font = `700 24px ${FONT}`;
    ctx.fillText(`Best escape so far: ${best} points`, FIELD.width / 2, 576);
  }
  ctx.fillStyle = Math.floor(now * 2) % 2 === 0 ? PALETTE.text : 'rgba(255,246,230,0.45)';
  ctx.font = `800 28px ${FONT}`;
  ctx.fillText('PRESS SPACE OR CLICK TO RUN', FIELD.width / 2, 648);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(30, 16, 8, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 64px ${FONT}`;
  ctx.fillText('PAUSED', FIELD.width / 2, 340);
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText('Press P or click to keep running', FIELD.width / 2, 396);
}

function drawOver(ctx, state, best, now) {
  const escaped = state.overReason === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(40, 60, 16, 0.6)' : 'rgba(40, 10, 8, 0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // When the turkey is caught the chasing farmer is already standing over
  // it, so only the escape gets a second figure to celebrate with.
  if (escaped) drawTurkey(ctx, 880, 560, { bob: 0 });
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#ffd94d' : PALETTE.danger;
  ctx.font = `800 88px ${FONT}`;
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', FIELD.width / 2, 220);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(
    escaped
      ? 'You slipped through the back gate — Thanksgiving is saved!'
      : 'The farmer got you… but the farm remembers a brave turkey.',
    FIELD.width / 2, 276,
  );
  panel(ctx, FIELD.width / 2 - 260, 320, 520, 170);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText('SCORE', FIELD.width / 2, 356);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 48px ${FONT}`;
  ctx.fillText(String(state.score), FIELD.width / 2, 408);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText(`Distance ${Math.floor(state.distance)} m   ·   Best ${Math.max(best, state.score)}`, FIELD.width / 2, 452);
  ctx.fillStyle = Math.floor(now * 2) % 2 === 0 ? PALETTE.text : 'rgba(255,246,230,0.45)';
  ctx.font = `800 28px ${FONT}`;
  ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', FIELD.width / 2, 560);
}

export function createRenderer(canvas) {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  const ctx = canvas.getContext('2d');

  /**
   * Paint one frame. `screen` is title, play, paused or over; `best` is the
   * saved best score; `ui` carries the mute flag and the farmer warning.
   */
  function draw(state, screen, best, ui) {
    drawScenery(ctx, state);
    for (const bush of state.bushes) drawBush(ctx, bush);
    for (const pickup of state.pickups) drawPickup(ctx, pickup);
    for (const obstacle of state.obstacles) drawObstacle(ctx, obstacle);
    drawParticles(ctx, state.particles);
    // The farmer runs behind the turkey; his front is `gap` pixels back.
    const farmerX = PLAYER.x - state.farmer.gap - 33;
    drawFarmer(ctx, farmerX, FIELD.groundY, {
      bob: state.farmer.bob,
      searching: state.farmer.mode === 'search',
    });
    drawTurkey(ctx, PLAYER.x + 30, FIELD.groundY, {
      ducking: state.player.ducking,
      bob: state.player.bob,
      flash: state.player.invulnerable > 0,
    });
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawHud(ctx, state, best, ui.warning);
    }
    if (screen === SCREEN_TITLE) drawTitle(ctx, state, best, ui.now);
    if (screen === SCREEN_PAUSED) drawPaused(ctx);
    if (screen === SCREEN_OVER) drawOver(ctx, state, best, ui.now);
    // Mute note, bottom right.
    if (ui.muted) {
      ctx.fillStyle = 'rgba(255, 246, 230, 0.8)';
      ctx.font = `600 16px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText('MUTED (M)', FIELD.width - 20, FIELD.height - 16);
    }
  }

  return { draw };
}
