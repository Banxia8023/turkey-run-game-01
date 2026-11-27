// Keyboard, mouse and touch input, read as actions: jump, duck, confirm,
// pause and mute. The game polls `held` every step and drains one-shot
// `pressed` actions, so a tap is never lost between frames.

export const ACTION_JUMP = 'jump';
export const ACTION_DUCK = 'duck';
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_RESTART = 'restart';

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
const CONFIRM_KEYS = new Set(['Enter', 'Space']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const RESTART_KEYS = new Set(['KeyR']);

/**
 * Attach listeners to `element` (the canvas) and the window, and return the
 * input state. `onFirstGesture` runs once, on the first key or pointer press,
 * so the game can unlock sound and wake from the title screen.
 */
export function createInput(element, onFirstGesture) {
  const held = new Set();
  const pressed = [];
  let gestured = false;

  function firstGesture() {
    if (gestured) return;
    gestured = true;
    if (typeof onFirstGesture === 'function') onFirstGesture();
  }

  function keyToAction(code) {
    if (JUMP_KEYS.has(code)) return ACTION_JUMP;
    if (DUCK_KEYS.has(code)) return ACTION_DUCK;
    if (CONFIRM_KEYS.has(code)) return ACTION_CONFIRM;
    if (PAUSE_KEYS.has(code)) return ACTION_PAUSE;
    if (RESTART_KEYS.has(code)) return ACTION_RESTART;
    if (code === 'KeyM') return ACTION_MUTE;
    return null;
  }

  window.addEventListener('keydown', (event) => {
    const action = keyToAction(event.code);
    if (action === null) return;
    if (action === ACTION_JUMP || action === ACTION_DUCK) event.preventDefault();
    firstGesture();
    if (!event.repeat) {
      held.add(action);
      pressed.push(action);
    }
  });
  window.addEventListener('keyup', (event) => {
    const action = keyToAction(event.code);
    if (action !== null) held.delete(action);
  });
  window.addEventListener('blur', () => held.clear());

  // A click or tap is a jump while running, and a confirm on the menus; the
  // main loop decides which, by the screen it is on. The click position is
  // kept so the menus can offer real buttons.
  let lastClick = null;
  element.addEventListener('pointerdown', (event) => {
    firstGesture();
    const rect = element.getBoundingClientRect();
    lastClick = {
      x: (event.clientX - rect.left) * (element.width / rect.width),
      y: (event.clientY - rect.top) * (element.height / rect.height),
    };
    pressed.push(ACTION_CONFIRM);
    held.add(ACTION_JUMP);
  });
  window.addEventListener('pointerup', () => held.delete(ACTION_JUMP));

  return {
    /** Is this action held down right now (duck, for example). */
    isHeld(action) {
      return held.has(action);
    },
    /** Drain the actions pressed since the last call, oldest first. */
    drainPressed() {
      const actions = pressed.splice(0, pressed.length);
      return actions;
    },
    /** The last pointer position in canvas pixels, or null. */
    takeClick() {
      const click = lastClick;
      lastClick = null;
      return click;
    },
  };
}
