import Phaser from "phaser";

import {
  DEPTH,
  HUD_TEXT_STYLE,
  PALETTE,
  TUTORIAL_CONFIG,
} from "../gameplayConfig";

interface KeyCap {
  readonly id: string;
  readonly box: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

export class KeyCapDisplay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly caps: KeyCap[] = [];

  public constructor(scene: Phaser.Scene, centerX: number, centerY: number) {
    const size = TUTORIAL_CONFIG.keyCapSize;
    const step = size + TUTORIAL_CONFIG.keyCapGap;

    const layout = [
      { id: "up", letter: "W", x: 0, y: -step / 2 },
      { id: "left", letter: "A", x: -step, y: step / 2 },
      { id: "down", letter: "S", x: 0, y: step / 2 },
      { id: "right", letter: "D", x: step, y: step / 2 },
    ];

    const objects: Phaser.GameObjects.GameObject[] = [];

    for (const cap of layout) {
      const box = scene.add.rectangle(
        cap.x,
        cap.y,
        size,
        size,
        PALETTE.arenaFloor,
      );

      box.setStrokeStyle(2, PALETTE.arenaBorder);

      const label = scene.add.text(cap.x, cap.y, cap.letter, {
        ...HUD_TEXT_STYLE,
        fontSize: TUTORIAL_CONFIG.keyCapFontSize,
        color: PALETTE.textMuted,
      });

      label.setOrigin(0.5, 0.5);

      this.caps.push({ id: cap.id, box, label });

      objects.push(box, label);
    }

    this.container = scene.add.container(centerX, centerY, objects);
    this.container.setDepth(DEPTH.overlay);
  }

  public update(keysUsed: Set<string>): void {
    for (const cap of this.caps) {
      const used = keysUsed.has(cap.id);

      cap.box.setFillStyle(
        used ? PALETTE.textAccentValue : PALETTE.arenaFloor,
      );

      cap.label.setColor(used ? PALETTE.panelText : PALETTE.textMuted);
    }
  }

  public destroy(): void {
    this.container.destroy(true);
    this.caps.length = 0;
  }
}