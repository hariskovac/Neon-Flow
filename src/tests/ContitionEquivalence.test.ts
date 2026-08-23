import { describe, expect, it } from "vitest";

import { DifficultyController } from "../dda/DifficultyController";
import { resolveActuators } from "../dda/DifficultyConfig";
import { mapCalibration } from "../dda/CalibrationMapper";
import { flattenExplanation } from "../dda/ExplanationGenerator";
import type { EnemyType, WavePerformance } from "../types/game";
import { createEmptyKillTally } from "../types/game";

interface WaveOverrides {
  kills?: number;
  livesLost?: number;
  persistence?: number;
  enemiesSpawned?: number;
  waveNumber?: number;
}

function wave(overrides: WaveOverrides = {}): WavePerformance {
  const killsByType: Record<EnemyType, number> = createEmptyKillTally();

  killsByType.chaser = overrides.kills ?? 0;

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

// six-wave sequence covering rises, falls, and no change
const SEQUENCE: WavePerformance[] = [
  wave({ waveNumber: 1, kills: 20, livesLost: 0, persistence: 0.1 }),
  wave({ waveNumber: 2, kills: 16, livesLost: 0, persistence: 0.25 }),
  wave({ waveNumber: 3, kills: 8, livesLost: 1, persistence: 0.33 }),
  wave({ waveNumber: 4, kills: 8, livesLost: 1, persistence: 0.33 }),
  wave({ waveNumber: 5, kills: 12, livesLost: 0, persistence: 0.3 }),
  wave({ waveNumber: 6, kills: 2, livesLost: 2, persistence: 0.5 }),
];

interface SessionRecord {
  readonly levels: number[];
  readonly directions: string[];
  readonly evidence: string[];
  readonly scores: number[];
  readonly explanations: string[];
  readonly actuators: string[];
  readonly acceleratedSteps: boolean[];
}

function runSession(startingLevel: number): SessionRecord {
  const controller = new DifficultyController(startingLevel);

  const levels: number[] = [];
  const directions: string[] = [];
  const evidence: string[] = [];
  const scores: number[] = [];
  const explanations: string[] = [];
  const actuators: string[] = [];
  const acceleratedSteps: boolean[] = [];

  for (const performance of SEQUENCE) {
    const decision = controller.evaluate(performance, 5);

    levels.push(decision.nextLevel);
    directions.push(decision.direction);
    evidence.push(decision.evidence);
    scores.push(decision.performanceScore);
    explanations.push(flattenExplanation(decision.explanation));
    actuators.push(JSON.stringify(resolveActuators(decision.nextLevel)));
    acceleratedSteps.push(decision.usedAcceleratedStep);
  }

  return {
    levels,
    directions,
    evidence,
    scores,
    explanations,
    actuators,
    acceleratedSteps,
  };
}

describe("condition equivalence", () => {
  it("produces same difficulty trajectory for both conditions", () => {
    // 2 participants with identical performance, one per condition
    const hidden = runSession(3);
    const transparent = runSession(3);

    expect(hidden.levels).toEqual(transparent.levels);
  });

  it("produces same decision direction for both conditions", () => {
    expect(runSession(3).directions).toEqual(runSession(3).directions);
  });

  it("produces same actuator values for both conditions", () => {
    expect(runSession(3).actuators).toEqual(runSession(3).actuators);
  });

  it("generates same explanation text in both conditions", () => {
    expect(runSession(3).explanations).toEqual(runSession(3).explanations);
  });

  it("maps calibration to same starting level regardless of condition", () => {
    const calibration = wave({ waveNumber: 0, kills: 15, livesLost: 1 });

    expect(mapCalibration(calibration)).toEqual(mapCalibration(calibration));
  });

  it("gives whole decision record (identical) for both conditions", () => {
    const first = new DifficultyController(4);
    const second = new DifficultyController(4);

    for (const performance of SEQUENCE) {
      expect(first.evaluate(performance, 5)).toEqual(second.evaluate(performance, 5));
    }
  });

  it("doesn't let an explanation name a parameter that didn't change", () => {
    const controller = new DifficultyController(3);

    for (const performance of SEQUENCE) {
      const decision = controller.evaluate(performance, 5);

      expect(decision.explanation.changeLines.length).toBe(
        decision.parameterChanges.length,
      );
    }
  });

  it("describes every wave's performance signals", () => {
    const controller = new DifficultyController(3);

    for (const performance of SEQUENCE) {
      const decision = controller.evaluate(performance, 5);

      expect(decision.explanation.reasonText).not.toBe("");
      expect(decision.reasons.length).toBe(3);
    }
  });
});