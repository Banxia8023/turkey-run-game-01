// The escape itself: the turkey, the farmer on its heels, the obstacles,
// the food, the bushes to hide in, and the three stages from farmyard to
// kitchen. The world runs in fixed 1/60 s steps and is fully deterministic
// for a seed, so the screenshot scenes can be staged exactly.

import {
  ESCAPE_DISTANCE,
  FARMER,
  FIELD,
  LIVES,
  PICKUP,
  PLAYER,
  PX_PER_METRE,
  SPEED,
  SPAWN,
  STAGES,
} from './tuning.js';
import { createRandom, pickFloat, pickInt, pickOne } from './rng.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_ESCAPED = 4;
export const EVENT_PICKUP = 8;
export const EVENT_JUMP = 16;
export const EVENT_LAND = 32;
export const EVENT_HIDDEN = 64;
export const EVENT_SPLASH = 128;

const KIND_FENCE = 'fence';
const KIND_HAY = 'hay';
const KIND_PUMPKIN = 'pumpkin';
const KIND_PUDDLE = 'puddle';
const KIND_LINE = 'line';
const KIND_KNIFE = 'knife';
const KIND_OVEN = 'oven';

/** Obstacles the turkey jumps over, and ones it ducks under. */
export const JUMP_KINDS = [KIND_FENCE, KIND_HAY, KIND_PUMPKIN, KIND_PUDDLE, KIND_OVEN];
export const DUCK_KINDS = [KIND_LINE, KIND_KNIFE];

function obstacleSize(kind) {
  switch (kind) {
    case KIND_FENCE: return { w: 30, h: 74 };
    case KIND_HAY: return { w: 96, h: 66 };
    case KIND_PUMPKIN: return { w: 52, h: 52 };
    case KIND_PUDDLE: return { w: 120, h: 14 };
    case KIND_LINE: return { w: 44, h: 40 };
    case KIND_KNIFE: return { w: 36, h: 120 };
    case KIND_OVEN: return { w: 140, h: 96 };
    default: return { w: 40, h: 60 };
  }
}

/** Which obstacles can appear in each stage, weighted. */
function stageKinds(stageIndex) {
  if (stageIndex === 0) return [KIND_FENCE, KIND_FENCE, KIND_HAY, KIND_PUMPKIN, KIND_PUDDLE, KIND_LINE];
  if (stageIndex === 1) return [KIND_FENCE, KIND_HAY, KIND_HAY, KIND_PUMPKIN, KIND_PUDDLE, KIND_LINE, KIND_LINE];
  return [KIND_OVEN, KIND_OVEN, KIND_KNIFE, KIND_KNIFE, KIND_HAY, KIND_PUMPKIN, KIND_LINE];
}

function stageFor(distance) {
  let index = 0;
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance >= STAGES[i].from) index = i;
  }
  return index;
}

/**
 * Create a fresh world for `seed`. `state` is plain data the renderer and
 * the screenshot autopilot read; `step` advances it one fixed step.
 */
export function createWorld(seed) {
  let random = createRandom(seed);
  // One state object for the world's whole life: reset() refills it instead
  // of replacing it, so the renderer and the autopilot never hold a stale one.
  const state = freshState();

  function freshState() {
    return {
      time: 0,
      distance: 0,
      scroll: 0,
      speed: SPEED.start,
      score: 0,
      bonus: 0,
      lives: LIVES,
      best: 0,
      stage: 0,
      over: false,
      overReason: null,
      player: {
        y: FIELD.groundY - PLAYER.height,
        vy: 0,
        grounded: true,
        ducking: false,
        invulnerable: 0,
        slow: 0,
        bob: 0,
      },
      farmer: { gap: FARMER.startGap, mode: 'chase', search: 0, bob: 0 },
      obstacles: [],
      pickups: [],
      bushes: [],
      particles: [],
      spawnIn: 420,
      bushIn: 700,
      dustIn: 0,
    };
  }

  function reset() {
    random = createRandom(seed);
    Object.assign(state, freshState());
  }

  function currentSpeed() {
    const base = Math.min(SPEED.max, SPEED.start + state.distance * SPEED.perMetre);
    const slowFactor = state.player.slow > 0 ? 0.55 : 1;
    const duckFactor = state.player.ducking ? 0.92 : 1;
    return base * slowFactor * duckFactor;
  }

  function playerBox() {
    // The box follows the turkey's real height: while it jumps, player.y is
    // its top in the air; while it ducks, the box is shorter and lower.
    const height = state.player.ducking ? PLAYER.duckHeight : PLAYER.height;
    return { x: PLAYER.x, y: state.player.y + (PLAYER.height - height), w: PLAYER.width, h: height };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnObstacle() {
    // The obstacle before this one: a duck obstacle leaves extra room after it.
    const previous = state.obstacles[state.obstacles.length - 1];
    const kind = pickOne(random, stageKinds(state.stage));
    const size = obstacleSize(kind);
    const obstacle = {
      kind,
      x: FIELD.width + 80,
      w: size.w,
      h: size.h,
      // Puddles lie on the ground; hanging things hang from above the turkey's head.
      y: kind === KIND_LINE ? FIELD.groundY - 108 : kind === KIND_KNIFE ? FIELD.groundY - 196 : FIELD.groundY - size.h,
      swing: random() * Math.PI * 2,
      passed: false,
    };
    state.obstacles.push(obstacle);
    // A jumping obstacle often carries a little arc of corn above it.
    if (JUMP_KINDS.includes(kind) && random() < 0.55) {
      const top = obstacle.y - 26;
      for (let i = -1; i <= 1; i += 1) {
        state.pickups.push({
          kind: 'corn',
          x: obstacle.x + obstacle.w / 2 + i * 44 - PICKUP.corn.size / 2,
          y: top - 58 + Math.abs(i) * 26,
          taken: false,
        });
      }
    }
    // Rare treats float where only a well-timed jump reaches them.
    const roll = random();
    if (roll < 0.06) {
      state.pickups.push({ kind: 'feather', x: FIELD.width + 320, y: FIELD.groundY - 260, taken: false });
    } else if (roll < 0.16) {
      state.pickups.push({ kind: 'pie', x: FIELD.width + 260, y: FIELD.groundY - 150, taken: false });
    }
    // The gap is a span of time, not pixels: it grows with speed, so the
    // time between obstacles stays fair, and a duck obstacle leaves room to
    // jump the next one after it.
    let gap = state.speed * pickFloat(random, SPAWN.gapTimeMin, SPAWN.gapTimeMax);
    if (previous !== undefined && (previous.kind === KIND_LINE || previous.kind === KIND_KNIFE)) gap += SPAWN.duckBonus;
    state.spawnIn = gap;
  }

  function spawnBush() {
    state.bushes.push({ x: FIELD.width + 120, w: 110, used: false });
    state.bushIn = pickFloat(random, 900, 1500);
  }

  function burst(x, y, kind, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x, y,
        vx: pickFloat(random, -140, 40),
        vy: pickFloat(random, -260, -40),
        life: pickFloat(random, 0.4, 0.9),
        max: 0.9,
        kind,
      });
    }
  }

  function stumble(events) {
    state.lives -= 1;
    state.player.invulnerable = PLAYER.invulnerable;
    state.player.slow = 0.7;
    state.farmer.gap -= FARMER.stumbleGain;
    burst(PLAYER.x + PLAYER.width / 2, FIELD.groundY - 40, 'feather', 10);
    if (state.lives <= 0) {
      state.over = true;
      state.overReason = 'caught';
      return events | EVENT_HIT | EVENT_OVER;
    }
    return events | EVENT_HIT;
  }

  /**
   * Advance the world one fixed step. `actions` is { jump: boolean, duck: boolean }.
   * Returns a bitmask of the events that happened in this step.
   */
  function step(dt, actions) {
    let events = 0;
    if (state.over) return events;
    state.time += dt;
    const player = state.player;

    // --- the turkey ---
    player.ducking = actions.duck && player.grounded;
    if (actions.jump && player.grounded && !player.ducking) {
      player.vy = PLAYER.jumpVelocity;
      player.grounded = false;
      events |= EVENT_JUMP;
    }
    if (!player.grounded) {
      player.vy += PLAYER.gravity * dt;
      player.y += player.vy * dt;
      if (player.y + PLAYER.height >= FIELD.groundY) {
        player.y = FIELD.groundY - PLAYER.height;
        player.vy = 0;
        player.grounded = true;
        events |= EVENT_LAND;
      }
    }
    if (player.invulnerable > 0) player.invulnerable -= dt;
    if (player.slow > 0) player.slow -= dt;
    player.bob += dt * (state.speed / 36);

    // --- the run ---
    state.speed = currentSpeed();
    const advance = state.speed * dt;
    state.scroll += advance;
    state.distance = state.scroll / PX_PER_METRE;
    state.stage = stageFor(state.distance);
    state.score = Math.floor(state.distance) + state.bonus;

    // Dust at the turkey's feet while it runs.
    state.dustIn -= dt;
    if (player.grounded && state.dustIn <= 0) {
      state.dustIn = 0.14;
      state.particles.push({
        x: PLAYER.x + 8, y: FIELD.groundY - 4,
        vx: pickFloat(random, -90, -30), vy: pickFloat(random, -50, -10),
        life: 0.4, max: 0.4, kind: 'dust',
      });
    }

    // --- spawning ---
    state.spawnIn -= advance;
    if (state.spawnIn <= 0) spawnObstacle();
    state.bushIn -= advance;
    if (state.bushIn <= 0) spawnBush();

    // --- move everything left ---
    for (const obstacle of state.obstacles) {
      obstacle.x -= advance;
      if (obstacle.kind === KIND_PUMPKIN) obstacle.x -= SPAWN.pumpkinRoll * dt;
      if (obstacle.kind === KIND_KNIFE) obstacle.swing += dt * 2.2;
    }
    for (const pickup of state.pickups) pickup.x -= advance;
    for (const bush of state.bushes) bush.x -= advance;
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    state.obstacles = state.obstacles.filter((o) => o.x + o.w > -100);
    state.pickups = state.pickups.filter((p) => !p.taken && p.x > -60);
    state.bushes = state.bushes.filter((b) => b.x + b.w > -100);

    // --- pickups ---
    const box = playerBox();
    for (const pickup of state.pickups) {
      const size = PICKUP[pickup.kind].size;
      if (!pickup.taken && overlaps(box, { x: pickup.x, y: pickup.y, w: size, h: size })) {
        pickup.taken = true;
        state.bonus += PICKUP[pickup.kind].points;
        events |= EVENT_PICKUP;
      }
    }

    // --- hiding in a bush ---
    if (player.ducking && state.farmer.mode === 'chase' && state.farmer.gap < 260) {
      for (const bush of state.bushes) {
        if (!bush.used && PLAYER.x + PLAYER.width > bush.x + 10 && PLAYER.x < bush.x + bush.w - 10) {
          bush.used = true;
          state.farmer.mode = 'search';
          state.farmer.search = FARMER.searchSeconds;
          events |= EVENT_HIDDEN;
          break;
        }
      }
    }

    // --- the farmer ---
    const farmer = state.farmer;
    farmer.bob += dt * (state.speed / 30);
    if (farmer.mode === 'search') {
      farmer.search -= dt;
      if (farmer.search <= 0) {
        farmer.mode = 'chase';
        farmer.gap = Math.min(FARMER.maxGap, farmer.gap + FARMER.searchGiveUp);
      }
    } else {
      farmer.gap = Math.min(FARMER.maxGap, farmer.gap + FARMER.cleanDrift * dt);
      if (player.slow > 0) farmer.gap -= 34 * dt;
    }
    if (farmer.gap <= FARMER.catchGap) {
      state.over = true;
      state.overReason = 'caught';
      return events | EVENT_OVER;
    }

    // --- obstacle collisions ---
    if (player.invulnerable <= 0) {
      for (const obstacle of state.obstacles) {
        let hitBox = { x: obstacle.x, y: obstacle.y, w: obstacle.w, h: obstacle.h };
        if (obstacle.kind === KIND_KNIFE) {
          // The blade swings: its danger zone follows the swing.
          const swingX = Math.sin(obstacle.swing) * 26;
          hitBox = { x: obstacle.x + swingX - 8, y: obstacle.y, w: obstacle.w + 16, h: obstacle.h };
        }
        if (overlaps(box, hitBox)) {
          if (obstacle.kind === KIND_PUDDLE) {
            player.slow = Math.max(player.slow, 0.5);
            obstacle.x = -1000; // a puddle splashes once, then it is behind
            burst(box.x + box.w / 2, FIELD.groundY - 6, 'splash', 8);
            events |= EVENT_SPLASH;
          } else {
            events = stumble(events);
            obstacle.x = -1000; // a hit obstacle is spent
            if (state.over) return events;
          }
          break;
        }
      }
    }

    // --- escape ---
    if (state.distance >= ESCAPE_DISTANCE) {
      state.over = true;
      state.overReason = 'escaped';
      return events | EVENT_OVER | EVENT_ESCAPED;
    }
    return events;
  }

  return { state, step, reset, playerBox, stageKinds };
}
