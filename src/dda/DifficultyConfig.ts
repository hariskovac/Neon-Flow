import type { ActuatorKey } from "./ParameterChanges";

export const MIN_DIFFICULTY_LEVEL = 1;
export const MAX_DIFFICULTY_LEVEL = 10;

export interface ActuatorValues {
  // ms between spawns
  readonly spawnIntervalMs: number;
  // scales enemy movement speed
  readonly enemySpeedMultiplier: number;
  // how aggressively enemies are summoned
  readonly spawnIntensity: number;
  // power-up drop chance, 0.0 to 1.0
  readonly powerUpDropChance: number;
}

const DIFFICULTY_TABLE: ActuatorValues[] = [
  { spawnIntervalMs: 3000, enemySpeedMultiplier: 0.90, spawnIntensity: 0.05, powerUpDropChance: 0.45 },
  { spawnIntervalMs: 2600, enemySpeedMultiplier: 0.90, spawnIntensity: 0.15, powerUpDropChance: 0.40 },
  { spawnIntervalMs: 2200, enemySpeedMultiplier: 1.00, spawnIntensity: 0.25, powerUpDropChance: 0.40 },
  { spawnIntervalMs: 1900, enemySpeedMultiplier: 1.10, spawnIntensity: 0.25, powerUpDropChance: 0.33 },
  { spawnIntervalMs: 1600, enemySpeedMultiplier: 1.10, spawnIntensity: 0.42, powerUpDropChance: 0.27 },
  { spawnIntervalMs: 1300, enemySpeedMultiplier: 1.21, spawnIntensity: 0.55, powerUpDropChance: 0.27 },
  { spawnIntervalMs: 1050, enemySpeedMultiplier: 1.30, spawnIntensity: 0.55, powerUpDropChance: 0.21 },
  { spawnIntervalMs: 850, enemySpeedMultiplier: 1.30, spawnIntensity: 0.78, powerUpDropChance: 0.16 },
  { spawnIntervalMs: 735, enemySpeedMultiplier: 1.40, spawnIntensity: 0.88, powerUpDropChance: 0.16 },
  { spawnIntervalMs: 600, enemySpeedMultiplier: 1.50, spawnIntensity: 1.0, powerUpDropChance: 0.10 },
];

// actuator boundaries
export const ACTUATOR_BOUNDS = {
  spawnIntervalMs: { min: 450, max: 3500 },
  enemySpeedMultiplier: { min: 0.75, max: 1.55 },
  spawnIntensity: { min: 0, max: 1 },
  powerUpDropChance: { min: 0.08, max: 0.50 },
};

export const ACTUATOR_RANGES: Record < ActuatorKey, { min: number; max: number } > = (() => {
  const keys: ActuatorKey[] = [
    "spawnIntervalMs",
    "enemySpeedMultiplier",
    "spawnIntensity",
    "powerUpDropChance",
  ];

  const ranges = {} as Record<ActuatorKey, { min: number; max: number }>;

  for (const key of keys) {
    const values = DIFFICULTY_TABLE.map((row) => row[key]);

    ranges[key] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  return ranges;
})();

export const STABILITY_CONFIG = {
  earlyCorrectionWaves: 2,
  acceleratedStep: 2,
  normalStep: 1,
  acceleratedIncreaseScore: 0.94,
  acceleratedDecreaseScore: 0.3,
  // suppresses downward hysteresis when lives are <= this value
  safetyLivesRemaining: 2,
};

export function resolveActuatorPressure(
  parameter: ActuatorKey,
  level: number,
): number {
  const range = ACTUATOR_RANGES[parameter];
  const span = range.max - range.min;

  if (span === 0) {
    return 0;
  }

  const value = resolveActuators(level)[parameter];
  const position = (value - range.min) / span;

  const risesWithDifficulty = parameter === "enemySpeedMultiplier" || parameter === "spawnIntensity";

  return risesWithDifficulty ? position : 1 - position;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampLevel(level: number): number {
  return clamp(
    Math.round(level),
    MIN_DIFFICULTY_LEVEL,
    MAX_DIFFICULTY_LEVEL,
  );
}

export function resolveActuators(level: number): ActuatorValues {
  const values = DIFFICULTY_TABLE[clampLevel(level) - 1];

  return {
    spawnIntervalMs: clamp(
      values.spawnIntervalMs,
      ACTUATOR_BOUNDS.spawnIntervalMs.min,
      ACTUATOR_BOUNDS.spawnIntervalMs.max,
    ),
    enemySpeedMultiplier: clamp(
      values.enemySpeedMultiplier,
      ACTUATOR_BOUNDS.enemySpeedMultiplier.min,
      ACTUATOR_BOUNDS.enemySpeedMultiplier.max,
    ),
    spawnIntensity: clamp(
      values.spawnIntensity,
      ACTUATOR_BOUNDS.spawnIntensity.min,
      ACTUATOR_BOUNDS.spawnIntensity.max,
    ),
    powerUpDropChance: clamp(
      values.powerUpDropChance,
      ACTUATOR_BOUNDS.powerUpDropChance.min,
      ACTUATOR_BOUNDS.powerUpDropChance.max,
    ),
  };
}