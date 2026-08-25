import type { Vector2 } from "../../types/game";

export function resolveEvasion(
  selfX: number,
  selfY: number,
  projectileX: number,
  projectileY: number,
  projectileVelocityX: number,
  projectileVelocityY: number,
  evasionRadius: number,
  lookaheadMs: number,
): Vector2 | null {
  const offsetX = selfX - projectileX;
  const offsetY = selfY - projectileY;

  const speedSquared =
    projectileVelocityX * projectileVelocityX +
    projectileVelocityY * projectileVelocityY;

  if (speedSquared === 0) {
    return null;
  }

  const timeToClosest =
    (offsetX * projectileVelocityX + offsetY * projectileVelocityY) /
    speedSquared;

  if (timeToClosest <= 0 || timeToClosest * 1000 > lookaheadMs) {
    return null;
  }

  const closestX = offsetX - projectileVelocityX * timeToClosest;
  const closestY = offsetY - projectileVelocityY * timeToClosest;

  if (Math.hypot(closestX, closestY) > evasionRadius) {
    return null;
  }

  const speed = Math.sqrt(speedSquared);
  const perpendicularX = -projectileVelocityY / speed;
  const perpendicularY = projectileVelocityX / speed;

  const side =
    offsetX * perpendicularX + offsetY * perpendicularY >= 0 ? 1 : -1;

  return { x: perpendicularX * side, y: perpendicularY * side };
}