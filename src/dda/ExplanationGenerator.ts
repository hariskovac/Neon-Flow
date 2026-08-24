import type { DifficultyDirection } from "./DifficultyController";
import type { ActuatorKey, ParameterChange } from "./ParameterChanges";
import { MAX_DIFFICULTY_LEVEL, resolveActuatorPressure } from "./DifficultyConfig";
import { ACTUATOR_KEYS, resolveParameterChanges } from "./ParameterChanges";

export interface ParameterLine {
  readonly parameter: ActuatorKey;
  readonly label: string;
  readonly direction: "up" | "down" | "unchanged";
  readonly previousPressure: number;
  readonly nextPressure: number;
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
  { rising: string; falling: string; unchanged: string; labelRisesWithValue: boolean }
> = {
  spawnIntervalMs: {
    rising: "Enemies spawn more often",
    falling: "Enemies spawn less often",
    unchanged: "Enemy spawn rate unchanged",
    labelRisesWithValue: false,
  },
  enemySpeedMultiplier: {
    rising: "Enemies move faster",
    falling: "Enemies move slower",
    unchanged: "Enemy speed unchanged",
    labelRisesWithValue: true,
  },
  spawnIntensity: {
    rising: "Enemy group size increased",
    falling: "Enemies group size decreased",
    unchanged: "Enemy group size unchanged",
    labelRisesWithValue: true,
  },
  powerUpDropChance: {
    rising: "Power-ups become scarcer",
    falling: "Power-ups are more common",
    unchanged: "Power-up scarcity unchanged",
    labelRisesWithValue: false,
  },
};

const REASON_PHRASES: Record<string, string> = {
  highKillRate: "High kill rate",
  steadyKillRate: "Steady kill rate",
  lowKillRate: "Low kill rate",
  livesLost: "Lives lost",
  noLivesLost: "No lives lost",
  fastClearing: "Enemies cleared quickly",
  steadyClearing: "Enemies cleared steadily",
  slowClearing: "Enemies cleared slowly",
};

const REASON_VALENCE: Record<string, "positive" | "negative"> = {
  noLivesLost: "positive",
  highKillRate: "positive",
  fastClearing: "positive",
  livesLost: "negative",
  lowKillRate: "negative",
  slowClearing: "negative",
};

function selectReasons(
  reasons: string[],
  direction: DifficultyDirection,
): string[] {
  if (direction === "unchanged") {
    return reasons;
  }

  const contradicts = direction === "increase" ? "negative" : "positive";

  const consistent = reasons.filter(
    (reason) => REASON_VALENCE[reason] !== contradicts,
  );

  const hasDirectional = consistent.some(
    (reason) => REASON_VALENCE[reason] !== undefined,
  );

  if (hasDirectional) {
    return consistent;
  }

  return reasons.filter((reason) => REASON_VALENCE[reason] === undefined);
}

function buildReasonText(reasons: string[]): string {
  return reasons
    .map((reason) => REASON_PHRASES[reason])
    .filter((phrase): phrase is string => phrase !== undefined)
    .join("  \u2022  ");
}

function buildChangeLines(
  previousLevel: number,
  nextLevel: number,
  changes: ParameterChange[],
): ParameterLine[] {
  const lines: ParameterLine[] = [];

  for (const parameter of ACTUATOR_KEYS) {
    const wording = PARAMETER_WORDING[parameter];
    const change = changes.find((entry) => entry.parameter === parameter);

    const previousPressure = resolveActuatorPressure(parameter, previousLevel);
    const nextPressure = resolveActuatorPressure(parameter, nextLevel);

    if (change === undefined) {
      lines.push({
        parameter,
        label: wording.unchanged,
        direction: "unchanged",
        previousPressure,
        nextPressure,
      });

      continue;
    }

    const valueRose = change.nextValue > change.previousValue;
    const labelRises = valueRose === wording.labelRisesWithValue;

    lines.push({
      parameter,
      label: labelRises ? wording.rising : wording.falling,
      direction: labelRises ? "up" : "down",
      previousPressure,
      nextPressure,
    });
  }

  return lines;
}

export function generateExplanation(
  direction: DifficultyDirection,
  previousLevel: number,
  nextLevel: number,
  changes: ParameterChange[],
  reasons: string[],
): Explanation {
  const reasonText = buildReasonText(selectReasons(reasons, direction));

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
    changeLines: buildChangeLines(previousLevel, nextLevel, changes),
    reasonText,
    footer: null,
  };
}

export function generateCalibrationExplanation(
  startingLevel: number,
  maxStartingLevel: number,
  awaitsKeypress = false,
): Explanation {
  const atCap = startingLevel >= maxStartingLevel;

  const note = atCap
    ? "Difficulty may continue to increase during play."
    : "Based on your calibration performance.";

  return {
    headline: "Calibration complete",
    levelLabel: "Starting threat level",
    levelValue: `${String(startingLevel)} / ${String(MAX_DIFFICULTY_LEVEL)}`,
    note: atCap ? "Highest possible starting level" : null,
    changeLines: [],
    reasonText: "",
    footer: awaitsKeypress ? `${note} Press SPACE to continue.` : note,
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

export function generateExampleExplanation(): Explanation {
  return {
    headline: "Threat level increased",
    levelLabel: null,
    levelValue: "3 \u2192 4",
    note: null,
    changeLines: buildChangeLines(3, 4, resolveParameterChanges(3, 4)),
    reasonText: "Example only",
    footer: "Press SPACE to begin.",
  };
}

export function flattenExplanation(explanation: Explanation): string {
  const parts: string[] = [explanation.headline];

  if (explanation.levelValue !== "") parts.push(explanation.levelValue);
  if (explanation.note !== null) parts.push(explanation.note);

  for (const line of explanation.changeLines) {
    parts.push(`${line.direction === "up" ? "up" : "down"}: ${line.label}`);
  }

  if (explanation.reasonText !== "") parts.push(explanation.reasonText);
  if (explanation.footer !== null) parts.push(explanation.footer);

  return parts.join(" | ");
}