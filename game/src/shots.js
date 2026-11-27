// The screenshot scenes behind ?shot=start|play|kitchen|end. Each one plays
// the real rules forward from a fresh world for a fixed stretch, steered by a
// simple autopilot (jump the low things, duck the high ones, hide in a bush
// when the farmer is close), so the frame is what a real run looks like and
// the same seed always gives the same frame.

import { DUCK_KINDS, EVENT_OVER, JUMP_KINDS } from './world.js';
import { PLAYER, SPAWN, STEP } from './tuning.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './hud.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 24;
const KITCHEN_DISTANCE = 700;
const END_LIMIT_SECONDS = 600;
/** How far ahead, in seconds, the autopilot reacts: the play scenes look well ahead. */
const HORIZON_PLAY = 0.45;
const HORIZON_END = 0.16;

/** The nearest obstacle that still overlaps the turkey's box, or null. */
function nearestObstacle(state) {
  let nearest = null;
  for (const obstacle of state.obstacles) {
    // An obstacle counts until its far edge has passed the turkey's tail.
    if (obstacle.x + obstacle.w < PLAYER.x) continue;
    if (nearest === null || obstacle.x < nearest.x) nearest = obstacle;
  }
  return nearest;
}

/**
 * Decide this step's actions. A jump lasts about 0.96 s (2 * 1250 / 2600)
 * and peaks halfway, so the skilled pilot jumps when the obstacle will reach
 * the turkey near the peak and its far edge will have passed the turkey's
 * tail before the landing. A short horizon means a sloppy pilot: it jumps
 * only once the obstacle is almost on the turkey, and ducks once it is
 * already there, which is how the end scene is caught.
 */
export function autopilot(state, horizon) {
  const player = state.player;
  const obstacle = nearestObstacle(state);
  const skilled = horizon > 0.3;
  let jump = false;
  let duck = false;
  const front = PLAYER.x + PLAYER.width;
  if (obstacle !== null) {
    const approach = state.speed + (obstacle.kind === 'pumpkin' ? SPAWN.pumpkinRoll : 0);
    const nearEdge = obstacle.x - front;
    if (JUMP_KINDS.includes(obstacle.kind) && player.grounded) {
      if (skilled) {
        const arrival = nearEdge / approach;
        const clearBy = (nearEdge + obstacle.w + PLAYER.width) / approach;
        if (nearEdge > 0 && arrival <= 0.48 && clearBy <= 0.9) jump = true;
      } else if (nearEdge <= 20 && nearEdge > -30) {
        jump = true;
      }
    }
    // Ducking is instant, so the skilled pilot ducks with room to spare and
    // the sloppy pilot only once the obstacle is already on the turkey.
    if (DUCK_KINDS.includes(obstacle.kind)) {
      duck = skilled ? nearEdge < 130 : nearEdge < -10;
    }
  }
  // A jump obstacle right behind a duck obstacle: jump the instant the duck
  // obstacle stops being overhead, instead of waiting for the jump window.
  if (!jump && skilled && player.grounded && obstacle !== null && DUCK_KINDS.includes(obstacle.kind)) {
    const overhead = obstacle.x < front && obstacle.x + obstacle.w > PLAYER.x;
    if (!overhead) {
      for (const next of state.obstacles) {
        if (next === obstacle || next.x + next.w < front) continue;
        if (JUMP_KINDS.includes(next.kind) && next.x - front > 0 && next.x - front < 200) {
          jump = true;
          break;
        }
      }
    }
  }
  // Hide in a bush when the farmer is breathing down the turkey's neck.
  if (!jump && state.farmer.gap < 200) {
    for (const bush of state.bushes) {
      if (!bush.used && PLAYER.x + PLAYER.width > bush.x + 10 && PLAYER.x < bush.x + bush.w - 10) {
        duck = true;
        break;
      }
    }
  }
  return { jump, duck };
}

/**
 * Set `world` to the named scene (start, play, kitchen or end; any other name
 * is start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, autopilot(world.state, HORIZON_PLAY));
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'kitchen') {
    for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
      if (world.state.distance >= KITCHEN_DISTANCE) break;
      if (world.step(STEP, autopilot(world.state, HORIZON_PLAY)) & EVENT_OVER) break;
    }
    const over = world.state.over;
    return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const horizon = name === 'end' ? HORIZON_END : HORIZON_PLAY;
  for (let index = 0; index < limit / STEP; index += 1) {
    if (world.step(STEP, autopilot(world.state, horizon)) & EVENT_OVER) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
