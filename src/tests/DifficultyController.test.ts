import { describe, expect, it } from "vitest";

import type { EnemyType, WavePerformance } from "../types/game";
import { DifficultyController } from "../dda/DifficultyController";
import { createEmptyKillTally } from "../types/game";

import {
  MAX_DIFFICULTY_LEVEL,
  MIN_DIFFICULTY_LEVEL,
  STABILITY_CONFIG,
  clampLevel,
  resolveActuators,
} from "../dda/difficultyConfig";

interface WaveOverrides {
  kills?: number;
  killsByType?: Partial<Record<EnemyType, number>>;
  livesLost?: number;
  persistence?: number;
  enemiesSpawned?: number;
  waveNumber?: number;
}

function wave(overrides: WaveOverrides = {}): WavePerformance {
  const killsByType = createEmptyKillTally();

  killsByType.chaser = overrides.kills ?? 0;

  if (overrides.killsByType !== undefined) {
    for (const [type, count] of Object.entries(overrides.killsByType)) {
      killsByType[type as EnemyType] = count ?? 0;
    }
  }

  return {
    waveNumber: overrides.waveNumber ?? 1,
    killsByType,
    livesLost: overrides.livesLost ?? 0,
    shieldHitsAbsorbed: 0,
    enemyPersistence: overrides.persistence ?? 0.3,
    enemiesTracked: 20,
    enemiesClearedByDeath: 0,
    enemiesSpawned: overrides.enemiesSpawned ?? 20,
    shotsFired: 100,
    shotsHit: 40,
    durationMs: 40000,
    powerUpsSpawned: 0,
    powerUpsCollected: 0,
  };
}

const PERFECT = wave({ kills: 20, livesLost: 0, persistence: 0.1 });
const MODERATE_UP = wave({ kills: 16, livesLost: 0, persistence: 0.25 });
const STEADY = wave({ kills: 12, livesLost: 0, persistence: 0.3 });
const MODERATE_DOWN = wave({ kills: 8, livesLost: 1, persistence: 0.33 });
const STRONG_DOWN = wave({ kills: 4, livesLost: 1, persistence: 0.45 });
const COLLAPSE = wave({ kills: 2, livesLost: 2, persistence: 0.5 });


describe("DifficultyController step sizing", () => {
  it("allows 2-level jump on extreme early evidence", () => {
    const controller = new DifficultyController(3);
    const decision = controller.evaluate(PERFECT, 5);

    expect(decision.nextLevel).toBe(5);
    expect(decision.usedAcceleratedStep).toBe(true);
  });

  it("allows accelerated step once per session", () => {
    const controller = new DifficultyController(1);

    const first = controller.evaluate(PERFECT, 5);
    const second = controller.evaluate(PERFECT, 5);

    expect(first.usedAcceleratedStep).toBe(true);
    expect(second.usedAcceleratedStep).toBe(false);
    expect(second.nextLevel - second.previousLevel).toBe(1);
  });

  it("limits moderate evidence to 1 level up", () => {
    const controller = new DifficultyController(3);
    const decision = controller.evaluate(MODERATE_UP, 5);

    expect(decision.nextLevel).toBe(4);
    expect(decision.usedAcceleratedStep).toBe(false);
  });

  it("moves 1 level down on ordinary negative evidence", () => {
    const controller = new DifficultyController(6);

    expect(controller.evaluate(MODERATE_DOWN, 5).nextLevel).toBe(5);
  });

  it("holds level when performance is in target range", () => {
    const controller = new DifficultyController(4);
    const decision = controller.evaluate(STEADY, 5);

    expect(decision.nextLevel).toBe(4);
    expect(decision.direction).toBe("unchanged");
  });

  it("drops 2 levels on extreme struggle", () => {
    const controller = new DifficultyController(7);
    const decision = controller.evaluate(COLLAPSE, 5);

    expect(decision.nextLevel).toBe(5);
    expect(decision.usedAcceleratedStep).toBe(true);
  });
});

describe("DifficultyController hysteresis", () => {
  it("suppresses moderate reversal immediately after a change", () => {
    const controller = new DifficultyController(4);

    controller.evaluate(MODERATE_UP, 5);

    const reversal = controller.evaluate(MODERATE_DOWN, 5);

    expect(reversal.suppressedByHysteresis).toBe(true);
    expect(reversal.direction).toBe("unchanged");
    expect(controller.getLevel()).toBe(5);
  });

  it("allows reversal once a 2nd wave confirms it", () => {
    const controller = new DifficultyController(4);

    controller.evaluate(MODERATE_UP, 5);
    controller.evaluate(MODERATE_DOWN, 5);

    const confirmed = controller.evaluate(MODERATE_DOWN, 5);

    expect(confirmed.direction).toBe("decrease");
    expect(controller.getLevel()).toBe(4);
  });

  it("lets strong evidence override suppression", () => {
    const controller = new DifficultyController(4);

    controller.evaluate(MODERATE_UP, 5);

    const override = controller.evaluate(STRONG_DOWN, 5);

    expect(override.suppressedByHysteresis).toBe(false);
    expect(override.direction).toBe("decrease");
  });

  it("reports no parameter changes when change is suppressed", () => {
    const controller = new DifficultyController(4);

    controller.evaluate(MODERATE_UP, 5);

    const suppressed = controller.evaluate(MODERATE_DOWN, 5);

    expect(suppressed.parameterChanges).toEqual([]);
    expect(suppressed.explanation.headline).toBe("Threat level unchanged");
  });

  it("doesn't suppress first change of a session", () => {
    const controller = new DifficultyController(5);
    const decision = controller.evaluate(MODERATE_DOWN, 5);

    expect(decision.suppressedByHysteresis).toBe(false);
    expect(decision.direction).toBe("decrease");
  });

  it("suppresses decrease when the participant has >2 lives", () => {
    const controller = new DifficultyController(5);

    controller.evaluate(MODERATE_UP, 5);

    const reversal = controller.evaluate(MODERATE_DOWN, 4);

    expect(reversal.suppressedByHysteresis).toBe(true);
  });

  it("allows a decrease when the participant has <= 2 lives", () => {
    const controller = new DifficultyController(5);

    controller.evaluate(MODERATE_UP, 5);

    const reversal = controller.evaluate(
      MODERATE_DOWN,
      STABILITY_CONFIG.safetyLivesRemaining,
    );

    expect(reversal.suppressedByHysteresis).toBe(false);
    expect(reversal.direction).toBe("decrease");
  });
});


describe("DifficultyController bounds", () => {
  it("never rises above maximum level", () => {
        const controller = new DifficultyController(MAX_DIFFICULTY_LEVEL);

    for (let index = 0; index < 6; index += 1) {
      controller.evaluate(PERFECT, 5);
    }

    expect(controller.getLevel()).toBe(MAX_DIFFICULTY_LEVEL);
  });

  it("never falls below minimum level", () => {
    const controller = new DifficultyController(MIN_DIFFICULTY_LEVEL);

    for (let index = 0; index < 6; index += 1) {
      controller.evaluate(COLLAPSE, 5);
    }

    expect(controller.getLevel()).toBe(MIN_DIFFICULTY_LEVEL);
  });

  it("clamps starting level outside permitted range", () => {
    expect(new DifficultyController(0).getLevel()).toBe(MIN_DIFFICULTY_LEVEL);
    expect(new DifficultyController(99).getLevel()).toBe(MAX_DIFFICULTY_LEVEL);
  });

  it("produces identical decisions for same inputs", () => {
    const first = new DifficultyController(4);
    const second = new DifficultyController(4);

    expect(first.evaluate(MODERATE_UP, 5)).toEqual(second.evaluate(MODERATE_UP, 5));
  });
});

describe("resolveActuators", () => {
  it("increases pressure as level rises", () => {
    for (let level = MIN_DIFFICULTY_LEVEL; level < MAX_DIFFICULTY_LEVEL; level += 1) {
      const lower = resolveActuators(level);
      const higher = resolveActuators(level + 1);

      expect(higher.spawnIntervalMs).toBeLessThanOrEqual(lower.spawnIntervalMs);
      expect(higher.enemySpeedMultiplier).toBeGreaterThanOrEqual(lower.enemySpeedMultiplier);
      expect(higher.spawnIntensity).toBeGreaterThanOrEqual(lower.spawnIntensity);
      expect(higher.powerUpDropChance).toBeLessThanOrEqual(lower.powerUpDropChance);
    }
  });

  it("clamps out of range level instead of failing", () => {
    expect(resolveActuators(0)).toEqual(resolveActuators(MIN_DIFFICULTY_LEVEL));
    expect(resolveActuators(50)).toEqual(resolveActuators(MAX_DIFFICULTY_LEVEL));
    expect(clampLevel(4.6)).toBe(5);
  });
});