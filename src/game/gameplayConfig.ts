import type { ArenaBounds, EnemyType } from "../types/game";

export const CANVAS = {
  width: 960,
  height: 540,
};

export const HUD_BAND_HEIGHT = 48;

export const ARENA: ArenaBounds = {
  x: 12,
  y: HUD_BAND_HEIGHT,
  width: CANVAS.width - 24,
  height: CANVAS.height - HUD_BAND_HEIGHT - 12,
};

export const PLAYER_CONFIG = {
  size: 26,
  turretLength: 22,
  turretThickness: 5,
  speed: 260,
  startingLives: 5,
  respawnInvincibilityMs: 1500,
  respawnFlashIntervalMs: 100,
  respawnPushbackRadius: 240,
};

export const WEAPON_CONFIG = {
  fireIntervalMs: 160,
  projectileSpeed: 620,
  projectileRadius: 4,
  projectileLifetimeMs: 2000,
  muzzleOffset: 20,
  maxActiveProjectiles: 64,
  minFireRateMultiplier: 1,
  maxFireRateMultiplier: 2.5,
};

export const ENEMY_WEAPON_CONFIG = {
  attackIntervalMs: 1600,
  projectileSpeed: 260,
  projectileRadius: 5,
  projectileLifetimeMs: 4000,
  muzzleOffset: 16,
  maxActiveProjectiles: 48,
  maxFiringRange: 420,
};

export const CHASER_CONFIG = {
  radius: 10,
  maxHealth: 2,
  baseSpeed: 70,
  accelerationPerSecond: 14,
  maxSpeed: 220,
};

export const RANGED_CONFIG = {
  radius: 11,
  maxHealth: 1,
  preferredDistance: 260,
  distanceTolerance: 40,
  approachSpeed: 90,
  retreatSpeed: 110,
  evasionRadius: 70,
  evasionSpeed: 150,
  evasionLookaheadMs: 500,
  maxApproachSpeed: 150,
  maxRetreatSpeed: 180,
};

export const DASHER_CONFIG = {
  collisionRadius: 9,
  maxHealth: 3,
  lockDurationMs: 600,
  dashSpeed: 420,
  overshootDistance: 90,
  pauseDurationMs: 700,
    hullOutline: [
    { x: 20, y: 0 },
    { x: 0, y: 12 },
    { x: -14, y: 0 },
    { x: 0, y: -12 },
  ],
  noseMarker: [
    { x: 20, y: 0 },
    { x: 4, y: 5 },
    { x: 4, y: -5 },
  ],
  hullLineWidth: 2,
  hullFillAlpha: 0.18,
  maxDashSpeed: 620,
};

export const SPAWN_CONFIG = {
  initialIntervalMs: 2000,
  // DDA actuator
  minIntervalMs: 450,
  maxIntervalMs: 3500,
  maxActiveEnemies: 50,
  spawnInset: 28,
  minDistanceFromPlayer: 180,
  maxPlacementAttempts: 8,
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
  radius: 10,
  lifetimeMs: 10000,
  warningMs: 3000,
  flashIntervalMs: 150,
  maxActive: 12,
  speedDurationMs: 8000,
  fireRateDurationMs: 8000,
  speedMultiplier: 1.45,
  fireRateMultiplier: 1.8,
};

export const KILL_POINTS: Record<EnemyType, number> = {
  chaser: 100,
  ranged: 150,
  dasher: 200,
};

export const WAVE_SURVIVAL_BONUS = 2500;

export const PALETTE = {
  arenaFloor: 0x0e1526,
  arenaBorder: 0x263653,
  player: 0x62e6c8,
  playerOutline: 0xffffff,
  turret: 0xf4f7ff,
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
};

export const DEPTH = {
  arena: 0,
  turret: 4,
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
