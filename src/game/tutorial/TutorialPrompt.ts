import Phaser from "phaser";

import {
  ARENA,
  DEPTH,
  HUD_TEXT_STYLE,
  PALETTE,
} from "../gameplayConfig";

export class TutorialPrompt {
  private static readonly PANEL_WIDTH = 560;
  private static readonly PANEL_HEIGHT = 92;

  private readonly container: Phaser.GameObjects.Container;
  private readonly titleLabel: Phaser.GameObjects.Text;
  private readonly bodyLabel: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene) {
    const panel = scene.add.rectangle(
      0,
      0,
      TutorialPrompt.PANEL_WIDTH,
      TutorialPrompt.PANEL_HEIGHT,
      PALETTE.arenaFloor,
      PALETTE.fillAlpha,
    );

    panel.setStrokeStyle(2, PALETTE.arenaBorder);

    this.titleLabel = scene.add.text(0, -24, "", {
      ...HUD_TEXT_STYLE,
      fontSize: "19px",
      color: PALETTE.textAccent,
      align: "center",
    });

    this.titleLabel.setOrigin(0.5, 0.5);

    this.bodyLabel = scene.add.text(0, 12, "", {
      ...HUD_TEXT_STYLE,
      fontSize: "15px",
      color: PALETTE.textPrimary,
      align: "center",
      wordWrap: { width: TutorialPrompt.PANEL_WIDTH - 48 },
    });

    this.bodyLabel.setOrigin(0.5, 0.5);

    this.container = scene.add.container(
      ARENA.x + ARENA.width / 2,
      ARENA.y + 70,
      [panel, this.titleLabel, this.bodyLabel],
    );

    this.container.setDepth(DEPTH.overlay);
  }

  public show(title: string, body: string): void {
    this.titleLabel.setText(title);
    this.bodyLabel.setText(body);
    this.container.setVisible(true);
  }

  public hide(): void {
    this.container.setVisible(false);
  }
}