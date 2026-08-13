import { describe, expect, it } from "vitest";

import type { EnemyType, WavePerformance } from "../types/game";
import { DifficultyController } from "../dda/DifficultyController";

import {
  MAX_DIFFICULTY_LEVEL,
  MIN_DIFFICULTY_LEVEL,
  clampLevel,
  resolveActuators,
} from "../dda/DifficultyConfig";

interface WaveOverrides {
  kills?: number;
  livesLost?: number;
  enemiesRemaining?: number;
  enemiesSpawned?: number;
  waveNumber?: number;
}

function wave(overrides: WaveOverrides = {}): WavePerformance {
  const kills = overrides.kills ?? 0;
  const killsByType: Record<EnemyType, number> = {
    chaser: kills,
    ranged: 0,
    dasher: 0,
  };

  return {
    waveNumber: overrides.waveNumber ?? 1,
    killsByType,
    livesLost: overrides.livesLost ?? 0,
    shieldHitsAbsorbed: 0,
    enemiesRemaining: overrides.enemiesRemaining ?? 6,
    enemiesSpawned: overrides.enemiesSpawned ?? 20,
    shotsFired: 100,
    shotsHit: 40,
    durationMs: 40000,
    powerUpsSpawned: 0,
    powerUpsCollected: 0,
  };
}

const STRONG = wave({ kills: 18, enemiesRemaining: 6 });
const MODERATE_UP = wave({ kills: 15, enemiesRemaining: 6 });
const MODERATE_DOWN = wave({ kills: 6, livesLost: 1 });
const STRUGGLING = wave({ kills: 4, livesLost: 4 });
const STEADY = wave({ kills: 11, enemiesRemaining: 6 });

describe("DifficultyController step sizing", () => {
  it("allows 2-level jump on extreme evidence in first 2 waves", () => {
    const controller = new DifficultyController(3);
    const decision = controller.evaluate(STRONG);

    expect(decision.previousLevel).toBe(3);
    expect(decision.nextLevel).toBe(5);
    expect(decision.direction).toBe("increase");
  });

  it("limits moderate evidence to 1 level", () => {
    const controller = new DifficultyController(3);

    expect(controller.evaluate(MODERATE_UP).nextLevel).toBe(4);
  });

  it("limits extreme evidence to 1 level after first 2 waves", () => {
    const controller = new DifficultyController(1);

    controller.evaluate(STRONG);
    controller.evaluate(STRONG);

    const third = controller.evaluate(STRONG);

    expect(third.nextLevel - third.previousLevel).toBe(1);
  });

  it("drops 2 levels on extreme struggle", () => {
    const controller = new DifficultyController(6);

    expect(controller.evaluate(STRUGGLING).nextLevel).toBe(4);
  });
});

describe("DifficultyController stability", () => {
  it("holds when performance is in target range", () => {
    const controller = new DifficultyController(4);
    const decision = controller.evaluate(STEADY);

    expect(decision.nextLevel).toBe(4);
    expect(decision.direction).toBe("unchanged");
  });

  it("suppresses moderate reversal immediately after change", () => {
    const controller = new DifficultyController(4);

    controller.evaluate(MODERATE_UP);

    const reversal = controller.evaluate(MODERATE_DOWN);

    expect(reversal.suppressedByHysteresis).toBe(true);
    expect(reversal.direction).toBe("unchanged");
    expect(controller.getLevel()).toBe(5);
  });

  it("allows reversal once confirmed by a 2nd wave", () => {
    const controller = new DifficultyController(4);

    controller.evaluate(MODERATE_UP);
    controller.evaluate(MODERATE_DOWN);

    const confirmed = controller.evaluate(MODERATE_DOWN);

    expect(confirmed.direction).toBe("decrease");
    expect(controller.getLevel()).toBe(4);
  });

  it("lets strong evidence override hysteresis", () => {
    const controller = new DifficultyController(4);

    controller.evaluate(MODERATE_UP);

    const override = controller.evaluate(STRUGGLING);

    expect(override.suppressedByHysteresis).toBe(false);
    expect(override.direction).toBe("decrease");
  });

  it("doesn't oscillate with alternating small performance", () => {
    const controller = new DifficultyController(5);

    for (let index = 0; index < 4; index += 1) {
      controller.evaluate(MODERATE_UP);
      controller.evaluate(MODERATE_DOWN);
    }

    // Reversals are suppressed
    expect(controller.getLevel()).toBeLessThanOrEqual(9);
    expect(controller.getLevel()).toBeGreaterThanOrEqual(5);
  });
});

describe("DifficultyController bounds", () => {
  it("never rises above maximum level", () => {
    const controller = new DifficultyController(MAX_DIFFICULTY_LEVEL);

    for (let index = 0; index < 6; index += 1) {
      controller.evaluate(STRONG);
    }

    expect(controller.getLevel()).toBe(MAX_DIFFICULTY_LEVEL);
  });

  it("never falls below minimum level", () => {
    const controller = new DifficultyController(MIN_DIFFICULTY_LEVEL);

    for (let index = 0; index < 6; index += 1) {
      controller.evaluate(STRUGGLING);
    }

    expect(controller.getLevel()).toBe(MIN_DIFFICULTY_LEVEL);
  });

  it("reports unchanged when at the cap", () => {
    const controller = new DifficultyController(MAX_DIFFICULTY_LEVEL);
    const decision = controller.evaluate(STRONG);

    expect(decision.direction).toBe("unchanged");
    expect(decision.nextLevel).toBe(MAX_DIFFICULTY_LEVEL);
  });

  it("clamps starting level outside permitted range", () => {
    expect(new DifficultyController(0).getLevel()).toBe(MIN_DIFFICULTY_LEVEL);
    expect(new DifficultyController(99).getLevel()).toBe(MAX_DIFFICULTY_LEVEL);
  });
});

describe("resolveActuators", () => {
  it("increases pressure as level rises", () => {
    for (let level = MIN_DIFFICULTY_LEVEL; level < MAX_DIFFICULTY_LEVEL; level += 1) {
      const lower = resolveActuators(level);
      const higher = resolveActuators(level + 1);

      expect(higher.spawnIntervalMs).toBeLessThan(lower.spawnIntervalMs);
      expect(higher.enemySpeedMultiplier).toBeGreaterThan(lower.enemySpeedMultiplier);
      expect(higher.rangedAttackIntervalMs).toBeLessThan(lower.rangedAttackIntervalMs);
      expect(higher.powerUpDropChance).toBeLessThan(lower.powerUpDropChance);
    }
  });

  it("clamps out of range level instead of failing", () => {
    expect(resolveActuators(0)).toEqual(resolveActuators(MIN_DIFFICULTY_LEVEL));
    expect(resolveActuators(50)).toEqual(resolveActuators(MAX_DIFFICULTY_LEVEL));
    expect(clampLevel(4.6)).toBe(5);
  });
});