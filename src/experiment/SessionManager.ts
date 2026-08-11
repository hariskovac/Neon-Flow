import type { GameEndReason, WavePerformance } from "../types/game";

export class SessionManager {
  private calibration: WavePerformance | null = null;
  private completedWaves: WavePerformance[] = [];
  private livesRemaining = 0;
  private finalScore = 0;
  private terminationReason: GameEndReason = "completed";

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
    livesRemaining: number,
    finalScore: number,
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

  public reset(): void {
    this.calibration = null;
    this.completedWaves = [];
    this.livesRemaining = 0;
    this.finalScore = 0;
    this.terminationReason = "completed";
  }
}

export const session = new SessionManager();