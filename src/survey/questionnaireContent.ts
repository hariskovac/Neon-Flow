export type ConstructId =
  | "proceduralFairness"
  | "distributiveFairness"
  | "competence"
  | "autonomy"
  | "enjoyment";

export interface ScaleItem {
  readonly id: string;
  readonly construct: ConstructId;
  readonly text: string;
  readonly reversed?: boolean;
}

export const SCALE_ANCHORS = [
  "Strongly disagree",
  "Disagree",
  "Somewhat disagree",
  "Neither agree nor disagree",
  "Somewhat agree",
  "Agree",
  "Strongly agree",
];

export const SCALE_MIN = 1;
export const SCALE_MAX = 7;

export const QUESTIONNAIRE_INTRO =
  "Thinking about the game you just played, please indicate how much you " +
  "agree or disagree with each statement. There are no right or wrong " +
  "answers. Please answer based on your own experience of the game.";

export const SCALE_ITEMS: ScaleItem[] = [
  {
    id: "E1",
    construct: "enjoyment",
    text: "I enjoyed playing the game.",
  },
  {
    id: "PF1",
    construct: "proceduralFairness",
    text: "The process the game used to decide when to adjust difficulty was fair.",
  },
  {
    id: "C1",
    construct: "competence",
    text: "I felt competent while playing the game.",
  },
  {
    id: "DF1",
    construct: "distributiveFairness",
    text: "The difficulty I experienced was appropriate for how I was performing.",
  },
  {
    id: "A1",
    construct: "autonomy",
    text: "I experienced a sense of freedom in how I played the game.",
  },
  {
    id: "E2",
    construct: "enjoyment",
    text: "Playing the game was fun.",
  },
  {
    id: "PF2",
    construct: "proceduralFairness",
    text: "The process used to adjust the game's difficulty seemed reasonable.",
  },
  {
    id: "DF2",
    construct: "distributiveFairness",
    text: "The amount of challenge I faced matched how well I was playing.",
  },
  {
    id: "A2",
    construct: "autonomy",
    text: "I felt free to choose how I responded to the challenges in the game.",
  },
  {
    id: "C2",
    construct: "competence",
    text: "I felt capable and effective while playing the game.",
  },
  {
    id: "DF3",
    construct: "distributiveFairness",
    text: "The difficulty changes I received were appropriate given my performance.",
  },
  {
    id: "E3",
    construct: "enjoyment",
    text: "I found the game interesting.",
  },
  {
    id: "PF3",
    construct: "proceduralFairness",
    text: "The game seemed consistent in how it adjusted its difficulty.",
  },
  {
    id: "C3",
    construct: "competence",
    text: "My ability to play the game felt well matched to its challenges.",
  },
  {
    id: "A3",
    construct: "autonomy",
    text: "I was able to play the game in ways that interested me.",
  },
  {
    id: "E4",
    construct: "enjoyment",
    text: "I found playing the game very enjoyable.",
  },
  {
    id: "DF4",
    construct: "distributiveFairness",
    text: "Overall, the difficulty level I received was fair given how I performed.",
  },
  {
    id: "PF4",
    construct: "proceduralFairness",
    text: "The game appeared to base its difficulty decisions on appropriate information about my performance.",
  },
];

export const MANIPULATION_CHECK_ITEMS: ScaleItem[] = [
  {
    id: "M1",
    construct: "proceduralFairness",
    text: "I could tell when the game's difficulty changed.",
  },
  {
    id: "M2",
    construct: "proceduralFairness",
    text: "I understood what aspects of the game changed when its difficulty changed.",
  },
  {
    id: "M3",
    construct: "proceduralFairness",
    text: "I understood why the game changed its difficulty.",
  },
];

export const TRANSPARENCY_ITEMS: ScaleItem[] = [
  {
    id: "T1",
    construct: "proceduralFairness",
    text: "The between-wave difficulty information was easy to understand.",
  },
  {
    // reverse-scored: agreement indicates a worse outcome
    id: "T2",
    construct: "proceduralFairness",
    text: "The between-wave difficulty information distracted me from the game.",
    reversed: true,
  },
  {
    id: "T3",
    construct: "proceduralFairness",
    text: "I had enough time to read and understand the between-wave difficulty information.",
  },
];

export interface ChoiceQuestion {
  readonly id: string;
  readonly text: string;
  readonly options: string[];
}

export const BACKGROUND_QUESTIONS: ChoiceQuestion[] = [
  {
    id: "playFrequency",
    text: "How often do you typically play video games?",
    options: [
      "Never",
      "Less than once a month",
      "A few times a month",
      "About once a week",
      "Several days a week",
      "Daily or almost daily",
    ],
  },
  {
    id: "inputMethod",
    text: "Which input method do you most commonly use when playing video games?",
    options: [
      "Mouse and keyboard",
      "Game controller",
      "Touchscreen or mobile controls",
      "I do not regularly play video games",
      "Other",
    ],
  },
];

export const EXPERIENCE_ITEM = {
  id: "actionExperience",
  text: "How experienced are you with fast-paced action or shooter games using a mouse and keyboard?",
  anchors: ["Not at all experienced", "Extremely experienced"],
};