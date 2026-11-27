// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title,
// play, paused and game over.
//
// ?seed=N fixes the escape's pattern. ?shot=start|play|kitchen|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.

import { BEST_KEY, FARMER, STEP } from './tuning.js';
import { createWorld, EVENT_ESCAPED, EVENT_HIDDEN, EVENT_HIT, EVENT_LAND, EVENT_OVER, EVENT_PICKUP, EVENT_SPLASH } from './world.js';
import { createAudio } from './audio.js';
import {
  ACTION_CONFIRM,
  ACTION_DUCK,
  ACTION_JUMP,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './hud.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();
let best = readBest();
let muted = false;
let alarmIn = 0;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { muted: false, warning: false, now: 1.5 });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, () => audio.unlock());
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();
  let now = 0;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Playing. ${world.state.lives} lives. Run 1000 metres to escape.`);
    audio.gobble();
  }

  function endGame() {
    screen = SCREEN_OVER;
    const escaped = world.state.overReason === 'escaped';
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (escaped) audio.fanfare();
    else audio.caught();
    announce(
      escaped
        ? `Escaped! Score ${world.state.score}. Best ${best}.`
        : `Caught. Score ${world.state.score}. Best ${best}.`,
    );
  }

  /** Play the sounds for one step's events. */
  function soundFor(events) {
    if (events & EVENT_HIT) audio.stumble();
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_HIDDEN) audio.hide();
    if (events & EVENT_SPLASH) audio.land();
    if (events & EVENT_LAND) audio.land();
    if (events & EVENT_ESCAPED) audio.fanfare();
  }

  function frame(time) {
    const elapsed = Math.min(MAX_FRAME, (time - last) / 1000);
    last = time;
    now += elapsed;
    const pressed = input.drainPressed();
    const click = input.takeClick();

    if (pressed.includes(ACTION_MUTE)) {
      muted = audio.toggleMute();
    }

    if (screen === SCREEN_TITLE) {
      if (pressed.includes(ACTION_CONFIRM) || pressed.includes(ACTION_JUMP) || click !== null) {
        startGame();
      }
    } else if (screen === SCREEN_PLAY) {
      if (pressed.includes(ACTION_PAUSE)) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else {
        accumulator += elapsed;
        let guard = 0;
        // A jump is queued once per frame, from a key or a click, and spent on the first step.
        let jumpQueued = pressed.includes(ACTION_JUMP) || click !== null;
        while (accumulator >= STEP && guard < 8) {
          accumulator -= STEP;
          guard += 1;
          const events = world.step(STEP, { jump: jumpQueued, duck: input.isHeld(ACTION_DUCK) });
          jumpQueued = false;
          soundFor(events);
          if (events & EVENT_OVER) {
            endGame();
            break;
          }
        }
        // The farmer's alarm: at most once every two seconds, while he is close.
        alarmIn -= elapsed;
        if (world.state.farmer.gap < FARMER.warningGap && alarmIn <= 0) {
          alarmIn = 2;
          audio.alarm();
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (pressed.includes(ACTION_PAUSE) || pressed.includes(ACTION_CONFIRM) || click !== null) {
        screen = SCREEN_PLAY;
        last = performance.now();
        announce('Playing.');
      }
    } else if (screen === SCREEN_OVER) {
      if (pressed.includes(ACTION_RESTART) || pressed.includes(ACTION_CONFIRM) || click !== null) {
        startGame();
      }
    }

    renderer.draw(world.state, screen, best, {
      muted,
      warning: screen === SCREEN_PLAY && world.state.farmer.gap < FARMER.warningGap,
      now,
    });
    requestAnimationFrame(frame);
  }

  announce('Turkey Run. Press Space or click to run.');
  requestAnimationFrame(frame);
}

if (shot !== null) runShot(shot);
else runGame();
