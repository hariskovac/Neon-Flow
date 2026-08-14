import { describe, expect, it } from "vitest";

import { DifficultyController } from "../dda/DifficultyController";
import {
  MAX_DIFFICULTY_LEVEL,
  MIN_DIFFICULTY_LEVEL,
} from "../dda/DifficultyConfig";
import {
  flattenExplanation,
  generateCalibrationExplanation,
  generateExplanation,
} from "../dda/ExplanationGenerator";
import { resolveParameterChanges } from "../dda/ParameterChanges";
import type { EnemyType, WavePerformance } from "../types/game";

function wave(kills: number, livesLost = 0): WavePerformance {
  const killsByType: Record<EnemyType, number> = {
    chaser: kills,
    ranged: 0,
    dasher: 0,
  };

  return {
    waveNumber: 1,
    killsByType,
    livesLost,
    shieldHitsAbsorbed: 0,
    enemiesRemaining: 6,
    enemiesSpawned: 20,
    shotsFired: 100,
    shotsHit: 40,
    durationMs: 40000,
    powerUpsSpawned: 0,
    powerUpsCollected: 0,
  };
}


describe("resolveParameterChanges", () => {
  it("reports no changes when level doesn't move", () => {
    expect(resolveParameterChanges(4, 4)).toEqual([]);
  });

  it("reports every actuator when level moves", () => {
    const changes = resolveParameterChanges(3, 4);

    expect(changes.length).toBe(4);
  });

  it("marks shorter spawn interval as increasing pressure", () => {
    const changes = resolveParameterChanges(3, 5);
    const spawn = changes.find((c) => c.parameter === "spawnIntervalMs");

    expect(spawn?.nextValue).toBeLessThan(spawn?.previousValue ?? 0);
    expect(spawn?.increasesPressure).toBe(true);
  });

  it("marks longer spawn interval as reducing pressure", () => {
    const changes = resolveParameterChanges(5, 3);
    const spawn = changes.find((c) => c.parameter === "spawnIntervalMs");

    expect(spawn?.increasesPressure).toBe(false);
  });

  it("marks faster enemies as increasing pressure", () => {
    const changes = resolveParameterChanges(2, 6);
    const speed = changes.find((c) => c.parameter === "enemySpeedMultiplier");

    expect(speed?.increasesPressure).toBe(true);
  });

  it("marks rarer power-ups as increasing pressure", () => {
    const changes = resolveParameterChanges(2, 6);
    const drops = changes.find((c) => c.parameter === "powerUpDropChance");

    expect(drops?.nextValue).toBeLessThan(drops?.previousValue ?? 0);
    expect(drops?.increasesPressure).toBe(true);
  });
});

describe("generateExplanation", () => {
  it("names direction when level rises", () => {
    const result = generateExplanation(
      "increase",
      3,
      4,
      resolveParameterChanges(3, 4),
      ["highKillRate"],
    );

    expect(result.headline).toBe("Threat level increased");
  });

  it("names direction when level falls", () => {
    const result = generateExplanation(
      "decrease",
      5,
      4,
      resolveParameterChanges(5, 4),
      ["livesLost"],
    );

    expect(result.headline).toBe("Threat level reduced");
  });

  it("reports no change when nothing moved", () => {
    const result = generateExplanation("unchanged", 4, 4, [], ["highKillRate"]);

    expect(result.headline).toBe("Threat level unchanged");
    expect(result.changeLines).toEqual([]);
  });

  it("never claims a change when there are no parameter changes", () => {
    const result = generateExplanation("increase", 4, 4, [], ["highKillRate"]);

    expect(result.headline).toBe("Threat level unchanged");
    expect(result.changeLines).toEqual([]);
  });

  it("labels parameters as rates so the arrow matches the noun", () => {
    const result = generateExplanation(
      "increase",
      3,
      4,
      resolveParameterChanges(3, 4),
      ["highKillRate"],
    );

    const labels = result.changeLines.map((line) => line.label);

    expect(labels).toEqual([
      "Enemies spawn more often",
      "Enemies move faster",
      "Ranged enemies fire more often",
      "Power-ups appear less often",
    ]);
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
    expect(byLabel("Ranged enemies")).toBe("up");
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
    expect(byLabel("Ranged enemies")).toBe("down");
    expect(byLabel("Power-ups")).toBe("up");
  });

  it("omits reason line when no reasons are supplied", () => {
    const result = generateExplanation("unchanged", 4, 4, [], []);

    expect(result.reasonText).toBe("");
  });

  it("states level in calibration message", () => {
    expect(generateCalibrationExplanation(4, 5).headline).toBe(
      "Calibration complete",
    );
  });

  it("flattens to one line for telemetry record", () => {
    const result = generateExplanation(
      "increase",
      3,
      4,
      resolveParameterChanges(3, 4),
      ["highKillRate"],
    );

    const flat = flattenExplanation(result);

    expect(flat).toContain("Threat level increased");
    expect(flat).toContain("up: Enemies spawn more often");
    expect(flat).toContain("down: Power-ups appear less often");
  });
});

describe("explanation accuracy against real decisions", () => {
  it("matches direction and changes of increase", () => {
    const controller = new DifficultyController(3);
    const decision = controller.evaluate(wave(18));

    expect(decision.direction).toBe("increase");
    expect(decision.parameterChanges.length).toBeGreaterThan(0);
    expect(decision.explanation.headline).toBe("Threat level increased");
  });

  it("doesn't claim adjustment at maximum level", () => {
    const controller = new DifficultyController(MAX_DIFFICULTY_LEVEL);
    const decision = controller.evaluate(wave(18));

    expect(decision.parameterChanges).toEqual([]);
    expect(decision.explanation.headline).toBe("Threat level unchanged");
  });

  it("doesn't claim an adjustment at minimum level", () => {
        const controller = new DifficultyController(MIN_DIFFICULTY_LEVEL);
    const decision = controller.evaluate(wave(2, 4));

    expect(decision.parameterChanges).toEqual([]);
    expect(decision.explanation.headline).toBe("Threat level unchanged");
  });

  it("doesn't claim an adjustment when hysteresis suppresses one", () => {
        const controller = new DifficultyController(4);

    controller.evaluate(wave(15));

    const suppressed = controller.evaluate(wave(6, 1));

    expect(suppressed.suppressedByHysteresis).toBe(true);
    expect(suppressed.parameterChanges).toEqual([]);
    expect(suppressed.explanation.headline).toBe("Threat level unchanged");
  });

  it("every parameter named in an explanation actually changed", () => {
    const controller = new DifficultyController(2);

    for (let index = 0; index < 5; index += 1) {
      const decision = controller.evaluate(wave(18));

      const labels = decision.explanation.changeLines.map((l) => l.label);

      if (labels.some((l) => l.startsWith("Enemies move"))) {
        const speed = decision.parameterChanges.find(
          (c) => c.parameter === "enemySpeedMultiplier",
        );

        expect(speed === undefined).toBe(false);
      }

      if (labels.some((l) => l.startsWith("Ranged enemies"))) {
        const ranged = decision.parameterChanges.find(
          (c) => c.parameter === "rangedAttackIntervalMs",
        );

        expect(ranged === undefined).toBe(false);
      }
    }
  });
});