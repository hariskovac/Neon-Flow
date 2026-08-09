import type { EnemyType } from "../../types/game";
import { KILL_POINTS } from "../gameplayConfig";

export class ScoreSystem {
  private score = 0;

  public getScore(): number {
    return this.score;
  }

  public addKill(enemyType: EnemyType): number {
    this.score += KILL_POINTS[enemyType];

    return this.score;
  }
}