import Phaser from "phaser";

import type { PowerUpType, Vector2 } from "../../types/game";
import { DEPTH, PALETTE, POWERUP_CONFIG } from "../gameplayConfig";
import { drawNeonLine, drawNeonShape } from "../render/neon";

const TYPE_COLORS: Record<PowerUpType, number> = {
  shield: PALETTE.powerUpShield,
  speed: PALETTE.powerUpSpeed,
  fireRate: PALETTE.powerUpFireRate,
};

interface PowerUpGlyph {
  readonly outline: Vector2[] | null;
  readonly strokes: Array<[Vector2, Vector2]>;
  readonly trail?: Array<{ strokes: Array<[Vector2, Vector2]>; alpha: number }>;
}

const SHIELD_OUTLINE: Vector2[] = [
  { x: -11, y: -12 },
  { x: 11, y: -12 },
  { x: 11, y: -2 },
  { x: 8, y: 6 },
  { x: 0, y: 13 },
  { x: -8, y: 6 },
  { x: -11, y: -2 },
];

const SPEED_OUTLINE: Vector2[] = [
  { x: 14, y: 0 },
  { x: 1, y: -11 },
  { x: 1, y: -4 },
  { x: -4, y: -4 },
  { x: -4, y: 4 },
  { x: 1, y: 4 },
  { x: 1, y: 11 },
];

const SPEED_TRAIL: Array<{ strokes: Array<[Vector2, Vector2]>; alpha: number }> = [
  {
    strokes: [
      [{ x: -8, y: -8 }, { x: -3, y: 0 }],
      [{ x: -3, y: 0 }, { x: -8, y: 8 }],
    ],
    alpha: 0.7,
  },
  {
    strokes: [
      [{ x: -14, y: -8 }, { x: -9, y: 0 }],
      [{ x: -9, y: 0 }, { x: -14, y: 8 }],
    ],
    alpha: 0.4,
  },
];

const FIRE_RATE_STROKES: Array<[Vector2, Vector2]> = [
  [{ x: -9, y: 1 }, { x: 0, y: -8 }],
  [{ x: 0, y: -8 }, { x: 9, y: 1 }],
  [{ x: -9, y: 7 }, { x: 0, y: -2 }],
  [{ x: 0, y: -2 }, { x: 9, y: 7 }],
  [{ x: -9, y: 13 }, { x: 0, y: 4 }],
  [{ x: 0, y: 4 }, { x: 9, y: 13 }],
];

const TYPE_GLYPHS: Record<PowerUpType, PowerUpGlyph> = {
  shield: { outline: SHIELD_OUTLINE, strokes: [] },
  speed: { outline: SPEED_OUTLINE, strokes: [], trail: SPEED_TRAIL },
  fireRate: { outline: null, strokes: FIRE_RATE_STROKES },
};

export class PowerUp {
  private readonly view: Phaser.GameObjects.Graphics;
  private readonly type: PowerUpType;
  private readonly expiresAt: number;
  private readonly originX: number;
  private readonly originY: number;

  private collected = false;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: PowerUpType,
    expiresAt: number,
  ) {
    this.type = type;
    this.expiresAt = expiresAt;
    this.originX = x;
    this.originY = y;

    this.view = scene.add.graphics();
    this.view.setDepth(DEPTH.powerUp);
    this.view.setPosition(x, y);

    this.draw();
  }

  public update(time: number): void {
    if (this.collected) {
      return;
    }

    if (time >= this.expiresAt) {
      this.despawn();

      return;
    }

    const bob =
      Math.sin((time / POWERUP_CONFIG.bobPeriodMs) * Math.PI * 2) *
      POWERUP_CONFIG.bobAmplitude;

    this.view.setPosition(this.originX, this.originY + bob);

    const remaining = this.expiresAt - time;

    if (remaining > POWERUP_CONFIG.warningMs) {
      return;
    }

    const flashOn =
      Math.floor(time / POWERUP_CONFIG.flashIntervalMs) % 2 === 0;

    this.view.setVisible(flashOn);
  }

  private draw(): void {
    const color = TYPE_COLORS[this.type];
    const glyph = TYPE_GLYPHS[this.type];

    this.view.clear();

    if (glyph.outline !== null) {
      drawNeonShape(
        this.view,
        glyph.outline,
        color,
        POWERUP_CONFIG.glyphLineWidth,
      );
    }

    for (const stroke of glyph.strokes) {
      drawNeonLine(
        this.view,
        stroke[0],
        stroke[1],
        color,
        POWERUP_CONFIG.glyphLineWidth,
      );
    }

    for (const segment of glyph.trail ?? []) {
      for (const stroke of segment.strokes) {
        drawNeonLine(
          this.view,
          stroke[0],
          stroke[1],
          color,
          POWERUP_CONFIG.glyphLineWidth,
          segment.alpha,
        );
      }
    }
  }

  public isActive(): boolean {
    return !this.collected;
  }

  public getX(): number {
    return this.originX;
  }

  public getY(): number {
    return this.originY;
  }

  public getType(): PowerUpType {
    return this.type;
  }

  public getRadius(): number {
    return POWERUP_CONFIG.radius;
  }

  public despawn(): void {
    if (this.collected) {
      return;
    }

    this.collected = true;
    this.view.destroy();
  }
}