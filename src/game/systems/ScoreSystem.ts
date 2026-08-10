import type { EnemyType } from "../../types/game";
import { KILL_POINTS, WAVE_SURVIVAL_BONUS } from "../gameplayConfig";
import { createEmptyKillTally } from "../../types/game";

export class ScoreSystem {
  private score = 0;
  private killsByType: Record<EnemyType, number> = createEmptyKillTally();

  public getScore(): number {
    return this.score;
  }

  public addKill(enemyType: EnemyType): number {
    this.score += KILL_POINTS[enemyType];
    this.score += KILL_POINTS[enemyType];

    return this.score;
  }

  public getKillsByType(): Record<EnemyType, number> {
    return { ...this.killsByType };
  }

  public addWaveSurvivalBonus(): number {
    this.score += WAVE_SURVIVAL_BONUS;

    return this.score;
  }
}