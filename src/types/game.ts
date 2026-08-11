export type EnemyType = "chaser" | "ranged" | "dasher";
export type PowerUpType = "shield" | "speed" | "fireRate";
export type GameEndReason = "completed" | "lives_exhausted";

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

export interface WavePerformance {
  readonly waveNumber: number;
  readonly durationMs: number;
  readonly killsByType: Record<EnemyType, number>;
  readonly livesLost: number;
  readonly shieldHitsAbsorbed: number;
  readonly enemiesRemaining: number;
  readonly shotsFired: number;
  readonly shotsHit: number;
}