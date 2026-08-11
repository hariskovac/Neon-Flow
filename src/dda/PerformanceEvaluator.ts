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
  readonly killRatio: number;
  readonly livesLost: number;
  readonly enemiesRemaining: number;
}

export const EVIDENCE_THRESHOLDS = {
  strongKillRatio: 0.85,
  goodKillRatio: 0.7,
  weakKillRatio: 0.45,
  poorKillRatio: 0.3,
  heavyLifeLoss: 3,
  moderateLifeLoss: 1,
  highRemainingEnemies: 12,
  lowRemainingEnemies: 3,
};

export function resolveKillRatio(performance: WavePerformance): number {
  const kills =
    performance.killsByType.chaser +
    performance.killsByType.ranged +
    performance.killsByType.dasher;

  if (performance.enemiesSpawned <= 0) {
    return 0;
  }

  return Math.min(kills / performance.enemiesSpawned, 1);
}

export function classifyPerformance(
  performance: WavePerformance,
): EvidenceResult {
  const killRatio = resolveKillRatio(performance);
  const livesLost = performance.livesLost;
  const enemiesRemaining = performance.enemiesRemaining;
  const reasons: string[] = [];

  // heavy life loss overrides other evidence
  if (livesLost >= EVIDENCE_THRESHOLDS.heavyLifeLoss) {
    reasons.push("livesLost");

    return {
      evidence: "strongDecrease",
      reasons,
      killRatio,
      livesLost,
      enemiesRemaining,
    };
  }

  if (livesLost >= EVIDENCE_THRESHOLDS.moderateLifeLoss) {
    reasons.push("livesLost");

    // losing a life + clearing arena is evidence of a fair fight
    if (killRatio >= EVIDENCE_THRESHOLDS.goodKillRatio) {
      reasons.push("killRate");

      return {
        evidence: "targetRange",
        reasons,
        killRatio,
        livesLost,
        enemiesRemaining,
      };
    }

    return {
      evidence: "decrease",
      reasons,
      killRatio,
      livesLost,
      enemiesRemaining,
    };
  }

  if (killRatio >= EVIDENCE_THRESHOLDS.strongKillRatio) {
    reasons.push("killRate");
    reasons.push("noLivesLost");

    return {
      evidence: "strongIncrease",
      reasons,
      killRatio,
      livesLost,
      enemiesRemaining,
    };
  }

  if (killRatio >= EVIDENCE_THRESHOLDS.goodKillRatio) {
    reasons.push("killRate");

    return {
      evidence: "increase",
      reasons,
      killRatio,
      livesLost,
      enemiesRemaining,
    };
  }

  if (killRatio < EVIDENCE_THRESHOLDS.poorKillRatio) {
    reasons.push("killRate");

    return {
      evidence: "decrease",
      reasons,
      killRatio,
      livesLost,
      enemiesRemaining,
    };
  }

  // enemies left are a tiebreak
  if (
    killRatio < EVIDENCE_THRESHOLDS.weakKillRatio &&
    enemiesRemaining >= EVIDENCE_THRESHOLDS.highRemainingEnemies
  ) {
    reasons.push("enemiesRemaining");

    return {
      evidence: "decrease",
      reasons,
      killRatio,
      livesLost,
      enemiesRemaining,
    };
  }

  if (enemiesRemaining <= EVIDENCE_THRESHOLDS.lowRemainingEnemies) {
    reasons.push("enemiesRemaining");

    return {
      evidence: "increase",
      reasons,
      killRatio,
      livesLost,
      enemiesRemaining,
    };
  }

  reasons.push("killRate");

  return {
    evidence: "targetRange",
    reasons,
    killRatio,
    livesLost,
    enemiesRemaining,
  };
}