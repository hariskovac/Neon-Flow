import Phaser from "phaser";

import {
  CANVAS,
  DEPTH,
  HUD_BAND_HEIGHT,
  HUD_TEXT_STYLE,
  PALETTE,
  WAVE_CONFIG,
} from "../gameplayConfig";

export interface HudState {
  readonly score: number;
  readonly livesRemaining: number;
  readonly waveNumber: number;
  readonly remainingMs: number;
  readonly isIntermission: boolean;
  readonly isCalibration: boolean;
}

export interface HudState {
  readonly score: number;
  readonly livesRemaining: number;
  readonly waveNumber: number;
  readonly remainingMs: number;
  readonly isIntermission: boolean;
  readonly isCalibration: boolean;
  readonly isTutorial: boolean;
}

export class HudSystem {
  private static readonly EDGE_PADDING = 24;
  private static readonly PIP_WIDTH = 18;
  private static readonly PIP_HEIGHT = 8;
  private static readonly PIP_GAP = 6;
  private static readonly WAVE_LABEL_RIGHT = CANVAS.width / 2 - 250;
  private static readonly WAVE_PIP_LEFT = CANVAS.width / 2 - 238;
  private static readonly TIMER_CENTER_X = CANVAS.width / 2;

  private readonly scoreLabel: Phaser.GameObjects.Text;
  private readonly livesLabel: Phaser.GameObjects.Text; 
  private readonly waveLabel: Phaser.GameObjects.Text;
  private readonly timerLabel: Phaser.GameObjects.Text;
  private readonly unlimitedLabel: Phaser.GameObjects.Text;
  private readonly lifePips: Phaser.GameObjects.Rectangle[] = [];
  private readonly wavePips: Phaser.GameObjects.Rectangle[] = [];

  private lastScore = 0;
  private lastLivesRemaining = 0;
  private hasRendered = false;
  private lastWaveNumber = 0;
  private lastTimerText = "";

  public constructor(scene: Phaser.Scene, startingLives: number) {
    const centerY = HUD_BAND_HEIGHT / 2;

    this.scoreLabel = scene.add.text(
      HudSystem.EDGE_PADDING,
      centerY,
      "Score 0",
      HUD_TEXT_STYLE,
    );

    this.scoreLabel.setOrigin(0, 0.5);
    this.scoreLabel.setDepth(DEPTH.hud);

    this.waveLabel = scene.add.text(
      HudSystem.WAVE_LABEL_RIGHT,
      centerY,
      "Wave",
      { ...HUD_TEXT_STYLE, color: PALETTE.hudMuted },
    );

    this.waveLabel.setOrigin(1, 0.5);
    this.waveLabel.setDepth(DEPTH.hud);

    this.unlimitedLabel = scene.add.text(
      CANVAS.width - HudSystem.EDGE_PADDING,
      centerY,
      "Unlimited",
      { ...HUD_TEXT_STYLE, fontSize: "24px", color: PALETTE.textAccent },
    );

    this.unlimitedLabel.setOrigin(1, 0.5);
    this.unlimitedLabel.setDepth(DEPTH.hud);
    this.unlimitedLabel.setVisible(false);

    this.buildPips(
      scene,
      HudSystem.WAVE_PIP_LEFT,
      centerY,
      WAVE_CONFIG.totalWaves,
      this.wavePips,
    );

    this.timerLabel = scene.add.text(
      HudSystem.TIMER_CENTER_X,
      centerY,
      "",
      HUD_TEXT_STYLE,
    );

    this.timerLabel.setOrigin(0.5, 0.5);
    this.timerLabel.setDepth(DEPTH.hud);

    const pipWidth =
      startingLives * HudSystem.PIP_WIDTH +
      (startingLives - 1) * HudSystem.PIP_GAP;

    const pipLeft = CANVAS.width - HudSystem.EDGE_PADDING - pipWidth;

    this.buildPips(scene, pipLeft, centerY, startingLives, this.lifePips);

    this.livesLabel = scene.add.text(pipLeft - 12, centerY, "Lives", {
      ...HUD_TEXT_STYLE,
      color: PALETTE.hudMuted,
    });

    this.livesLabel.setOrigin(1, 0.5);
    this.livesLabel.setDepth(DEPTH.hud);

    this.update({
      isCalibration: false,
      score: 0,
      livesRemaining: startingLives,
      waveNumber: 1,
      remainingMs: WAVE_CONFIG.durationMs,
      isIntermission: false,
      isTutorial: false
    });
  }

  public update(state: HudState): void {
    const isFirstUpdate = !this.hasRendered;

    const showWaves = !state.isCalibration && !state.isTutorial

    this.waveLabel.setVisible(showWaves);

    for (const pip of this.wavePips) {
      pip.setVisible(showWaves);
    }

    if (isFirstUpdate || state.score !== this.lastScore) {
      this.scoreLabel.setText(`Score ${String(state.score)}`);
      this.lastScore = state.score;
    }

    this.unlimitedLabel.setVisible(state.isTutorial);

    for (const pip of this.lifePips) {
      pip.setVisible(!state.isTutorial);
    }

    if (isFirstUpdate || state.score !== this.lastScore) {
      this.scoreLabel.setText(`Score ${String(state.score)}`);
      this.lastScore = state.score;
    }

    if (isFirstUpdate || state.livesRemaining !== this.lastLivesRemaining) {
      this.fillPips(this.lifePips, state.livesRemaining);
      this.lastLivesRemaining = state.livesRemaining;
    }

    if (isFirstUpdate || state.waveNumber !== this.lastWaveNumber) {
      this.fillPips(this.wavePips, state.waveNumber);
      this.lastWaveNumber = state.waveNumber;
    }

    if (state.isTutorial) {
      this.timerLabel.setVisible(false);
    } else {
      this.timerLabel.setVisible(true);

      const seconds = Math.ceil(Math.max(state.remainingMs, 0) / 1000);

      const timerText = state.isIntermission
        ? `Next wave in ${String(seconds)} s`
        : `Time ${String(seconds)} s`;

      if (isFirstUpdate || timerText !== this.lastTimerText) {
        this.timerLabel.setText(timerText);
        this.lastTimerText = timerText;
      }
    }

    this.hasRendered = true;
  }

  private buildPips(
    scene: Phaser.Scene,
    left: number,
    centerY: number,
    count: number,
    target: Phaser.GameObjects.Rectangle[],
  ): void {
    for (let index = 0; index < count; index += 1) {
      const pip = scene.add.rectangle(
        left +
          index * (HudSystem.PIP_WIDTH + HudSystem.PIP_GAP) +
          HudSystem.PIP_WIDTH / 2,
        centerY,
        HudSystem.PIP_WIDTH,
        HudSystem.PIP_HEIGHT,
        PALETTE.pipFilled,
      );

      pip.setDepth(DEPTH.hud);

      target.push(pip);
    }
  }

  private fillPips(
    pips: Phaser.GameObjects.Rectangle[],
    filledCount: number,
  ): void {
    pips.forEach((pip, index) => {
      pip.setFillStyle(
        index < filledCount ? PALETTE.pipFilled : PALETTE.pipEmpty,
      );
    });
  }
}