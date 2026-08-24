import Phaser from "phaser";

import type { Explanation } from "../dda/ExplanationGenerator";
import {
  ARENA,
  DEPTH,
  HUD_TEXT_STYLE,
  PALETTE,
} from "../game/gameplayConfig";
import { PipBar } from "./PipBar";

interface LayoutBlock {
  readonly label: Phaser.GameObjects.Text;
  readonly x: number;
  readonly advance: number;
}

export class TransparencyOverlay {
  private static readonly PANEL_WIDTH = 560;
  private static readonly LABEL_WIDTH = 270;
  private static readonly PADDING = 30;
  private static readonly ROW_HEIGHT = 44;
  private static readonly LEFT_EDGE = -TransparencyOverlay.PANEL_WIDTH / 2 + 34;
  private readonly panel: Phaser.GameObjects.Rectangle;

  private readonly container: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;

  private readonly reasonLabel: Phaser.GameObjects.Text;
  private readonly headlineLabel: Phaser.GameObjects.Text;
  private readonly levelNameLabel: Phaser.GameObjects.Text;
  private readonly levelValueLabel: Phaser.GameObjects.Text;
  private readonly noteLabel: Phaser.GameObjects.Text;
  private readonly changesHeading: Phaser.GameObjects.Text;
  private readonly reasonHeading: Phaser.GameObjects.Text;
  private readonly footerLabel: Phaser.GameObjects.Text;
  private readonly changeRows: Phaser.GameObjects.Text[] = [];
  private readonly changeBars: PipBar[] = [];

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.panel = scene.add.rectangle(
      0,
      0,
      TransparencyOverlay.PANEL_WIDTH,
      200,
      PALETTE.arenaFloor,
      PALETTE.fillAlpha,
    );

    this.panel.setStrokeStyle(2, PALETTE.arenaBorder);

    this.headlineLabel = this.addLabel(scene, "24px", PALETTE.textPrimary, 0.5);
    this.levelNameLabel = this.addLabel(scene, "22px", PALETTE.textMuted, 0.5);
    this.levelValueLabel = this.addLabel(scene, "30px", PALETTE.textAccent, 0.5);
    this.noteLabel = this.addLabel(scene, "18px", PALETTE.textMuted, 0.5);
    this.changesHeading = this.addLabel(scene, "18px", PALETTE.textMuted, 0);
    this.reasonHeading = this.addLabel(scene, "18px", PALETTE.textMuted, 0);
    this.reasonLabel = this.addLabel(scene, "18px", PALETTE.textAccent, 0);
    this.footerLabel = this.addLabel(scene, "18px", PALETTE.textMuted, 0.5);

    this.container = scene.add.container(
      ARENA.x + ARENA.width / 2,
      ARENA.y + ARENA.height / 2,
      [
        this.panel,
        this.headlineLabel,
        this.levelNameLabel,
        this.levelValueLabel,
        this.noteLabel,
        this.changesHeading,
        this.reasonHeading,
        this.reasonLabel,
        this.footerLabel,
      ],
    );

    this.container.setDepth(DEPTH.overlay);
    this.container.setVisible(false);
  }

  private addLabel(
    scene: Phaser.Scene,
    fontSize: string,
    color: string,
    originX: number,
  ): Phaser.GameObjects.Text {
    const label = scene.add.text(0, 0, "", {
      ...HUD_TEXT_STYLE,
      fontSize,
      color: color,
      align: "center",
      wordWrap: { width: TransparencyOverlay.PANEL_WIDTH - 68 },
    });

    label.setOrigin(originX, 0.5);

    return label;
  }

  public show(explanation: Explanation): void {
    const blocks: LayoutBlock[] = [];

    this.hideAll();

    blocks.push(this.block(this.headlineLabel, explanation.headline, 0, 40));

    if (explanation.levelLabel !== null) {
      blocks.push(
        this.block(this.levelNameLabel, explanation.levelLabel, 0, 30),
      );
    }

    if (explanation.levelValue !== "") {
      blocks.push(
        this.block(this.levelValueLabel, explanation.levelValue, 0, 46),
      );
    }

    if (explanation.note !== null) {
      blocks.push(this.block(this.noteLabel, explanation.note, 0, 32));
    }

    if (explanation.changeLines.length > 0) {
      blocks.push(
        this.block(
          this.changesHeading,
          "CHANGES",
          TransparencyOverlay.LEFT_EDGE,
          30,
        ),
      );

      while (this.changeRows.length < explanation.changeLines.length) {
        const row = this.addLabel(this.scene, "18px", PALETTE.textPrimary, 0);

        this.changeRows.push(row);
        this.container.add(row);
        this.changeBars.push(new PipBar(this.scene, this.container));
      }

      explanation.changeLines.forEach((line, index) => {
        const arrow = this.resolveArrow(line.direction);

        blocks.push(
          this.block(
            this.changeRows[index],
            `${arrow}  ${line.label}`,
            TransparencyOverlay.LEFT_EDGE,
            TransparencyOverlay.ROW_HEIGHT,
          ),
        );
      });
    }

    if (explanation.reasonText !== "") {
      blocks.push(
        this.block(
          this.reasonHeading,
          "WHY",
          TransparencyOverlay.LEFT_EDGE,
          30,
        ),
      );

      blocks.push(
        this.block(
          this.reasonLabel,
          explanation.reasonText,
          TransparencyOverlay.LEFT_EDGE,
          26,
        ),
      );
    }

    if (explanation.footer !== null) {
      blocks.push(this.block(this.footerLabel, explanation.footer, 0, 34));
    }

    let contentHeight = 0;

    for (const item of blocks) {
      contentHeight += item.advance;
    }

    this.panel.setSize(
      TransparencyOverlay.PANEL_WIDTH,
      contentHeight + TransparencyOverlay.PADDING * 2,
    );

    let y = -contentHeight / 2;

    for (const item of blocks) {
      item.label.setPosition(item.x, y + item.advance / 2);
      item.label.setVisible(true);

      y += item.advance;
    }

    explanation.changeLines.forEach((line, index) => {
      const row = this.changeRows[index];
      const bar = this.changeBars[index];

      bar.update(
        TransparencyOverlay.LEFT_EDGE + TransparencyOverlay.LABEL_WIDTH,
        row.y,
        line.previousPressure,
        line.nextPressure,
      );
    });

    this.container.setVisible(true);
  }

  private resolveArrow(direction: "up" | "down" | "unchanged"): string {
    if (direction === "up") {
      return "\u2191";
    }

    if (direction === "down") {
      return "\u2193";
    }

    return "\u2013";
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  private block(
    label: Phaser.GameObjects.Text,
    text: string,
    x: number,
    advance: number,
  ): LayoutBlock {
    label.setText(text);

    return { label, x, advance };
  }

  private hideAll(): void {
    this.headlineLabel.setVisible(false);
    this.levelNameLabel.setVisible(false);
    this.levelValueLabel.setVisible(false);
    this.noteLabel.setVisible(false);
    this.changesHeading.setVisible(false);
    this.reasonHeading.setVisible(false);
    this.reasonLabel.setVisible(false);
    this.footerLabel.setVisible(false);

    for (const row of this.changeRows) {
      row.setVisible(false);
    }

    for (const bar of this.changeBars) {
      bar.setVisible(false);
    }
  }
}