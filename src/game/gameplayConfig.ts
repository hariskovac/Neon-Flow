import type { ArenaBounds, EnemyType, Vector2 } from "../types/game";

export const CANVAS = {
  width: 1600,
  height: 900,
};

export const HUD_BAND_HEIGHT = 64;

export const ARENA: ArenaBounds = {
  x: 12,
  y: HUD_BAND_HEIGHT,
  width: CANVAS.width - 24,
  height: CANVAS.height - HUD_BAND_HEIGHT - 12,
};

export const GRID_CONFIG = {
  cellSize: 48,
  colour: 0x16304d,
  lineWidth: 1,
  alpha: 0.25,
};

export const PLAYER_CONFIG = {
  collisionRadius: 9,
  hullOutline: [
    { x: 20, y: 0 },
    { x: -12, y: 13 },
    { x: -6, y: 0 },
    { x: -12, y: -13 },
  ],
  hullLineWidth: 2,
  flameOutline: [
    { x: -7, y: 6 },
    { x: -26, y: 0 },
    { x: -7, y: -6 },
  ],
  flameMinScale: 0.65,
  flameMaxScale: 1.15,
  flamePulseMs: 15,
  speed: 340,
  startingLives: 5,
  respawnInvincibilityMs: 1500,
  respawnFlashIntervalMs: 100,
  respawnPushbackRadius: 320,
};

export const WEAPON_CONFIG = {
  fireIntervalMs: 160,
  projectileSpeed: 760,
  projectileRadius: 4,
  projectileLifetimeMs: 2600,
  muzzleOffset: 20,
  maxActiveProjectiles: 64,
  minFireRateMultiplier: 1,
  maxFireRateMultiplier: 2.5,
  projectileLineWidth: 2,
  barrelSeparation: 7,
  barrelSplayDegrees: 1,
};

export const ENEMY_WEAPON_CONFIG = {
  attackIntervalMs: 1600,
  projectileSpeed: 320,
  projectileRadius: 5,
  projectileLifetimeMs: 4000,
  muzzleOffset: 16,
  maxActiveProjectiles: 48,
  maxFiringRange: 560,
  projectileLineWidth: 2,
};

export const CHASER_CONFIG = {
  radius: 11,
  maxHealth: 2,
  baseSpeed: 70,
  accelerationPerSecond: 14,
  maxSpeed: 220,
  hullOutline: [
    { x: 0, y: -12 },
    { x: 11, y: 0 },
    { x: 0, y: 12 },
    { x: -11, y: 0 },
  ],
  hullLineWidth: 2,
  spinRate: 0.6,
};

export const RANGED_CONFIG = {
  radius: 11,
  maxHealth: 1,
  preferredDistance: 360,
  distanceTolerance: 40,
  approachSpeed: 90,
  retreatSpeed: 110,
  evasionRadius: 70,
  evasionSpeed: 150,
  evasionLookaheadMs: 420,
  maxApproachSpeed: 150,
  maxRetreatSpeed: 180,
  hullOutline: buildRegularPolygon(5, 13),
  hullLineWidth: 2,
  spinRate: 0.6,
};

export const DASHER_CONFIG = {
  collisionRadius: 9,
  maxHealth: 3,
  lockDurationMs: 600,
  dashSpeed: 520,
  overshootDistance: 130,
  pauseDurationMs: 700,
  hullOutline: [
    { x: 24, y: 0 },
    { x: -10, y: 14 },
    { x: -4, y: 0 },
    { x: -10, y: -14 },
  ],
  hullLineWidth: 2,
  lockPulseMinAlpha: 0.45,
  lockPulseMs: 140,
  maxDashSpeed: 620,
};

export const SPAWN_CONFIG = {
  initialIntervalMs: 2000,
  // DDA actuator
  minIntervalMs: 450,
  maxIntervalMs: 3500,
  maxActiveEnemies: 50,
  spawnInset: 40,
  minDistanceFromPlayer: 260,
  maxPlacementAttempts: 20,
  // spawn weights
  weights: {
    chaser: 55,
    ranged: 30,
    dasher: 15,
  },
};

export const WAVE_CONFIG = {
  // wave duration
  durationMs: 40000,
  // when enemies stop spawning
  spawnStopMs: 35000,
  // gap between waves
  intermissionMs: 8000,
  totalWaves: 7,
};

export const CALIBRATION_CONFIG = {
  durationMs: 45000,
  fixedLevel: 3,
};

export const POWERUP_CONFIG = {
  radius: 14,
  lifetimeMs: 10000,
  warningMs: 3000,
  flashIntervalMs: 150,
  maxActive: 12,
  speedDurationMs: 8000,
  fireRateDurationMs: 8000,
  speedMultiplier: 1.45,
  fireRateMultiplier: 1.8,
  glyphLineWidth: 2,
  bobAmplitude: 4,
  bobPeriodMs: 1400,
};

export const TUTORIAL_CONFIG = {
  dummyHealth: 10,
  keyCapSize: 40,
  keyCapGap: 6,
  keyCapFontSize: "18px",
  enemyLevel: 1,
  rangedSpawnDistance: 340,
  rangedMinimumMs: 6000,
  hitFlashMs: 1600,
};

export const KILL_POINTS: Record<EnemyType, number> = {
  chaser: 100,
  ranged: 150,
  dasher: 200,
};

export const WAVE_SURVIVAL_BONUS = 2500;

export const PALETTE = {
  arenaFloor: 0x000000,
  panelText: "#0e1526",
  arenaBorder: 0x263653,
  player: 0x62e6c8,
  playerFlame: 0x5ce1ff,
  projectile: 0xffe066,
  enemyProjectile: 0xff6b6b,
  pipFilled: 0x62e6c8,
  pipEmpty: 0x2a3550,
  hudPrimary: "#f4f7ff",
  hudMuted: "#aebbd4",
  chaser: 0xff5f9e,
  ranged: 0xffa94d,
  dasher: 0xb28dff,
  dasherNose: 0xf4f7ff,
  powerUpShield: 0x6bc5ff,
  powerUpSpeed: 0x7ef7a8,
  powerUpFireRate: 0xffc857,
  textPrimary: "#f4f7ff",
  textMuted: "#8fa3c4",
  textAccent: "#3ddbff",
  textAccentValue: 0x3ddbff,
  targetDummy: 0x8fa3c4,
  fillAlpha: 0.5,
};

export const NEON_CONFIG = {
  passes: [
    { widthScale: 3, alpha: 0.08 },
    { widthScale: 1.8, alpha: 0.18 },
    { widthScale: 1, alpha: 1 },
  ],
  fillAlpha: 0.06,
  coreLightness: 0.75,
};

export const DEPTH = {
  arena: 0,
  player: 5,
  projectile: 6,
  powerUp: 6,
  enemy: 7,
  hud: 20,
  overlay: 30,
};

export const HUD_TEXT_STYLE = {
  fontFamily: "Arial, sans-serif",
  fontSize: "18px",
  color: PALETTE.hudPrimary,
  resolution: 2,
};

function buildRegularPolygon(sides: number, radius: number): Vector2[] {
  const points: Vector2[] = [];

  for (let index = 0; index < sides; index += 1) {
    const angle = (index / sides) * Math.PI * 2;

    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  return points;
}