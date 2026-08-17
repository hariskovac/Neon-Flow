import type { GameEndReason, WavePerformance, PowerUpType, Condition } from "../types/game";

export class SessionManager {
  private calibration: WavePerformance | null = null;
  private completedWaves: WavePerformance[] = [];
  private livesRemaining = 0;
  private finalScore = 0;
  private terminationReason: GameEndReason = "completed";
  private condition: Condition = Math.random() < 0.5 ? "hidden" : "transparent";

  // calibration run summary
  public setCalibration(summary: WavePerformance): void {
    this.calibration = summary;
  }

  public getCalibration(): WavePerformance | null {
    return this.calibration;
  }

  public addCompletedWave(summary: WavePerformance): void {
    this.completedWaves.push(summary);
  }

  public getCompletedWaves(): WavePerformance[] {
    return [...this.completedWaves];
  }

  public getCompletedWaveCount(): number {
    return this.completedWaves.length;
  }

  public setOutcome(
    finalScore: number,
    livesRemaining: number,
    terminationReason: GameEndReason,
  ): void {
    this.livesRemaining = livesRemaining;
    this.finalScore = finalScore;
    this.terminationReason = terminationReason;
  }

  public getFinalScore(): number {
    return this.finalScore;
  }

  public getLivesRemaining(): number {
    return this.livesRemaining;
  }

  public getTerminationReason(): GameEndReason {
    return this.terminationReason;
  }

  private powerUpsCollectedByType: Record<PowerUpType, number> = {
    shield: 0,
    speed: 0,
    fireRate: 0,
  };

  public recordPowerUpCollected(type: PowerUpType): void {
    this.powerUpsCollectedByType[type] += 1;
  }

  public getPowerUpsCollectedByType(): Record<PowerUpType, number> {
    return { ...this.powerUpsCollectedByType };
  }

  public setCondition(condition: Condition): void {
    this.condition = condition;
  }

  public getCondition(): Condition {
    return this.condition;
  }

  public isTransparent(): boolean {
    return this.condition === "transparent";
  }

  public reset(): void {
    this.calibration = null;
    this.completedWaves = [];
    this.livesRemaining = 0;
    this.finalScore = 0;
    this.terminationReason = "completed";
    this.powerUpsCollectedByType = { shield: 0, speed: 0, fireRate: 0 };
    // TODO: replace by server-assigned value
    this.condition = Math.random() < 0.5 ? "hidden" : "transparent";
  }
}

export const session = new SessionManager();