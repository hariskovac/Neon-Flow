import type { DifficultyDirection } from "./DifficultyController";
import type { ActuatorKey, ParameterChange } from "./ParameterChanges";

export interface ParameterLine {
  readonly label: string;
  readonly direction: "up" | "down";
}

export interface Explanation {
  readonly reasonLine: string;
  readonly headline: string;
  readonly parameterLines: ParameterLine[];
}

const PARAMETER_LABELS: Record<
  ActuatorKey,
  { label: string; labelRisesWithValue: boolean }
> = {
  spawnIntervalMs: { label: "Enemy spawn rate", labelRisesWithValue: false },
  enemySpeedMultiplier: { label: "Enemy speed", labelRisesWithValue: true },
  rangedAttackIntervalMs: { label: "Enemy fire rate", labelRisesWithValue: false },
  powerUpDropChance: { label: "Power-up rate", labelRisesWithValue: true },
};

const REASON_PHRASES: Record<string, string> = {
  killRate: "your kill rate",
  livesLost: "the lives you lost",
  noLivesLost: "that you lost no lives",
  enemiesRemaining: "the enemies left at the end of the wave",
  noCalibrationData: "the standard starting level",
};

function joinPhrases(phrases: string[]): string {
  if (phrases.length === 0) {
    return "";
  }

  if (phrases.length === 1) {
    return phrases[0];
  }

  return `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
}

function buildReasonLine(reasons: string[]): string {
  const phrases = reasons
    .map((reason) => REASON_PHRASES[reason])
    .filter((phrase): phrase is string => phrase !== undefined);

  if (phrases.length === 0) {
    return "";
  }

  return `Based on ${joinPhrases(phrases)} in the previous wave:`;
}

function buildParameterLines(changes: ParameterChange[]): ParameterLine[] {
  return changes.map((change) => {
    const wording = PARAMETER_LABELS[change.parameter];
    const valueRose = change.nextValue > change.previousValue;
    const labelRises = valueRose === wording.labelRisesWithValue;

    return {
      label: wording.label,
      direction: labelRises ? "up" : "down",
    };
  });
}

export function generateExplanation(
  direction: DifficultyDirection,
  changes: ParameterChange[],
  reasons: string[],
): Explanation {
  const reasonLine = buildReasonLine(reasons);

  if (direction === "unchanged" || changes.length === 0) {
    return {
      reasonLine,
      headline: "Threat level unchanged",
      parameterLines: [],
    };
  }

  return {
    reasonLine,
    headline:
      direction === "increase"
        ? "Threat level increased"
        : "Threat level reduced",
    parameterLines: buildParameterLines(changes),
  };
}

export function generateCalibrationExplanation(
  startingLevel: number,
): Explanation {
  return {
    reasonLine: "Based on your calibration round:",
    headline: `Starting threat level ${String(startingLevel)} of 10`,
    parameterLines: [],
  };
}

export function flattenExplanation(explanation: Explanation): string {
  const parts = explanation.parameterLines.map(
    (line) => `${line.label} ${line.direction === "up" ? "up" : "down"}`,
  );

  const changeText = parts.length === 0 ? "" : ` ${parts.join(", ")}.`;
  const reasonText =
    explanation.reasonLine === "" ? "" : `${explanation.reasonLine} `;

  return `${reasonText}${explanation.headline}.${changeText}`;
}