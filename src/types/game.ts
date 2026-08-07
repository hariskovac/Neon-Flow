export type EnemyType = "chaser" | "ranged" | "dasher";

export type PowerUpType = "shield" | "speed" | "fireRate";

export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

export interface ArenaBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function createEmptyKillTally(): Record<EnemyType, number> {
  return {
    chaser: 0,
    ranged: 0,
    dasher: 0,
  };
}