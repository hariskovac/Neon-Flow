import { describe, expect, it } from "vitest";

import type { EnemyType, WavePerformance } from "../types/game";
import {
  DEFAULT_STARTING_LEVEL,
  mapCalibration,
} from "../dda/CalibrationMapper";
import {
  MAX_DIFFICULTY_LEVEL,
  MIN_DIFFICULTY_LEVEL,
} from "../dda/DifficultyConfig";

interface CalibrationOverrides {
  kills?: number;
  livesLost?: number;
  enemiesSpawned?: number;
  durationMs?: number;
}

function calibration(overrides: CalibrationOverrides = {}): WavePerformance {
  const kills = overrides.kills ?? 0;
  const killsByType: Record<EnemyType, number> = {
    chaser: kills,
    ranged: 0,
    dasher: 0,
  };

  return {
    waveNumber: 0,
    killsByType,
    livesLost: overrides.livesLost ?? 0,
    shieldHitsAbsorbed: 0,
    enemiesRemaining: 4,
    enemiesSpawned: overrides.enemiesSpawned ?? 20,
    shotsFired: 120,
    shotsHit: 50,
    durationMs: overrides.durationMs ?? 45000,
  };
}

describe("mapCalibration bands", () => {
  it("places near-total clear at highest starting level", () => {
    const result = mapCalibration(calibration({ kills: 18 }));

    expect(result.band).toBe("veryStrong");
    expect(result.startingLevel).toBe(5);
  });

  it("places strong clear one level below the top", () => {
    const result = mapCalibration(calibration({ kills: 15 }));

    expect(result.band).toBe("strong");
    expect(result.startingLevel).toBe(4);
  });

  it("places middling performance in target band", () => {
    const result = mapCalibration(calibration({ kills: 10 }));

    expect(result.band).toBe("target");
    expect(result.startingLevel).toBe(3);
  });

  it("places weak performance below target", () => {
    const result = mapCalibration(calibration({ kills: 6 }));

    expect(result.band).toBe("belowTarget");
    expect(result.startingLevel).toBe(2);
  });

  it("places very low performance at lowest starting level", () => {
    const result = mapCalibration(calibration({ kills: 2 }));

    expect(result.band).toBe("veryLow");
    expect(result.startingLevel).toBe(1);
  });
});

describe("mapCalibration life loss capping", () => {
  it("caps a great round below target after heavy losses", () => {
    const result = mapCalibration(calibration({ kills: 18, livesLost: 3 }));

    expect(result.band).toBe("belowTarget");
    expect(result.reasons).toContain("livesLost");
  });

  it("caps a great round at target after moderate losses", () => {
    const result = mapCalibration(calibration({ kills: 18, livesLost: 2 }));

    expect(result.band).toBe("target");
  });

  it("doesn't raise weak round just because no lives were lost", () => {
    const result = mapCalibration(calibration({ kills: 2, livesLost: 0 }));

    expect(result.band).toBe("veryLow");
  });

  it("never raises a band above what the kill ratio earned", () => {
    const result = mapCalibration(calibration({ kills: 6, livesLost: 3 }));

    expect(result.band).toBe("belowTarget");
  });

  it("leaves a single life lost without effect", () => {
    const result = mapCalibration(calibration({ kills: 18, livesLost: 1 }));

    expect(result.band).toBe("veryStrong");
    expect(result.reasons).toEqual(["killRate"]);
  });
});

describe("mapCalibration edge cases", () => {
  it("falls back to the target level when there is no calibration data", () => {
    const result = mapCalibration(null);

    expect(result.startingLevel).toBe(DEFAULT_STARTING_LEVEL);
    expect(result.reasons).toContain("noCalibrationData");
  });

  it("uses the ratio, so a round cut short is judged fairly", () => {
    const full = mapCalibration(
      calibration({ kills: 9, enemiesSpawned: 12, durationMs: 45000 }),
    );

    const short = mapCalibration(
      calibration({ kills: 3, enemiesSpawned: 4, durationMs: 15000 }),
    );

    expect(short.band).toBe(full.band);
  });

  it("always produces a level within the permitted range", () => {
    const cases = [0, 2, 6, 10, 15, 18, 20];

    for (const kills of cases) {
      const level = mapCalibration(calibration({ kills })).startingLevel;

      expect(level).toBeGreaterThanOrEqual(MIN_DIFFICULTY_LEVEL);
      expect(level).toBeLessThanOrEqual(MAX_DIFFICULTY_LEVEL);
      expect(level).toBeLessThanOrEqual(5);
    }
  });
});