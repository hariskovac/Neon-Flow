import type { WavePerformance } from "../types/game";
import { clampLevel } from "./difficultyConfig";
import { resolveKillRatio } from "./performanceEvaluator";

export type CalibrationBand =
  | "veryLow"
  | "belowTarget"
  | "target"
  | "strong"
  | "veryStrong";

export interface CalibrationResult {
  readonly band: CalibrationBand;
  readonly startingLevel: number;
  readonly killRatio: number;
  readonly livesLost: number;
  readonly reasons: string[];
}

export const CALIBRATION_THRESHOLDS = {
  veryStrongKillRatio: 0.85,
  strongKillRatio: 0.7,
  targetKillRatio: 0.45,
  belowTargetKillRatio: 0.25,
  heavyLifeLoss: 3,
  moderateLifeLoss: 2,
};

const BAND_LEVELS: Record<CalibrationBand, number> = {
  veryLow: 1,
  belowTarget: 2,
  target: 3,
  strong: 4,
  veryStrong: 5,
};

// level used when no calibration mapping exists
export const DEFAULT_STARTING_LEVEL = BAND_LEVELS.target;

const BAND_ORDER: CalibrationBand[] = [
  "veryLow",
  "belowTarget",
  "target",
  "strong",
  "veryStrong",
];

function lowerBand(a: CalibrationBand, b: CalibrationBand): CalibrationBand {
  return BAND_ORDER.indexOf(a) <= BAND_ORDER.indexOf(b) ? a : b;
}

function resolveKillBand(killRatio: number): CalibrationBand {
  if (killRatio >= CALIBRATION_THRESHOLDS.veryStrongKillRatio) {
    return "veryStrong";
  }

  if (killRatio >= CALIBRATION_THRESHOLDS.strongKillRatio) {
    return "strong";
  }

  if (killRatio >= CALIBRATION_THRESHOLDS.targetKillRatio) {
    return "target";
  }

  if (killRatio >= CALIBRATION_THRESHOLDS.belowTargetKillRatio) {
    return "belowTarget";
  }

  return "veryLow";
}

// maps calibration summary to a starting level
export function mapCalibration(
  performance: WavePerformance | null,
): CalibrationResult {
  if (performance === null) {
    return {
      band: "target",
      startingLevel: DEFAULT_STARTING_LEVEL,
      killRatio: 0,
      livesLost: 0,
      reasons: ["noCalibrationData"],
    };
  }

  const killRatio = resolveKillRatio(performance);
  const livesLost = performance.livesLost;
  const reasons: string[] = ["killRate"];

  let band = resolveKillBand(killRatio);

  if (livesLost >= CALIBRATION_THRESHOLDS.heavyLifeLoss) {
    band = lowerBand(band, "belowTarget");
    reasons.push("livesLost");
  } else if (livesLost >= CALIBRATION_THRESHOLDS.moderateLifeLoss) {
    band = lowerBand(band, "target");
    reasons.push("livesLost");
  }

  return {
    band,
    startingLevel: clampLevel(BAND_LEVELS[band]),
    killRatio,
    livesLost,
    reasons,
  };
}