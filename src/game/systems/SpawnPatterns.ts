import type { ArenaBounds, Vector2 } from "../../types/game";
import { SPAWN_CONFIG } from "../gameplayConfig";

export function resolveIntensityValue(
  bounds: { low: number; high: number },
  intensity: number,
): number {
  const clamped = Math.min(Math.max(intensity, 0), 1);

  return bounds.low + (bounds.high - bounds.low) * clamped;
}

export function resolveCornerAnchors(bounds: ArenaBounds): Vector2[] {
  const inset = SPAWN_CONFIG.cornerInset;

  return [
    { x: bounds.x + inset, y: bounds.y + inset },
    { x: bounds.x + bounds.width - inset, y: bounds.y + inset },
    { x: bounds.x + inset, y: bounds.y + bounds.height - inset },
    {
      x: bounds.x + bounds.width - inset,
      y: bounds.y + bounds.height - inset,
    },
  ];
}

export function resolveSurroundPoints(
  centerX: number,
  centerY: number,
  radius: number,
  count: number,
  startAngle: number,
): Vector2[] {
  const points: Vector2[] = [];

  for (let index = 0; index < count; index += 1) {
    const angle = startAngle + (index / count) * Math.PI * 2;

    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  return points;
}

export function canSurround(
  bounds: ArenaBounds,
  playerX: number,
  playerY: number,
): boolean {
  const margin = SPAWN_CONFIG.surroundMinEdgeDistance;

  return (
    playerX - bounds.x >= margin &&
    bounds.x + bounds.width - playerX >= margin &&
    playerY - bounds.y >= margin &&
    bounds.y + bounds.height - playerY >= margin
  );
}

export function clampToArena(
  bounds: ArenaBounds,
  point: Vector2,
): Vector2 {
  const inset = SPAWN_CONFIG.spawnInset;

  return {
    x: Math.min(
      Math.max(point.x, bounds.x + inset),
      bounds.x + bounds.width - inset,
    ),
    y: Math.min(
      Math.max(point.y, bounds.y + inset),
      bounds.y + bounds.height - inset,
    ),
  };
}