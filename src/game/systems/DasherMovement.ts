export interface DashPlan {
  readonly velocityX: number;
  readonly velocityY: number;
  readonly durationMs: number;
}

export function resolveDash(
  selfX: number,
  selfY: number,
  targetX: number,
  targetY: number,
  overshootDistance: number,
  dashSpeed: number,
): DashPlan | null {
  const deltaX = targetX - selfX;
  const deltaY = targetY - selfY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance === 0 || dashSpeed <= 0) {
    return null;
  }

  const travelDistance = distance + overshootDistance;

  return {
    velocityX: (deltaX / distance) * dashSpeed,
    velocityY: (deltaY / distance) * dashSpeed,
    durationMs: (travelDistance / dashSpeed) * 1000,
  };
}