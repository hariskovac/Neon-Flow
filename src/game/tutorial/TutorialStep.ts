import type Phaser from "phaser";

export interface TutorialContext {
  readonly scene: Phaser.Scene;
  readonly stepStartedAt: number;
  readonly now: number;
}

export interface TutorialStep {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly onEnter?: (context: TutorialContext) => void;
  readonly onUpdate?: (context: TutorialContext) => void;
  readonly isComplete: (context: TutorialContext) => boolean;
  readonly onExit?: (context: TutorialContext) => void;
  readonly minimumMs?: number;
}