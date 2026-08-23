  import type { ActuatorValues } from "./DifficultyConfig";
  import { resolveActuators } from "./DifficultyConfig";

  export type ActuatorKey = keyof ActuatorValues;

  export interface ParameterChange {
    readonly parameter: ActuatorKey;
    readonly previousValue: number;
    readonly nextValue: number;
    readonly increasesPressure: boolean;
  }

  const HIGHER_VALUE_INCREASES_PRESSURE: Record<ActuatorKey, boolean> = {
    spawnIntervalMs: false,
    enemySpeedMultiplier: true,
    spawnIntensity: true,
    powerUpDropChance: false,
  };

  export const ACTUATOR_KEYS: ActuatorKey[] = [
    "spawnIntervalMs",
    "enemySpeedMultiplier",
    "spawnIntensity",
    "powerUpDropChance",
  ];

  export function resolveParameterChanges(
    previousLevel: number,
    nextLevel: number,
  ): ParameterChange[] {
    const previous = resolveActuators(previousLevel);
    const next = resolveActuators(nextLevel);
    const changes: ParameterChange[] = [];

    for (const parameter of ACTUATOR_KEYS) {
      const previousValue = previous[parameter];
      const nextValue = next[parameter];

      if (previousValue === nextValue) {
        continue;
      }

      const rose = nextValue > previousValue;

      changes.push({
        parameter,
        previousValue,
        nextValue,
        increasesPressure:
          rose === HIGHER_VALUE_INCREASES_PRESSURE[parameter],
      });
    }

    return changes;
  }