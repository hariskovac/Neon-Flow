import Phaser from "phaser";

import type { Explanation } from "../dda/ExplanationGenerator";
import {
  ARENA,
  DEPTH,
  HUD_TEXT_STYLE,
  PALETTE,
} from "../game/gameplayConfig";

export class TransparencyOverlay {
  private static readonly PANEL_WIDTH = 460;
  private static readonly PANEL_HEIGHT = 210;
  private static readonly ROW_HEIGHT = 26;
  private static readonly LEFT_EDGE = -TransparencyOverlay.PANEL_WIDTH / 2 + 34;

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

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const panel = scene.add.rectangle(
      0,
      0,
      TransparencyOverlay.PANEL_WIDTH,
      TransparencyOverlay.PANEL_HEIGHT,
      PALETTE.arenaFloor,
      0.96,
    );

    panel.setStrokeStyle(2, PALETTE.arenaBorder);

    this.headlineLabel = this.addLabel(scene, "20px", PALETTE.textPrimary, 0.5);
    this.levelNameLabel = this.addLabel(scene, "15px", PALETTE.textMuted, 0.5);
    this.levelValueLabel = this.addLabel(scene, "30px", PALETTE.textAccent, 0.5);
    this.noteLabel = this.addLabel(scene, "14px", PALETTE.textMuted, 0.5);
    this.changesHeading = this.addLabel(scene, "13px", PALETTE.textMuted, 0);
    this.reasonHeading = this.addLabel(scene, "13px", PALETTE.textMuted, 0);
    this.reasonLabel = this.addLabel(scene, "15px", PALETTE.textAccent, 0);
    this.footerLabel = this.addLabel(scene, "14px", PALETTE.textMuted, 0.5);

    this.container = scene.add.container(
      ARENA.x + ARENA.width / 2,
      ARENA.y + ARENA.height / 2,
      [
        panel,
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

  public show(explanation: Explanation): void {
    let y = -TransparencyOverlay.PANEL_HEIGHT / 2 + 34;
 
    this.headlineLabel.setText(explanation.headline);
    this.headlineLabel.setPosition(0, y);
    y += 34;
 
    if (explanation.levelLabel !== null) {
      this.levelNameLabel.setText(explanation.levelLabel);
      this.levelNameLabel.setPosition(0, y);
      this.levelNameLabel.setVisible(true);
      y += 26;
    } else {
      this.levelNameLabel.setVisible(false);
    }
 
    if (explanation.levelValue !== "") {
      this.levelValueLabel.setText(explanation.levelValue);
      this.levelValueLabel.setPosition(0, y);
      this.levelValueLabel.setVisible(true);
      y += 34;
    } else {
      this.levelValueLabel.setVisible(false);
    }
 
    if (explanation.note !== null) {
      this.noteLabel.setText(explanation.note);
      this.noteLabel.setPosition(0, y);
      this.noteLabel.setVisible(true);
      y += 26;
    } else {
      this.noteLabel.setVisible(false);
    }
 
    y = this.layOutChanges(explanation, y);
    y = this.layOutReason(explanation, y);
 
    if (explanation.footer !== null) {
      this.footerLabel.setText(explanation.footer);
      this.footerLabel.setPosition(0, y + 14);
      this.footerLabel.setVisible(true);
    } else {
      this.footerLabel.setVisible(false);
    }
 
    this.container.setVisible(true);
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  private layOutChanges(explanation: Explanation, startY: number): number {
    if (explanation.changeLines.length === 0) {
      this.changesHeading.setVisible(false);
 
      for (const row of this.changeRows) {
        row.setVisible(false);
      }
 
      return startY;
    }
 
    let y = startY + 12;
 
    this.changesHeading.setText("CHANGES");
    this.changesHeading.setPosition(TransparencyOverlay.LEFT_EDGE, y);
    this.changesHeading.setVisible(true);
    y += 22;
 
    // Rows are created on demand and reused, so a decision with fewer changes
    // leaves the surplus rows hidden rather than reflowing the panel.
    while (this.changeRows.length < explanation.changeLines.length) {
      const row = this.addLabel(this.scene, "15px", PALETTE.textPrimary, 0);
 
      this.changeRows.push(row);
      this.container.add(row);
    }
 
    this.changeRows.forEach((row, index) => {
      if (index >= explanation.changeLines.length) {
        row.setVisible(false);
 
        return;
      }
 
      const line = explanation.changeLines[index];
      const arrow = line.direction === "up" ? "\u2191" : "\u2193";
 
      row.setText(`${arrow}  ${line.label}`);
      row.setPosition(
        TransparencyOverlay.LEFT_EDGE,
        y + index * TransparencyOverlay.ROW_HEIGHT,
      );
      row.setVisible(true);
    });
 
    return y + explanation.changeLines.length * TransparencyOverlay.ROW_HEIGHT;
  }
 
  private layOutReason(explanation: Explanation, startY: number): number {
    if (explanation.reasonText === "") {
      this.reasonHeading.setVisible(false);
      this.reasonLabel.setVisible(false);
 
      return startY;
    }
 
    let y = startY + 14;
 
    this.reasonHeading.setText("WHY");
    this.reasonHeading.setPosition(TransparencyOverlay.LEFT_EDGE, y);
    this.reasonHeading.setVisible(true);
    y += 22;
 
    this.reasonLabel.setText(explanation.reasonText);
    this.reasonLabel.setPosition(TransparencyOverlay.LEFT_EDGE, y);
    this.reasonLabel.setVisible(true);
 
    return y + 20;
  }
 
  private addLabel(
    scene: Phaser.Scene,
    fontSize: string,
    colour: string,
    originX: number,
  ): Phaser.GameObjects.Text {
    const label = scene.add.text(0, 0, "", {
      ...HUD_TEXT_STYLE,
      fontSize,
      color: colour,
      wordWrap: { width: TransparencyOverlay.PANEL_WIDTH - 68 },
    });
 
    label.setOrigin(originX, 0.5);
 
    return label;
  }

}