import Phaser from "phaser";

import { audio } from "../audio/AudioSystem";
import {
  ARENA,
  DEPTH,
  HUD_TEXT_STYLE,
  PALETTE,
} from "../game/gameplayConfig";

export class AudioControls {
  private static readonly BUTTON_WIDTH = 132;
  private static readonly BUTTON_HEIGHT = 32;
  private static readonly GAP = 12;

  private readonly musicLabel: Phaser.GameObjects.Text;
  private readonly sfxLabel: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene) {
    const centerY = ARENA.y + ARENA.height + 30;
    const left = ARENA.x + 12;

    this.musicLabel = this.addButton(
      scene,
      left,
      centerY,
      () => {
        audio.setMusicEnabled(!audio.isMusicEnabled());
        this.refresh();
      },
    );

    this.sfxLabel = this.addButton(
      scene,
      left + AudioControls.BUTTON_WIDTH + AudioControls.GAP,
      centerY,
      () => {
        audio.setSfxEnabled(!audio.isSfxEnabled());
        this.refresh();
      },
    );

    this.refresh();
  }

  private addButton(
    scene: Phaser.Scene,
    x: number,
    centerY: number,
    onClick: () => void,
  ): Phaser.GameObjects.Text {
    const box = scene.add.rectangle(
      x + AudioControls.BUTTON_WIDTH / 2,
      centerY,
      AudioControls.BUTTON_WIDTH,
      AudioControls.BUTTON_HEIGHT,
      PALETTE.arenaFloor,
    );

    box.setStrokeStyle(2, PALETTE.arenaBorder);
    box.setDepth(DEPTH.hud);
    box.setInteractive({ useHandCursor: true });
    box.on("pointerdown", onClick);

    const label = scene.add.text(
      x + AudioControls.BUTTON_WIDTH / 2,
      centerY,
      "",
      { ...HUD_TEXT_STYLE, fontSize: "15px" },
    );

    label.setOrigin(0.5, 0.5);
    label.setDepth(DEPTH.hud);

    return label;
  }

  public refresh(): void {
    this.musicLabel.setText(`Music: ${audio.isMusicEnabled() ? "On" : "Off"}`);
    this.musicLabel.setColor(
      audio.isMusicEnabled() ? PALETTE.textAccent : PALETTE.textMuted,
    );

    this.sfxLabel.setText(`SFX: ${audio.isSfxEnabled() ? "On" : "Off"}`);
    this.sfxLabel.setColor(
      audio.isSfxEnabled() ? PALETTE.textAccent : PALETTE.textMuted,
    );
  }
}