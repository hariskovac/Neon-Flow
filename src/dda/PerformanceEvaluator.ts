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
  const kills = Object.values(performance.killsByType).reduce(
    (total, count) => total + count,
    0,
  );

  if (performance.enemiesSpawned <= 0) {
    return 0;
  }

  return Math.min(kills / performance.enemiesSpawned, 1);
}

export function classifyPerformance(performance: WavePerformance): EvidenceResult {
  const killRatio = resolveKillRatio(performance);
  const livesLost = performance.livesLost;
  const enemiesRemaining = performance.enemiesRemaining;
  const reasons: string[] = [];
 
  if (livesLost >= EVIDENCE_THRESHOLDS.heavyLifeLoss) {
    reasons.push("livesLost");
    return { evidence: "strongDecrease", reasons, killRatio, livesLost, enemiesRemaining };
  }
 
  if (livesLost >= EVIDENCE_THRESHOLDS.moderateLifeLoss) {
    reasons.push("livesLost");
 
    if (killRatio >= EVIDENCE_THRESHOLDS.goodKillRatio) {
      reasons.push("highKillRate");
      return { evidence: "targetRange", reasons, killRatio, livesLost, enemiesRemaining };
    }
 
    return { evidence: "decrease", reasons, killRatio, livesLost, enemiesRemaining };
  }
 
  if (killRatio >= EVIDENCE_THRESHOLDS.strongKillRatio) {
    reasons.push("highKillRate");
    reasons.push("noLivesLost");
    return { evidence: "strongIncrease", reasons, killRatio, livesLost, enemiesRemaining };
  }
 
  if (killRatio >= EVIDENCE_THRESHOLDS.goodKillRatio) {
    reasons.push("highKillRate");
    return { evidence: "increase", reasons, killRatio, livesLost, enemiesRemaining };
  }
 
  if (killRatio < EVIDENCE_THRESHOLDS.poorKillRatio) {
    reasons.push("lowKillRate");
    return { evidence: "decrease", reasons, killRatio, livesLost, enemiesRemaining };
  }
 
  if (
    killRatio < EVIDENCE_THRESHOLDS.weakKillRatio &&
    enemiesRemaining >= EVIDENCE_THRESHOLDS.highRemainingEnemies
  ) {
    reasons.push("highEnemiesRemaining");
    return { evidence: "decrease", reasons, killRatio, livesLost, enemiesRemaining };
  }
 
  if (enemiesRemaining <= EVIDENCE_THRESHOLDS.lowRemainingEnemies) {
    reasons.push("lowEnemiesRemaining");
    return { evidence: "increase", reasons, killRatio, livesLost, enemiesRemaining };
  }
 
  reasons.push("steadyKillRate");
  return { evidence: "targetRange", reasons, killRatio, livesLost, enemiesRemaining };
}
