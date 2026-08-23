import type { GameEndReason, WavePerformance, PowerUpType, Condition, DDAEvent } from "../types/game";

export class SessionManager {
  private calibration: WavePerformance | null = null;
  private completedWaves: WavePerformance[] = [];
  private livesRemaining = 0;
  private finalScore = 0;
  private terminationReason: GameEndReason = "completed";
  private condition: Condition = Math.random() < 0.5 ? "hidden" : "transparent";
  private musicEnabled = true;
  private sfxEnabled = true;
  private pauseCount = 0;
  private totalPausedMs = 0;
  private ddaEvents: DDAEvent[] = [];

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

  public addDDAEvent(event: DDAEvent): void {
    this.ddaEvents.push(event);
  }

  public getDDAEvents(): DDAEvent[] {
    return [...this.ddaEvents];
  }

  public setAudioState(musicEnabled: boolean, sfxEnabled: boolean): void {
    this.musicEnabled = musicEnabled;
    this.sfxEnabled = sfxEnabled;
  }

  public setPauseTelemetry(pauseCount: number, totalPausedMs: number): void {
    this.pauseCount = pauseCount;
    this.totalPausedMs = totalPausedMs;
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public getSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public getPauseCount(): number {
    return this.pauseCount;
  }

  public getTotalPausedMs(): number {
    return this.totalPausedMs;
  }

  public setOutcome(outcome: {
    finalScore: number;
    livesRemaining: number;
    terminationReason: GameEndReason;
  }): void {
    this.finalScore = outcome.finalScore;
    this.livesRemaining = outcome.livesRemaining;
    this.terminationReason = outcome.terminationReason;
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
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.pauseCount = 0;
    this.totalPausedMs = 0;
    this.ddaEvents = [];
  }
}

export const session = new SessionManager();