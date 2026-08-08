import type { Vector2 } from "../../types/game";

const STATIONARY: Vector2 = { x: 0, y: 0 };

// adjusts chaser speed
export function adjustChaserSpeed(
  ageMs: number,
  baseSpeed: number,
  accelerationPerSecond: number,
  maxSpeed: number,
): number {
  const secondsAlive = Math.max(ageMs, 0) / 1000;
  const speed = baseSpeed + accelerationPerSecond * secondsAlive;

  return Math.min(speed, maxSpeed);
}

// vector from chaser to player
export function setPursuitVector(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): Vector2 {
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;

  if (deltaX === 0 && deltaY === 0) {
    return STATIONARY;
  }

  const distance = Math.hypot(deltaX, deltaY);

  return { x: deltaX / distance, y: deltaY / distance };
}