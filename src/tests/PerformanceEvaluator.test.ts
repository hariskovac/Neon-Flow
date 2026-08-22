import { describe, expect, it } from "vitest";

import type { EnemyType, WavePerformance } from "../types/game";
import {
  classifyPerformance,
  resolveKillRatio,
  resolvePersistenceScore,
  resolveSurvivalScore,
  EVIDENCE_THRESHOLDS,
  EVIDENCE_WEIGHTS, } from "../dda/PerformanceEvaluator";
import { createEmptyKillTally } from "../types/game";

interface WaveOverrides {
  kills?: number;
  killsByType?: Partial<Record<EnemyType, number>>;
  livesLost?: number;
  persistence?: number;
  enemiesSpawned?: number;
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

describe("resolveKillRatio", () => {
  it("expresses kills as proportion of spawned enemies", () => {
    expect(resolveKillRatio(wave({ kills: 10, enemiesSpawned: 20 }))).toBeCloseTo(0.5, 10);
  });

  it("caps ratio at 1", () => {
    expect(resolveKillRatio(wave({ kills: 30, enemiesSpawned: 20 }))).toBe(1);
  });

  it("counts all enemy types", () => {
    const performance = wave({
      kills: 0,
      enemiesSpawned: 12,
      killsByType: { chaser: 2, dodger: 1, dasher: 1, splitter: 1, shard: 2, winder: 1 },
    });

    expect(resolveKillRatio(performance)).toBeCloseTo(8/12, 10);
  });
});

describe("resolveSurvivalScore", () => {
  it("scores no lives lost as full marks", () => {
    expect(resolveSurvivalScore(0)).toBe(1);
  });

  it("penalises each successive death more than the last", () => {
    const first = resolveSurvivalScore(0) - resolveSurvivalScore(1);
    const second = resolveSurvivalScore(1) - resolveSurvivalScore(2);

    expect(second).toBeGreaterThan(first);
  });

  it("floors at 0 once lives lost is >=3", () => {
    expect(resolveSurvivalScore(3)).toBe(0);
    expect(resolveSurvivalScore(5)).toBe(0);
  });
});

describe("resolvePersistenceScore", () => {
  it("scores full marks at or below low bound", () => {
    expect(resolvePersistenceScore(EVIDENCE_THRESHOLDS.lowPersistence)).toBe(1);
    expect(resolvePersistenceScore(0)).toBe(1);
  });

  it("scores 0 at or above high bound", () => {
    expect(resolvePersistenceScore(EVIDENCE_THRESHOLDS.highPersistence)).toBe(0);
    expect(resolvePersistenceScore(1)).toBe(0);
  });

  it("falls off linearly between bounds", () => {
    const low = EVIDENCE_THRESHOLDS.lowPersistence;
    const high = EVIDENCE_THRESHOLDS.highPersistence;
    const midpoint = (low + high) / 2;
 
    expect(resolvePersistenceScore(midpoint)).toBeCloseTo(0.5, 10);
  });
});

describe("performance score", () => {
  it("combines 3 signals in the documented weights", () => {
    const result = classifyPerformance(
      wave({ kills: 20, enemiesSpawned: 20, livesLost: 0, persistence: 0 }),
    );

    expect(result.performanceScore).toBeCloseTo(1, 10);
  });

  it("scores 0 when every signal is at its worst", () => {
    const result = classifyPerformance(
      wave({ kills: 0, livesLost: 5, persistence: 1 }),
    );

    expect(result.performanceScore).toBeCloseTo(0, 10);
  });

  it("weighs survival above kill rate, and kill rate above persistence", () => {
    expect(EVIDENCE_WEIGHTS.survival).toBeGreaterThan(EVIDENCE_WEIGHTS.killRatio);
    expect(EVIDENCE_WEIGHTS.killRatio).toBeGreaterThan(EVIDENCE_WEIGHTS.persistence);
  });

  it("uses weights that sum to one, for a 0-1 scale", () => {
    const total =
      EVIDENCE_WEIGHTS.survival + EVIDENCE_WEIGHTS.killRatio + EVIDENCE_WEIGHTS.persistence;

    expect(total).toBeCloseTo(1, 10);
  });

  it("lets strong clearing partly offset 1 death", () => {
    const strong = classifyPerformance(
      wave({ kills: 18, livesLost: 1, persistence: 0.2 }),
    );

    const poor = classifyPerformance(
      wave({ kills: 8, livesLost: 1, persistence: 0.45 }),
    );

    expect(strong.performanceScore).toBeGreaterThan(poor.performanceScore);
    expect(strong.evidence).not.toBe(poor.evidence);
  });
});


describe("classifyPerformance", () => {
  it("treats massive life loss as strong negative evidence", () => {
    const result = classifyPerformance(
      wave({ kills: 20, enemiesSpawned: 20, livesLost: 3, persistence: 0 }),
    );

    expect(result.evidence).toBe("strongDecrease");
  });

  it("classifies weak wave as negative evidence", () => {
    const result = classifyPerformance(
      wave({ kills: 8, livesLost: 1, persistence: 0.35 }),
    );

    expect(result.evidence).toBe("decrease");
  });

  it("reserves strongest negative class for a really poor wave", () => {
    const result = classifyPerformance(
      wave({ kills: 5, livesLost: 1, persistence: 0.45 }),
    );

    expect(result.evidence).toBe("strongDecrease");
  });

  it("holds on average performance", () => {
    const result = classifyPerformance(
      wave({ kills: 12, livesLost: 0, persistence: 0.3 }),
    );

    expect(result.evidence).toBe("targetRange");
  });
});

describe("classifyPerformance reasons", () => {
  it("describes all 3 signals on every decision", () => {
    const result = classifyPerformance(wave({ kills: 12, livesLost: 1 }));

    expect(result.reasons.length).toBe(3);
  });

  it("names life loss based on whether it occurred", () => {
    expect(classifyPerformance(wave({ livesLost: 0 })).reasons).toContain("noLivesLost");
    expect(classifyPerformance(wave({ livesLost: 2 })).reasons).toContain("livesLost");
  });

  it("names kill rate", () => {
    expect(classifyPerformance(wave({ kills: 18 })).reasons).toContain("highKillRate");
    expect(classifyPerformance(wave({ kills: 12 })).reasons).toContain("steadyKillRate");
    expect(classifyPerformance(wave({ kills: 4 })).reasons).toContain("lowKillRate");
  });

  it("names clearing band", () => {
    expect(classifyPerformance(wave({ persistence: 0.1 })).reasons).toContain("fastClearing");
    expect(classifyPerformance(wave({ persistence: 0.3 })).reasons).toContain("steadyClearing");
    expect(classifyPerformance(wave({ persistence: 0.5 })).reasons).toContain("slowClearing");
  });

  it("reports raw metrics that decision was calculated from", () => {
    const result = classifyPerformance(
      wave({ kills: 10, enemiesSpawned: 20, livesLost: 1, persistence: 0.33 }),
    );

    expect(result.killRatio).toBeCloseTo(0.5, 10);
    expect(result.livesLost).toBe(1);
    expect(result.enemyPersistence).toBeCloseTo(0.33, 10);
  });

  it("produces identical results for same inputs", () => {
    const performance = wave({ kills: 12, livesLost: 1, persistence: 0.28 });

    expect(classifyPerformance(performance)).toEqual(classifyPerformance(performance));
  });
});