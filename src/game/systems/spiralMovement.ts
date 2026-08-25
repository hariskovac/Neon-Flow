import type { Vector2 } from "../../types/game";

export function resolveSpiralVelocity(
  selfX: number,
  selfY: number,
  targetX: number,
  targetY: number,
  forwardSpeed: number,
  lateralSpeed: number,
): Vector2 {
  const deltaX = targetX - selfX;
  const deltaY = targetY - selfY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance === 0) {
    return { x: 0, y: 0 };
  }

  const forwardX = deltaX / distance;
  const forwardY = deltaY / distance;

  const lateralX = -forwardY;
  const lateralY = forwardX;

  return {
    x: forwardX * forwardSpeed + lateralX * lateralSpeed,
    y: forwardY * forwardSpeed + lateralY * lateralSpeed,
  };
}