import Phaser from "phaser";

import {
  ARENA,
  DEPTH,
  HUD_TEXT_STYLE,
  PALETTE,
} from "../gameplayConfig";

export class TutorialPrompt {
  private static readonly PANEL_WIDTH = 640;
  private static readonly PADDING = 22;
  private static readonly TITLE_GAP = 10;
  private static readonly TOP_MARGIN = 28;

  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly container: Phaser.GameObjects.Container;
  private readonly titleLabel: Phaser.GameObjects.Text;
  private readonly bodyLabel: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene) {
    this.panel = scene.add.rectangle(
      0,
      0,
      TutorialPrompt.PANEL_WIDTH,
      100,
      PALETTE.arenaFloor, 
      PALETTE.fillAlpha,
    );

    this.panel.setStrokeStyle(2, PALETTE.arenaBorder);

    this.titleLabel = scene.add.text(0, 0, "", {
      ...HUD_TEXT_STYLE,
      fontSize: "24px",
      color: PALETTE.textAccent,
      align: "center",
      wordWrap: { width: TutorialPrompt.PANEL_WIDTH - TutorialPrompt.PADDING * 2 },
    });

    this.titleLabel.setOrigin(0.5, 0);

    this.bodyLabel = scene.add.text(0, 0, "", {
      ...HUD_TEXT_STYLE,
      fontSize: "22px",
      color: PALETTE.textPrimary,
      align: "center",
      wordWrap: { width: TutorialPrompt.PANEL_WIDTH - TutorialPrompt.PADDING * 2 },
    });

    this.bodyLabel.setOrigin(0.5, 0);

    this.container = scene.add.container(
      ARENA.x + ARENA.width / 2,
      ARENA.y + TutorialPrompt.TOP_MARGIN,
      [this.panel, this.titleLabel, this.bodyLabel],
    );

    this.container.setDepth(DEPTH.overlay);
  }

  public show(title: string, body: string): void {
    this.titleLabel.setText(title);
    this.bodyLabel.setText(body);

    const contentHeight = this.titleLabel.height + TutorialPrompt.TITLE_GAP + this.bodyLabel.height;

    const panelHeight = contentHeight + TutorialPrompt.PADDING * 2;

    this.panel.setSize(TutorialPrompt.PANEL_WIDTH, panelHeight);

    this.panel.setPosition(0, panelHeight / 2);

    this.titleLabel.setPosition(0, TutorialPrompt.PADDING);
    this.bodyLabel.setPosition( 0, TutorialPrompt.PADDING + this.titleLabel.height + TutorialPrompt.TITLE_GAP, );

    this.container.setVisible(true);
  }

  public hide(): void {
    this.container.setVisible(false);
  }
}