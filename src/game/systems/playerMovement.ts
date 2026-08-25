import type { Vector2 } from "../../types/game";

export interface MovementInput {
  readonly up: boolean;
  readonly down: boolean;
  readonly left: boolean;
  readonly right: boolean;
}

const STATIONARY: Vector2 = { x: 0, y: 0 };

// Converts direction to a vector
export function resolveMovementVector(input: MovementInput): Vector2 {
  let horizontal = 0;
  let vertical = 0;

  if (input.left) {
    horizontal -= 1;
  }

  if (input.right) {
    horizontal += 1;
  }

  if (input.up) {
    vertical -= 1;
  }

  if (input.down) {
    vertical += 1;
  }

  if (horizontal === 0 && vertical === 0) {
    return STATIONARY;
  }

  const magnitude = Math.hypot(horizontal, vertical);

  return {
    x: horizontal / magnitude,
    y: vertical / magnitude,
  };
}
