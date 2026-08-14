import type { DifficultyDirection } from "./DifficultyController";
import type { ActuatorKey, ParameterChange } from "./ParameterChanges";
import { MAX_DIFFICULTY_LEVEL } from "./DifficultyConfig";

export interface ParameterLine {
  readonly label: string;
  readonly direction: "up" | "down";
}

export interface Explanation {
  readonly headline: string;
  readonly levelLabel: string | null;
  readonly levelValue: string;
  readonly note: string | null;
  readonly changeLines: ParameterLine[];
  readonly reasonText: string;
  readonly footer: string | null;
}

const PARAMETER_WORDING: Record<
  ActuatorKey,
  { rising: string; falling: string; labelRisesWithValue: boolean }
> = {
  spawnIntervalMs: {
    rising: "Enemies spawn more often",
    falling: "Enemies spawn less often",
    labelRisesWithValue: false,
  },
  enemySpeedMultiplier: {
    rising: "Enemies move faster",
    falling: "Enemies move slower",
    labelRisesWithValue: true,
  },
  rangedAttackIntervalMs: {
    rising: "Ranged enemies fire more often",
    falling: "Ranged enemies fire less often",
    labelRisesWithValue: false,
  },
  powerUpDropChance: {
    rising: "Power-ups appear more often",
    falling: "Power-ups appear less often",
    labelRisesWithValue: true,
  },
};

const REASON_PHRASES: Record<string, string> = {
  highKillRate: "High kill rate",
  steadyKillRate: "Steady kill rate",
  lowKillRate: "Low kill rate",
  livesLost: "Lives lost",
  noLivesLost: "No lives lost",
  highEnemiesRemaining: "Many enemies left",
  lowEnemiesRemaining: "Few enemies left",
};

function buildReasonText(reasons: string[]): string {
  return reasons
    .map((reason) => REASON_PHRASES[reason])
    .filter((phrase): phrase is string => phrase !== undefined)
    .join("  \u2022  ");
}
 
function buildChangeLines(changes: ParameterChange[]): ParameterLine[] {
  return changes.map((change) => {
    const wording = PARAMETER_WORDING[change.parameter];
    const valueRose = change.nextValue > change.previousValue;
    const labelRises = valueRose === wording.labelRisesWithValue;
 
    return {
      label: labelRises ? wording.rising : wording.falling,
      direction: labelRises ? "up" : "down",
    };
  });
}

export function generateExplanation(
  direction: DifficultyDirection,
  previousLevel: number,
  nextLevel: number,
  changes: ParameterChange[],
  reasons: string[],
): Explanation {
  const reasonText = buildReasonText(reasons);

  if (direction === "unchanged" || changes.length === 0) {
    return {
      headline: "Threat level unchanged",
      levelLabel: null,
      levelValue: `${String(nextLevel)} / ${String(MAX_DIFFICULTY_LEVEL)}`,
      note: null,
      changeLines: [],
      reasonText,
      footer: null,
    };
  }

  return {
    headline:
      direction === "increase"
        ? "Threat level increased"
        : "Threat level reduced",
    levelLabel: null,
    levelValue: `${String(previousLevel)} \u2192 ${String(nextLevel)}`,
    note: null,
    changeLines: buildChangeLines(changes),
    reasonText,
    footer: null,
  };
}

export function generateCalibrationExplanation(
  startingLevel: number,
  maxStartingLevel: number,
): Explanation {
  const atCap = startingLevel >= maxStartingLevel;
 
  return {
    headline: "Calibration complete",
    levelLabel: "Starting threat level",
    levelValue: `${String(startingLevel)} / ${String(MAX_DIFFICULTY_LEVEL)}`,
    note: atCap ? "Highest possible starting level" : null,
    changeLines: [],
    reasonText: "",
    footer: atCap
      ? "Difficulty may continue to increase during play."
      : "Based on your calibration performance.",
  };
}

export function generateNeutralExplanation(
  beforeFirstWave: boolean,
): Explanation {
  if (beforeFirstWave) {
    return {
      headline: "Get ready",
      levelLabel: null,
      levelValue: "",
      note: null,
      changeLines: [],
      reasonText: "",
      footer: "The first wave begins shortly.",
    };
  }
 
  return {
    headline: "Wave complete",
    levelLabel: null,
    levelValue: "",
    note: null,
    changeLines: [],
    reasonText: "",
    footer: "Prepare for the next wave.",
  };
}

export function flattenExplanation(explanation: Explanation): string {
  const parts: string[] = [explanation.headline];
 
  if (explanation.levelValue !== "") {
    parts.push(explanation.levelValue);
  }
 
  if (explanation.note !== null) {
    parts.push(explanation.note);
  }
 
  for (const line of explanation.changeLines) {
    parts.push(`${line.direction === "up" ? "up" : "down"}: ${line.label}`);
  }
 
  if (explanation.reasonText !== "") {
    parts.push(explanation.reasonText);
  }
 
  if (explanation.footer !== null) {
    parts.push(explanation.footer);
  }
 
  return parts.join(" | ");
}
