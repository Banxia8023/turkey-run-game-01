// Every tuning number and colour in one place. The playfield is a fixed 1280x720
// logical area; the renderer scales it to the window, so no rule below depends
// on the screen size. The turkey runs from the farmyard, past the barn, into
// the kitchen, and escapes through the back gate at 1000 metres.

export const FIELD = { width: 1280, height: 720, groundY: 600 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** How many world pixels make one metre of the escape. */
export const PX_PER_METRE = 50;

/** Distance, in metres, of the back gate: reach it and the turkey escapes. */
export const ESCAPE_DISTANCE = 1000;

export const PLAYER = {
  /** Screen x of the turkey: it stays put while the world scrolls past. */
  x: 300,
  width: 62,
  height: 78,
  duckHeight: 46,
  jumpVelocity: -1250,
  gravity: 2600,
  /** Seconds of flashing safety after a stumble. */
  invulnerable: 1.6,
};

export const FARMER = {
  /** How far behind the turkey the farmer starts, in pixels. */
  startGap: 240,
  /** The farthest the turkey can pull ahead: he stays in frame, at the left edge. */
  maxGap: 260,
  /** The gap at which the farmer grabs the turkey: caught. */
  catchGap: 42,
  /** Ground the farmer gains when the turkey stumbles. */
  stumbleGain: 90,
  /** Ground the farmer loses while the turkey runs clean, per second. */
  cleanDrift: 40,
  /** Ground the farmer loses when a search comes up empty. */
  searchGiveUp: 190,
  /** Seconds the farmer stands and searches a bush the turkey hides in. */
  searchSeconds: 2.4,
  /** The gap under which the HUD warns that the farmer is close. */
  warningGap: 130,
};

export const LIVES = 3;

export const SPEED = {
  start: 380,
  /** Extra pixels per second for every metre already run. */
  perMetre: 0.34,
  max: 720,
};

export const SPAWN = {
  /** Seconds between one obstacle and the next: the gap in pixels grows
   * with speed, so the time to react stays fair however fast the run gets. */
  gapTimeMin: 1.15,
  gapTimeMax: 1.5,
  /** Extra pixels after a duck obstacle, for room to jump the next one. */
  duckBonus: 170,
  /** Rolling pumpkins gain this much extra speed toward the turkey. */
  pumpkinRoll: 70,
};

export const PICKUP = {
  corn: { points: 10, size: 22 },
  pie: { points: 25, size: 26 },
  feather: { points: 50, size: 26 },
};

export const STAGES = [
  {
    name: 'Farmyard',
    from: 0,
    skyTop: '#f7b733',
    skyBottom: '#fcdf9e',
    sun: '#fff3c4',
    far: '#c98a4b',
    near: '#a86a35',
    ground: '#8a5a2b',
    grass: '#7fae4e',
    accent: '#d2691e',
  },
  {
    name: 'Barn Lane',
    from: 300,
    skyTop: '#e8894a',
    skyBottom: '#f6c177',
    sun: '#ffe9b0',
    far: '#8a4f2e',
    near: '#6e3d24',
    ground: '#6b4423',
    grass: '#c98f3d',
    accent: '#b4552d',
  },
  {
    name: 'The Kitchen',
    from: 650,
    skyTop: '#7a3b2e',
    skyBottom: '#c96f3f',
    sun: '#ffd9a0',
    far: '#5d2a20',
    near: '#47201a',
    ground: '#4a2c1e',
    grass: '#a05a2c',
    accent: '#e5534b',
  },
];

/** Autumn palette for the turkey, the farmer and the interface. */
export const PALETTE = {
  turkeyBody: '#8a5230',
  turkeyWing: '#6e3d20',
  tail: ['#a0522d', '#d2691e', '#e8a33c', '#c94f32'],
  head: '#e8e2d5',
  beak: '#e8a33c',
  wattle: '#e5534b',
  leg: '#e8a33c',
  farmerShirt: '#4a7fb5',
  farmerOveralls: '#3b5a78',
  farmerSkin: '#e8b98a',
  farmerHat: '#6e4a26',
  farmerBeard: '#d8d2c4',
  knife: '#dfe4ea',
  knifeHandle: '#3a2a1a',
  oven: '#3a3f47',
  ovenFire: '#ff9a3c',
  hay: '#e8c25a',
  fence: '#7a5230',
  corn: '#f2c94c',
  pie: '#c96f3f',
  feather: '#ffd94d',
  panel: 'rgba(24, 16, 10, 0.72)',
  text: '#fff6e6',
  muted: '#e8c9a0',
  danger: '#ff5a4b',
  good: '#7ddb6a',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'turkey-run.best';
