import type { WavePerformance } from "../types/game";
import { STABILITY_CONFIG, clampLevel } from "./DifficultyConfig";
import type { EvidenceClass } from "./PerformanceEvaluator";
import { classifyPerformance } from "./PerformanceEvaluator";
import type { Explanation } from "./ExplanationGenerator";
import { generateExplanation } from "./ExplanationGenerator";
import type { ParameterChange } from "./ParameterChanges";
import { resolveParameterChanges } from "./ParameterChanges";


export type DifficultyDirection = "increase" | "decrease" | "unchanged";

export interface DifficultyDecision {
  readonly waveNumber: number;
  readonly previousLevel: number;
  readonly nextLevel: number;
  readonly direction: DifficultyDirection;
  readonly evidence: EvidenceClass;
  readonly reasons: string[];
  readonly suppressedByHysteresis: boolean;
  readonly parameterChanges: ParameterChange[];
  readonly explanation: Explanation;
}

function resolveDirection(evidence: EvidenceClass): DifficultyDirection {
  if (evidence === "strongIncrease" || evidence === "increase") {
    return "increase";
  }

  if (evidence === "strongDecrease" || evidence === "decrease") {
    return "decrease";
  }

  return "unchanged";
}

function isStrongEvidence(evidence: EvidenceClass): boolean {
  return evidence === "strongIncrease" || evidence === "strongDecrease";
}

export class DifficultyController {
  private level: number;
  private lastDirection: DifficultyDirection = "unchanged";
  private wavesEvaluated = 0;

  public constructor(startingLevel: number) {
    this.level = clampLevel(startingLevel);
  }

  public getLevel(): number {
    return this.level;
  }

  public getWavesEvaluated(): number {
    return this.wavesEvaluated;
  }

  public evaluate(performance: WavePerformance): DifficultyDecision {
    const previousLevel = this.level;
    const result = classifyPerformance(performance);
    const desired = resolveDirection(result.evidence);
    const strong = isStrongEvidence(result.evidence);

    let suppressedByHysteresis = false;
    let nextLevel = previousLevel;

    if (desired !== "unchanged") {
      const reverses =
        this.lastDirection !== "unchanged" && desired !== this.lastDirection;

      if (reverses && !strong) {
        suppressedByHysteresis = true;
      } else {
        const step = this.resolveStep(strong);
        const delta = desired === "increase" ? step : -step;

        nextLevel = clampLevel(previousLevel + delta);
      }
    }

    let direction: DifficultyDirection = "unchanged";

    if (nextLevel > previousLevel) {
      direction = "increase";
    } else if (nextLevel < previousLevel) {
      direction = "decrease";
    }

    this.level = nextLevel;
    this.lastDirection = direction;
    this.wavesEvaluated += 1;

    const parameterChanges = resolveParameterChanges(previousLevel, nextLevel);

    return {
      waveNumber: performance.waveNumber,
      previousLevel,
      nextLevel,
      direction,
      evidence: result.evidence,
      reasons: result.reasons,
      suppressedByHysteresis,
      parameterChanges,
      explanation: generateExplanation(
        direction,
        previousLevel,
        nextLevel,
        parameterChanges,
        result.reasons,
      ),
    };
  }

  private resolveStep(strong: boolean): number {
    if (strong && this.wavesEvaluated < STABILITY_CONFIG.earlyCorrectionWaves) {
      return STABILITY_CONFIG.earlyMaxStep;
    }

    return STABILITY_CONFIG.normalMaxStep;
  }
}