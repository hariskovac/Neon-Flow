import type { EnemyType } from "../../types/game";
import { KILL_POINTS, WAVE_SURVIVAL_BONUS } from "../gameplayConfig";

export class ScoreSystem {
  private score = 0;

  public getScore(): number {
    return this.score;
  }

  public addKill(enemyType: EnemyType): number {
    this.score += KILL_POINTS[enemyType];

    return this.score;
  }

  public addWaveSurvivalBonus(): number {
    this.score += WAVE_SURVIVAL_BONUS;

    return this.score;
  }
}