export interface DashPlan {
  readonly velocityX: number;
  readonly velocityY: number;
  readonly durationMs: number;
}

export function resolveDash(
  facing: number,
  distanceToTarget: number,
  overshootDistance: number,
  dashSpeed: number,
): DashPlan | null {
  if (distanceToTarget <= 0 || dashSpeed <= 0) {
    return null;
  }

  const travelDistance = distanceToTarget + overshootDistance;

  return {
    velocityX: Math.cos(facing) * dashSpeed,
    velocityY: Math.sin(facing) * dashSpeed,
    durationMs: (travelDistance / dashSpeed) * 1000,
  };
}