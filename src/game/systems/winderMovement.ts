import type { Vector2 } from "../../types/game";

export interface PathSample {
  readonly x: number;
  readonly y: number;
  readonly time: number;
}

export function resolveWinderHeading(
  selfX: number,
  selfY: number,
  targetX: number,
  targetY: number,
  currentFacing: number,
  time: number,
  deltaMs: number,
  amplitude: number,
  periodMs: number,
  phase: number,
  turnRate: number,
): number {
  const deltaX = targetX - selfX;
  const deltaY = targetY - selfY;

  if (deltaX === 0 && deltaY === 0) {
    return currentFacing;
  }

  const weave = Math.sin((time / periodMs) * Math.PI * 2 + phase) * amplitude;
  const desired = Math.atan2(deltaY, deltaX) + weave;

  return turnToward(currentFacing, desired, turnRate * (deltaMs / 1000));
}

export function samplePathAt(
  history: readonly PathSample[],
  targetTime: number,
): Vector2 | null {
  if (history.length === 0) {
    return null;
  }

  const oldest = history[0];

  if (targetTime <= oldest.time) {
    return { x: oldest.x, y: oldest.y };
  }

  for (let index = history.length - 1; index > 0; index -= 1) {
    const later = history[index];
    const earlier = history[index - 1];

    if (targetTime >= earlier.time && targetTime <= later.time) {
      const span = later.time - earlier.time;

      if (span <= 0) {
        return { x: earlier.x, y: earlier.y };
      }

      const ratio = (targetTime - earlier.time) / span;

      return {
        x: earlier.x + (later.x - earlier.x) * ratio,
        y: earlier.y + (later.y - earlier.y) * ratio,
      };
    }
  }

  const newest = history[history.length - 1];

  return { x: newest.x, y: newest.y };
}

function turnToward(
  current: number,
  desired: number,
  maxTurn: number,
): number {
  let difference = desired - current;

  while (difference > Math.PI) {
    difference -= Math.PI * 2;
  }

  while (difference < -Math.PI) {
    difference += Math.PI * 2;
  }

  const turn = Math.max(-maxTurn, Math.min(maxTurn, difference));

  return current + turn;
}