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
  { spawnIntervalMs: 3000, enemySpeedMultiplier: 0.80, spawnIntensity: 0, powerUpDropChance: 0.45 },
  { spawnIntervalMs: 2600, enemySpeedMultiplier: 0.86, spawnIntensity: 0.08, powerUpDropChance: 0.40 },
  { spawnIntervalMs: 2200, enemySpeedMultiplier: 0.92, spawnIntensity: 0.18, powerUpDropChance: 0.35 },
  { spawnIntervalMs: 1900, enemySpeedMultiplier: 0.98, spawnIntensity: 0.30, powerUpDropChance: 0.30 },
  { spawnIntervalMs: 1650, enemySpeedMultiplier: 1.04, spawnIntensity: 0.42, powerUpDropChance: 0.26 },
  { spawnIntervalMs: 1400, enemySpeedMultiplier: 1.12, spawnIntensity: 0.55, powerUpDropChance: 0.22 },
  { spawnIntervalMs: 1200, enemySpeedMultiplier: 1.20, spawnIntensity: 0.66, powerUpDropChance: 0.19 },
  { spawnIntervalMs: 1000, enemySpeedMultiplier: 1.28, spawnIntensity: 0.76, powerUpDropChance: 0.16 },
  { spawnIntervalMs: 800, enemySpeedMultiplier: 1.38, spawnIntensity: 0.88, powerUpDropChance: 0.13 },
  { spawnIntervalMs: 600, enemySpeedMultiplier: 1.50, spawnIntensity: 1.0, powerUpDropChance: 0.10 },
];

// actuator boundaries
export const ACTUATOR_BOUNDS = {
  spawnIntervalMs: { min: 450, max: 3500 },
  enemySpeedMultiplier: { min: 0.75, max: 1.55 },
  spawnIntensity: { min: 0, max: 1 },
  powerUpDropChance: { min: 0.08, max: 0.50 },
};

export const STABILITY_CONFIG = {
  earlyCorrectionWaves: 2,
  earlyMaxStep: 2,
  normalMaxStep: 1,
};

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