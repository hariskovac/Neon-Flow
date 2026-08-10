import type { EnemyType } from "../../../types/game";

export interface Enemy {
  isAlive(): boolean;
  getX(): number;
  getY(): number;
  getRadius(): number;
  getType(): EnemyType;
  setPosition(x: number, y: number): void;
  takeHit(): boolean;
  update(time: number, targetX: number, targetY: number): void;
}