import type { WavePerformance } from "../types/game";

export type EvidenceClass =
  | "strongIncrease"
  | "increase"
  | "targetRange"
  | "decrease"
  | "strongDecrease";

export interface EvidenceResult {
  readonly evidence: EvidenceClass;
  readonly reasons: string[];
  readonly performanceScore: number;
  readonly killRatio: number;
  readonly livesLost: number;
  readonly enemyPersistence: number;
}

export const EVIDENCE_WEIGHTS = {
  survival: 0.4,
  killRatio: 0.35,
  persistence: 0.25,
};

export const EVIDENCE_THRESHOLDS = {
  emergencyLifeLoss: 3,
  lowPersistence: 0.22,
  highPersistence: 0.4,
  strongIncreaseScore: 0.9,
  increaseScore: 0.78,
  targetRangeScore: 0.55,
  decreaseScore: 0.42,
  highKillRatio: 0.75,
  lowKillRatio: 0.5,
};


export function resolveKillRatio(performance: WavePerformance): number {
  const kills = Object.values(performance.killsByType).reduce(
    (total, count) => total + count,
    0,
  );

  if (performance.enemiesSpawned <= 0) {
    return 0;
  }

  return Math.min(kills / performance.enemiesSpawned, 1);
}

export function resolveSurvivalScore(livesLost: number): number {
  if (livesLost <= 0) {
    return 1;
  }

  if (livesLost === 1) {
    return 0.65;
  }

  if (livesLost === 2) {
    return 0.3;
  }

  return 0;
}

export function resolvePersistenceScore(persistence: number): number {
  const low = EVIDENCE_THRESHOLDS.lowPersistence;
  const high = EVIDENCE_THRESHOLDS.highPersistence;

  if (persistence <= low) {
    return 1;
  }

  if (persistence >= high) {
    return 0;
  }

  return (high - persistence) / (high - low);
}

function buildReasons(
  livesLost: number,
  killRatio: number,
  persistence: number,
): string[] {
  const reasons: string[] = [];

  reasons.push(livesLost === 0 ? "noLivesLost" : "livesLost");

  if (killRatio >= EVIDENCE_THRESHOLDS.highKillRatio) {
    reasons.push("highKillRate");
  } else if (killRatio <= EVIDENCE_THRESHOLDS.lowKillRatio) {
    reasons.push("lowKillRate");
  } else {
    reasons.push("steadyKillRate");
  }

  if (persistence <= EVIDENCE_THRESHOLDS.lowPersistence) {
    reasons.push("fastClearing");
  } else if (persistence >= EVIDENCE_THRESHOLDS.highPersistence) {
    reasons.push("slowClearing");
  } else {
    reasons.push("steadyClearing");
  }

  return reasons;
}

function bandScore(score: number): EvidenceClass {
  if (score >= EVIDENCE_THRESHOLDS.strongIncreaseScore) {
    return "strongIncrease";
  }

  if (score >= EVIDENCE_THRESHOLDS.increaseScore) {
    return "increase";
  }

  if (score >= EVIDENCE_THRESHOLDS.targetRangeScore) {
    return "targetRange";
  }

  if (score >= EVIDENCE_THRESHOLDS.decreaseScore) {
    return "decrease";
  }

  return "strongDecrease";
}

export function classifyPerformance(
  performance: WavePerformance,
): EvidenceResult {
  const killRatio = resolveKillRatio(performance);
  const livesLost = performance.livesLost;
  const persistence = performance.enemyPersistence;

  const reasons = buildReasons(livesLost, killRatio, persistence);

  const performanceScore =
    resolveSurvivalScore(livesLost) * EVIDENCE_WEIGHTS.survival +
    killRatio * EVIDENCE_WEIGHTS.killRatio +
    resolvePersistenceScore(persistence) * EVIDENCE_WEIGHTS.persistence;

  if (livesLost >= EVIDENCE_THRESHOLDS.emergencyLifeLoss) {
    return {
      evidence: "strongDecrease",
      reasons,
      performanceScore,
      killRatio,
      livesLost,
      enemyPersistence: persistence,
    };
  }

  return {
    evidence: bandScore(performanceScore),
    reasons,
    performanceScore,
    killRatio,
    livesLost,
    enemyPersistence: persistence,
  };
}