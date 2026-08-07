import type { ArenaBounds, EnemyType } from "../types/game";

export const CANVAS = {
  width: 960,
  height: 540,
} as const;

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
} as const;

export const WEAPON_CONFIG = {
  fireIntervalMs: 160,
  projectileSpeed: 620,
  projectileRadius: 4,
  projectileLifetimeMs: 2000,
  muzzleOffset: 20,
  maxActiveProjectiles: 64,
  minFireRateMultiplier: 1,
  maxFireRateMultiplier: 2.5,
} as const;

export const KILL_POINTS: Record<EnemyType, number> = {
  chaser: 100,
  ranged: 150,
  dasher: 200,
};

export const WAVE_SURVIVAL_BONUS = 250;

export const PALETTE = {
  arenaFloor: 0x0e1526,
  arenaBorder: 0x263653,
  player: 0x62e6c8,
  playerOutline: 0xffffff,
  turret: 0xf4f7ff,
  projectile: 0xffe066,
  lifePipFilled: 0x62e6c8,
  lifePipEmpty: 0x2a3550,
  hudPrimary: "#f4f7ff",
  hudMuted: "#aebbd4",
} as const;

export const DEPTH = {
  arena: 0,
  turret: 4,
  player: 5,
  projectile: 6,
  enemy: 7,
  hud: 20,
  overlay: 30,
} as const;

export const HUD_TEXT_STYLE = {
  fontFamily: "Inter, Arial, sans-serif",
  fontSize: "18px",
  color: PALETTE.hudPrimary,
} as const;
