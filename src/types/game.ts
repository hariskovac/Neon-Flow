import type { ParameterChange } from "../dda/ParameterChanges";

export type EnemyType = "chaser" | "dodger" | "dasher" | "splitter" | "shard";
export type PowerUpType = "shield" | "speed" | "fireRate";
export type GameEndReason = "completed" | "lives_exhausted";
export type Condition = "hidden" | "transparent";

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
    dodger: 0,
    dasher: 0,
    splitter: 0,
    shard: 0,
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
  readonly enemiesSpawned: number;
  readonly powerUpsSpawned: number;
  readonly powerUpsCollected: number;
}

export interface DDAEvent {
  readonly waveNumber: number;
  readonly elapsedTimeMs: number;
  readonly previousLevel: number;
  readonly nextLevel: number;
  readonly direction: "increase" | "decrease" | "unchanged";
  readonly metricSnapshot: WavePerformance;
  readonly parameterChanges: ParameterChange[];
  readonly explanation: string;
  readonly displayed: boolean;
  readonly suppressedByHysteresis: boolean;
}
