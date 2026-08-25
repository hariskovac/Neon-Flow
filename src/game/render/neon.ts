import Phaser from "phaser";

import type { Vector2 } from "../../types/game";
import { NEON_CONFIG } from "../gameplayConfig";

function lighten(color: number, amount: number): number {
  const source = Phaser.Display.Color.IntegerToColor(color);

  const red = source.red + (255 - source.red) * amount;
  const green = source.green + (255 - source.green) * amount;
  const blue = source.blue + (255 - source.blue) * amount;

  return Phaser.Display.Color.GetColor(
    Math.round(red),
    Math.round(green),
    Math.round(blue),
  );
}

function tracePath(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly Vector2[],
): void {
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    graphics.lineTo(points[index].x, points[index].y);
  }

  graphics.closePath();
}

export function drawNeonShape(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly Vector2[],
  color: number,
  lineWidth: number,
  alpha = 1,
): void {
  graphics.fillStyle(color, NEON_CONFIG.fillAlpha * alpha);
  tracePath(graphics, points);
  graphics.fillPath();

  NEON_CONFIG.passes.forEach((pass, index) => {
    const isCore = index === NEON_CONFIG.passes.length - 1;

    const strokeColor = isCore
      ? lighten(color, NEON_CONFIG.coreLightness)
      : color;

    graphics.lineStyle(
      lineWidth * pass.widthScale,
      strokeColor,
      pass.alpha * alpha,
    );

    tracePath(graphics, points);
    graphics.strokePath();
  });
}

export function drawNeonCircle(
  graphics: Phaser.GameObjects.Graphics,
  radius: number,
  color: number,
  lineWidth: number,
  alpha = 1,
): void {
  graphics.fillStyle(color, NEON_CONFIG.fillAlpha * alpha);
  graphics.fillCircle(0, 0, radius);

  NEON_CONFIG.passes.forEach((pass, index) => {
    const isCore = index === NEON_CONFIG.passes.length - 1;

    const strokeColor = isCore
      ? lighten(color, NEON_CONFIG.coreLightness)
      : color;

    graphics.lineStyle(
      lineWidth * pass.widthScale,
      strokeColor,
      pass.alpha * alpha,
    );

    graphics.strokeCircle(0, 0, radius);
  });
}

export function drawNeonLine(
  graphics: Phaser.GameObjects.Graphics,
  from: Vector2,
  to: Vector2,
  color: number,
  lineWidth: number,
  alpha = 1,
): void {
  NEON_CONFIG.passes.forEach((pass, index) => {
    const isCore = index === NEON_CONFIG.passes.length - 1;

    const strokeColor = isCore
      ? lighten(color, NEON_CONFIG.coreLightness)
      : color;

    graphics.lineStyle(
      lineWidth * pass.widthScale,
      strokeColor,
      pass.alpha * alpha,
    );

    graphics.lineBetween(from.x, from.y, to.x, to.y);
  });
}