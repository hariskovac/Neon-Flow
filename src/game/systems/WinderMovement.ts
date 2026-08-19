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
  time: number,
  amplitude: number,
  periodMs: number,
): Vector2 {
  const deltaX = targetX - selfX;
  const deltaY = targetY - selfY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance === 0) {
    return { x: 0, y: 0 };
  }

  const forwardX = deltaX / distance;
  const forwardY = deltaY / distance;

  const weave = Math.sin((time / periodMs) * Math.PI * 2) * amplitude;

  const x = forwardX - forwardY * weave;
  const y = forwardY + forwardX * weave;

  const magnitude = Math.hypot(x, y);

  return { x: x / magnitude, y: y / magnitude };
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