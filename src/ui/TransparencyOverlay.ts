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

  private readonly container: Phaser.GameObjects.Container;
  private readonly reasonLabel: Phaser.GameObjects.Text;
  private readonly headlineLabel: Phaser.GameObjects.Text;
  private readonly rowLabels: Phaser.GameObjects.Text[] = [];

  public constructor(scene: Phaser.Scene) {
    const centreX = ARENA.x + ARENA.width / 2;
    const centreY = ARENA.y + ARENA.height / 2;

    const panel = scene.add.rectangle(
      0,
      0,
      TransparencyOverlay.PANEL_WIDTH,
      TransparencyOverlay.PANEL_HEIGHT,
      PALETTE.arenaFloor,
      0.94,
    );

    panel.setStrokeStyle(2, PALETTE.arenaBorder);

    this.reasonLabel = scene.add.text(0, -70, "", {
      ...HUD_TEXT_STYLE,
      fontSize: "15px",
      color: PALETTE.hudMuted,
      align: "center",
      wordWrap: { width: TransparencyOverlay.PANEL_WIDTH - 48 },
    });

    this.reasonLabel.setOrigin(0.5, 0.5);

    this.headlineLabel = scene.add.text(0, -28, "", {
      ...HUD_TEXT_STYLE,
      fontSize: "22px",
      align: "center",
    });

    this.headlineLabel.setOrigin(0.5, 0.5);

    this.container = scene.add.container(centreX, centreY, [
      panel,
      this.reasonLabel,
      this.headlineLabel,
    ]);

    this.container.setDepth(DEPTH.overlay);
    this.container.setVisible(false);
  }

  public showExplanation(scene: Phaser.Scene, explanation: Explanation): void {
    this.reasonLabel.setText(explanation.reasonLine);
    this.headlineLabel.setText(explanation.headline);

    this.setRows(
      scene,
      explanation.parameterLines.map(
        (line) => `${line.label}  ${line.direction === "up" ? "\u2191" : "\u2193"}`,
      ),
    );

    this.container.setVisible(true);
  }

  // shows hidden condition's card
  public showNeutral(scene: Phaser.Scene): void {
    this.reasonLabel.setText("");
    this.headlineLabel.setText("Wave complete");

    this.setRows(scene, ["Prepare for the next wave."]);

    this.container.setVisible(true);
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  private setRows(scene: Phaser.Scene, rows: string[]): void {
    while (this.rowLabels.length < rows.length) {
      const label = scene.add.text(0, 0, "", {
        ...HUD_TEXT_STYLE,
        fontSize: "16px",
        align: "center",
      });

      label.setOrigin(0.5, 0.5);

      this.rowLabels.push(label);
      this.container.add(label);
    }

    this.rowLabels.forEach((label, index) => {
      if (index >= rows.length) {
        label.setVisible(false);

        return;
      }

      label.setText(rows[index]);
      label.setPosition(0, 14 + index * TransparencyOverlay.ROW_HEIGHT);
      label.setVisible(true);
    });
  }
}