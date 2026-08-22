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
  color: 0x16304d,
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
  shieldRadius: 26,
  shieldLineWidth: 2,
  shieldPulseMs: 700,
  shieldMinAlpha: 0.45,
};

export const WEAPON_CONFIG = {
  fireIntervalMs: 140,
  projectileSpeed: 760,
  projectileRadius: 4,
  projectileLifetimeMs: 2600,
  muzzleOffset: 20,
  maxActiveProjectiles: 96,
  minFireRateMultiplier: 1,
  maxFireRateMultiplier: 2.5,
  projectileLineWidth: 2,
  barrelSeparation: 7,
  barrelSplayDegrees: 1,
};

export const CHASER_CONFIG = {
  radius: 15,
  maxHealth: 1,
  baseSpeed: 140,
  accelerationPerSecond: 14,
  maxSpeed: 300,
  hullOutline: [
    { x: 0, y: -16 },
    { x: 15, y: 0 },
    { x: 0, y: 16 },
    { x: -15, y: 0 },
  ],
  hullLineWidth: 2,
  spinRate: 0.6,
};

export const DODGER_CONFIG = {
  radius: 15,
  maxHealth: 1,
  evasionRadius: 70,
  evasionSpeed: 150,
  evasionLookaheadMs: 350,
  hullOutline: buildRegularPolygon(5, 17),
  hullLineWidth: 2,
  spinRate: 0.6,
  pursuitSpeed: 160,
  maxPursuitSpeed: 290,
};

export const DASHER_CONFIG = {
  collisionRadius: 14,
  maxHealth: 2,
  lockDurationMs: 600,
  dashSpeed: 560,
  overshootDistance: 130,
  pauseDurationMs: 700,
  hullOutline: [
    { x: 30, y: 0 },
    { x: -13, y: 18 },
    { x: -5, y: 0 },
    { x: -13, y: -18 },
  ],
  hullLineWidth: 2,
  lockPulseMinAlpha: 0.45,
  lockPulseMs: 140,
  maxDashSpeed: 660,
};

export const SPLITTER_CONFIG = {
  radius: 16,
  maxHealth: 1,
  speed: 160,
  maxSpeed: 280,
  shardCount: 2,
  shardSeparation: 68,
  hullOutline: [
    { x: 0, y: -21 },
    { x: 18, y: 12 },
    { x: -18, y: 12 },
  ],
  hullLineWidth: 2,
  spinRate: 0.5,
};

export const SHARD_CONFIG = {
  radius: 13,
  maxHealth: 1,
  pursuitSpeed: 170,
  maxPursuitSpeed: 250,
  orbitRadius: 64,
  orbitSpeed: 155,
  orbitTightness: 2.6,
  hullOutline: [
    { x: 0, y: -16 },
    { x: 13, y: 8 },
    { x: -13, y: 8 },
  ],
  hullLineWidth: 2,
  spinRate: 2.2,
};

export const WINDER_CONFIG = {
  headRadius: 21,
  segmentRadius: 11,
  segmentCount: 11,
  maxHealth: 3,
  speed: 200,
  maxSpeed: 400,
  weaveAmplitude: 2,
  weavePeriodMs: 2000,
  weavePeriodVariance: 0.25,
  turnRateRadians: 3.8,
  segmentSpacing: 22,
  headOutline: [
    { x: 21, y: 0 },
    { x: -12, y: 13 },
    { x: -12, y: -13 },
  ],
  segmentOutline: [
    { x: 12, y: 0 },
    { x: 0, y: 10 },
    { x: -12, y: 0 },
    { x: 0, y: -10 },
  ],
  lineWidth: 2,
  segmentAlpha: 0.55,
};

export const SPAWN_CONFIG = {
  maxActiveEnemies: 100,
  spawnInset: 40,
  minDistanceFromPlayer: 260,
  maxPlacementAttempts: 20,
  groupCooldownMs: { low: 12000, high: 7000 },
  // spawn weights
  weights: {
    chaser: 35,
    dodger: 20,
    dasher: 10,
    splitter: 30,
    winder: 15,
  },
  intensity: {
    // chance a spawn is a swarm instead of a single enemy
    swarmChance: { low: 0, high: 0.35 },
    // enemies in one swarm
    swarmSize: { low: 5, high: 10 },
    // count of possible simultaneous swarms
    swarmCount: { low: 1, high: 4 },
    // chance a spawn event surrounds the player
    surroundChance: { low: 0.1, high: 0.5 },
    surroundSize: { low: 5, high: 10 },
  },
  // delay between each enemy spawn in a swarm
  swarmStaggerMs: 280,
  // delay between spawning of multiple swarms
  swarmGroupDelayMs: 600,
  swarmScatter: 15,
  surroundRadius: 500,
  surroundMinEdgeDistance: 160,
  sameTypeChance: 0.75,
  cornerInset: 120,
  cornerChance: 1,
};

// export const CHASER_CONFIG = {
//   radius: 11,
//   maxHealth: 1,
//   baseSpeed: 140,
//   accelerationPerSecond: 14,
//   maxSpeed: 300,
//   hullOutline: [
//     { x: 0, y: -12 },
//     { x: 11, y: 0 },
//     { x: 0, y: 12 },
//     { x: -11, y: 0 },
//   ],
//   hullLineWidth: 2,
//   spinRate: 0.6,
// };

// export const DODGER_CONFIG = {
//   radius: 11,
//   maxHealth: 1,
//   evasionRadius: 70,
//   evasionSpeed: 150,
//   evasionLookaheadMs: 350,
//   hullOutline: buildRegularPolygon(5, 13),
//   hullLineWidth: 2,
//   spinRate: 0.6,
//   pursuitSpeed: 160,
//   maxPursuitSpeed: 290,
// };

// export const DASHER_CONFIG = {
//   collisionRadius: 9,
//   maxHealth: 2,
//   lockDurationMs: 600,
//   dashSpeed: 560,
//   overshootDistance: 130,
//   pauseDurationMs: 700,
//   hullOutline: [
//     { x: 24, y: 0 },
//     { x: -10, y: 14 },
//     { x: -4, y: 0 },
//     { x: -10, y: -14 },
//   ],
//   hullLineWidth: 2,
//   lockPulseMinAlpha: 0.45,
//   lockPulseMs: 140,
//   maxDashSpeed: 660,
// };

// export const SPLITTER_CONFIG = {
//   radius: 14,
//   maxHealth: 1,
//   speed: 160,
//   maxSpeed: 280,
//   shardCount: 2,
//   shardSeparation: 68,
//   hullOutline: [
//     { x: 0, y: -16 },
//     { x: 14, y: 8 },
//     { x: -14, y: 8 },
//   ],
//   hullLineWidth: 2,
//   spinRate: 0.5,
// };

// export const SHARD_CONFIG = {
//   radius: 12,
//   maxHealth: 1,
//   pursuitSpeed: 170,
//   maxPursuitSpeed: 250,
//   orbitRadius: 64,
//   orbitSpeed: 155,
//   orbitTightness: 2.6,
//   hullOutline: [
//     { x: 0, y: -12 },
//     { x: 10, y: 6 },
//     { x: -10, y: 6 },
//   ],
//   hullLineWidth: 2,
//   spinRate: 2.2,
// };

// export const WINDER_CONFIG = {
//   headRadius: 21,
//   segmentRadius: 15,
//   segmentCount: 11,
//   maxHealth: 3,
//   speed: 200,
//   maxSpeed: 400,
//   weaveAmplitude: 2,
//   weavePeriodMs: 2000,
//   weavePeriodVariance: 0.25,
//   turnRateRadians: 3.8,
//   segmentSpacing: 22,
//   headOutline: [
//     { x: 21, y: 0 },
//     { x: -12, y: 13 },
//     { x: -12, y: -13 },
//   ],
//   segmentOutline: [
//     { x: 12, y: 0 },
//     { x: 0, y: 10 },
//     { x: -12, y: 0 },
//     { x: 0, y: -10 },
//   ],
//   lineWidth: 2,
//   segmentAlpha: 0.55,
// };

// export const SPAWN_CONFIG = {
//   maxActiveEnemies: 100,
//   spawnInset: 40,
//   minDistanceFromPlayer: 260,
//   maxPlacementAttempts: 20,
//   groupCooldownMs: { low: 12000, high: 7000 },
//   // spawn weights
//   weights: {
//     chaser: 35,
//     dodger: 20,
//     dasher: 10,
//     splitter: 30,
//     winder: 15,
//   },
//   intensity: {
//     // chance a spawn is a swarm instead of a single enemy
//     swarmChance: { low: 0, high: 0.35 },
//     // enemies in one swarm
//     swarmSize: { low: 5, high: 10 },
//     // count of possible simultaneous swarms
//     swarmCount: { low: 1, high: 4 },
//     // chance a spawn event surrounds the player
//     surroundChance: { low: 0.1, high: 0.5 },
//     surroundSize: { low: 5, high: 10 },
//   },
//   // delay between each enemy spawn in a swarm
//   swarmStaggerMs: 280,
//   // delay between spawning of multiple swarms
//   swarmGroupDelayMs: 600,
//   swarmScatter: 15,
//   surroundRadius: 500,
//   surroundMinEdgeDistance: 160,
//   sameTypeChance: 0.75,
//   cornerInset: 120,
//   cornerChance: 1,
// };

export const PLAYER_SPAWN_CONFIG = {
  durationMs: 320,
  echoCount: 4,
  echoStartScale: 3.2,
  echoSpacing: 0.7,
  lineWidth: 3,
  minAlpha: 0.2,
};

export const SPAWN_EFFECT_CONFIG = {
  durationMs: 220,
  echoCount: 3,
  echoStartScale: 2.6,
  echoSpacing: 0.45,
  lineWidth: 2,
  minAlpha: 0.25,
};

export const BURST_CONFIG = {
  particleCount: 8,
  travel: 46,
  segmentLength: 14,
  lineWidth: 2,
  durationMs: 320,
  poolSize: 100,
};

export const PLAYER_BURST_CONFIG = {
  particleCount: 14,
  travel: 130,
  segmentLength: 26,
  lineWidth: 3,
  durationMs: 620,
  innerParticleCount: 8,
  innerTravel: 58,
  innerDurationMs: 340,
  ringMaxRadius: 150,
  ringDurationMs: 480,
  ringLineWidth: 3,
};

export const WAVE_CONFIG = {
  // wave duration
  durationMs: 40000,
  // when enemies stop spawning
  spawnStopMs: 37000,
  // gap between waves
  intermissionMs: 8000,
  totalWaves: 6,
  countdownSeconds: 3,
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
  keyCapFontSize: "24px",
  enemyLevel: 1,
  dodgerSpawnDistance: 340,
  dodgerMinimumMs: 6000,
  hitFlashMs: 1600,
};

export const KILL_POINTS: Record<EnemyType, number> = {
  chaser: 100,
  dodger: 150,
  dasher: 200,
  splitter: 150,
  shard: 50,
  winder: 300,
};

export const WAVE_SURVIVAL_BONUS = 2500;

export const PALETTE = {
  arenaFloor: 0x000000,
  panelText: "#0e1526",
  arenaBorder: 0x263653,
  player: 0x62e6c8,
  playerFlame: 0x5ce1ff,
  playerShield: 0x6bc5ff,
  projectile: 0xffe066,
  enemyProjectile: 0xff6b6b,
  pipFilled: 0x62e6c8,
  pipEmpty: 0x2a3550,
  hudPrimary: "#f4f7ff",
  hudMuted: "#aebbd4",
  chaser: 0x1500ff,
  dodger: 0x2ff204,
  splitter: 0xff46a2,
  shard: 0xff46a2,
  dasher: 0xd50834,
  dasherNose: 0xf4f7ff,
  winder: 0xff7424,
  winderHead: 0x43a8fa,
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
  fontSize: "24px",
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

export const AUDIO_CONFIG = {
  keys: {
    music: "music",
    playerFire: "sfx-player-fire",
    playerSpawn: "sfx-enemy-spawn",
    enemyFire: "sfx-enemy-fire",
    enemySpawn: "sfx-enemy-spawn",
    enemyHit: "sfx-enemy-hit",
    enemyDeath: "sfx-enemy-death",
    swarmSpawn: "sfx-swarm-spawn",
    // playerHit: "sfx-player-hit",
    playerDeath: "sfx-player-death",
    powerUp: "sfx-power-up",
    shieldAbsorb: "sfx-shield-absorb",
    beep: "sfx-beep",
    waveEnd: "sfx-wave-end",
  },
  musicVolume: 0.35,
  sfxVolume: 0.6,
  levels: {
    playerFire: 0.35,
    playerSpawn: 0.7,
    enemyFire: 0.5,
    enemySpawn: 0.35,
    enemyHit: 0.15,
    enemyDeath: 0.7,
    swarmSpawn: 1,
    // playerHit: 0.8,
    playerDeath: 1,
    powerUp: 0.85,
    shieldAbsorb: 0.9,
    beep: 0.35,
    waveEnd: 1,
  },
  minRepeatMs: {
    playerFire: 45,
    playerSpawn: 200,
    enemyFire: 60,
    enemySpawn: 120,
    enemyHit: 60,
    enemyDeath: 45,
    swarmSpawn: 80,
    // playerHit: 200,
    playerDeath: 200,
    powerUp: 100,
    shieldAbsorb: 70,
    beep: 400,
    waveEnd: 500,
  },
};