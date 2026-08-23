import { describe, expect, it } from "vitest";

import { DifficultyController } from "../dda/DifficultyController";
import {
  MAX_DIFFICULTY_LEVEL,
  MIN_DIFFICULTY_LEVEL,
} from "../dda/DifficultyConfig";
import {
  generateExplanation,
  generateNeutralExplanation,
} from "../dda/ExplanationGenerator";
import { resolveParameterChanges } from "../dda/ParameterChanges";
import type { WavePerformance } from "../types/game";
import { createEmptyKillTally } from "../types/game";

interface WaveOverrides {
  kills?: number;
  livesLost?: number;
  persistence?: number;
  enemiesSpawned?: number;
}

function wave(overrides: WaveOverrides = {}): WavePerformance {
  const killsByType = createEmptyKillTally();

  killsByType.chaser = overrides.kills ?? 0;

  return {
    waveNumber: 1,
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
const MODERATE_DOWN = wave({ kills: 8, livesLost: 1, persistence: 0.33 });
const COLLAPSE = wave({ kills: 2, livesLost: 2, persistence: 0.5 });

describe("resolveParameterChanges", () => {
  it("reports no changes when level doesn't move", () => {
    expect(resolveParameterChanges(4, 4)).toEqual([]);
  });

  it("reports only actuators that changed", () => {
    const changes = resolveParameterChanges(3, 4);
    const names = changes.map((change) => change.parameter);

    for (const name of names) {
      const previous = resolveParameterChanges(3, 4).find(
        (change) => change.parameter === name,
      );

      expect(previous?.previousValue).not.toBe(previous?.nextValue);
    }
  });

  it("marks shorter spawn interval as increasing pressure", () => {
    const changes = resolveParameterChanges(1, 10);
    const spawn = changes.find((change) => change.parameter === "spawnIntervalMs");

    expect(spawn?.nextValue).toBeLessThan(spawn?.previousValue ?? 0);
    expect(spawn?.increasesPressure).toBe(true);
  });

  it("marks rarer power-ups as increasing pressure", () => {
    const changes = resolveParameterChanges(1, 10);
    const drops = changes.find((change) => change.parameter === "powerUpDropChance");

    expect(drops?.nextValue).toBeLessThan(drops?.previousValue ?? 0);
    expect(drops?.increasesPressure).toBe(true);
  });

  it("marks higher spawn intensity as increasing pressure", () => {
    const changes = resolveParameterChanges(1, 10);
    const intensity = changes.find((change) => change.parameter === "spawnIntensity");

    expect(intensity?.increasesPressure).toBe(true);
  });
});

describe("generateExplanation", () => {
  it("names direction when level rises", () => {
    const result = generateExplanation(
      "increase",
      3,
      4,
      resolveParameterChanges(3, 4),
      ["noLivesLost", "highKillRate", "fastClearing"],
    );

    expect(result.headline).toBe("Threat level increased");
    expect(result.levelValue).toBe("3 \u2192 4");
  });

  it("names direction when level falls", () => {
    const result = generateExplanation(
      "decrease",
      6,
      5,
      resolveParameterChanges(6, 5),
      ["livesLost", "lowKillRate", "slowClearing"],
    );

    expect(result.headline).toBe("Threat level reduced");
    expect(result.levelValue).toBe("6 \u2192 5");
  });

  it("reports no change when nothing moved", () => {
    const result = generateExplanation("unchanged", 4, 4, [], ["steadyKillRate"]);

    expect(result.headline).toBe("Threat level unchanged");
    expect(result.levelValue).toBe(`4 / ${String(MAX_DIFFICULTY_LEVEL)}`);
    expect(result.changeLines).toEqual([]);
  });

  it("never claims a change when there are no parameter changes", () => {
    const result = generateExplanation("increase", 10, 10, [], ["highKillRate"]);

    expect(result.headline).toBe("Threat level unchanged");
    expect(result.changeLines).toEqual([]);
  });

  it("points the arrow at labelled rate, not pressure", () => {
    const result = generateExplanation(
      "increase",
      3,
      5,
      resolveParameterChanges(3, 5),
      ["highKillRate"],
    );

    const byLabel = (label: string): string | undefined =>
      result.changeLines.find((line) => line.label.startsWith(label))?.direction;

    expect(byLabel("Enemies spawn")).toBe("up");
    expect(byLabel("Enemies move")).toBe("up");
    expect(byLabel("Enemies arrive")).toBe("up");
    expect(byLabel("Power-ups")).toBe("down");
  });

  it("reverses every arrow when the level falls", () => {
    const result = generateExplanation(
      "decrease",
      5,
      3,
      resolveParameterChanges(5, 3),
      ["livesLost"],
    );

    const byLabel = (label: string): string | undefined =>
      result.changeLines.find((line) => line.label.startsWith(label))?.direction;

    expect(byLabel("Enemies spawn")).toBe("down");
    expect(byLabel("Enemies move")).toBe("down");
    expect(byLabel("Enemies arrive")).toBe("down");
    expect(byLabel("Power-ups")).toBe("up");
  });

  it("omits reason line when no reasons are given", () => {
    const result = generateExplanation("unchanged", 4, 4, [], []);

    expect(result.reasonText).toBe("");
  });
});

describe("explanation accuracy against real decisions", () => {
  it("matches direction of increase", () => {
    const controller = new DifficultyController(3);
    const decision = controller.evaluate(PERFECT, 5);

    expect(decision.direction).toBe("increase");
    expect(decision.explanation.headline).toBe("Threat level increased");
    expect(decision.explanation.changeLines.length).toBeGreaterThan(0);
  });

  it("matches direction of decrease", () => {
    const controller = new DifficultyController(6);
    const decision = controller.evaluate(COLLAPSE, 5);

    expect(decision.direction).toBe("decrease");
    expect(decision.explanation.headline).toBe("Threat level reduced");
  });

  it("doesn't claim adjustment at maximum level", () => {
    const controller = new DifficultyController(MAX_DIFFICULTY_LEVEL);
    const decision = controller.evaluate(PERFECT, 5);

    expect(decision.parameterChanges).toEqual([]);
    expect(decision.explanation.headline).toBe("Threat level unchanged");
  });

  it("doesn't claim an adjustment at minimum level", () => {
    const controller = new DifficultyController(MIN_DIFFICULTY_LEVEL);
    const decision = controller.evaluate(COLLAPSE, 5);

    expect(decision.parameterChanges).toEqual([]);
    expect(decision.explanation.headline).toBe("Threat level unchanged");
  });

  it("doesn't claim an adjustment when hysteresis suppresses it", () => {
    const controller = new DifficultyController(4);

    controller.evaluate(MODERATE_UP, 5);

    const suppressed = controller.evaluate(MODERATE_DOWN, 5);

    expect(suppressed.suppressedByHysteresis).toBe(true);
    expect(suppressed.explanation.changeLines).toEqual([]);
  });
});

describe("hidden condition card", () => {
  it("carries no info about difficulty decision", () => {
    for (const card of [generateNeutralExplanation(true), generateNeutralExplanation(false)]) {
      expect(card.changeLines).toEqual([]);
      expect(card.reasonText).toBe("");
      expect(card.levelValue).toBe("");
    }
  });
});