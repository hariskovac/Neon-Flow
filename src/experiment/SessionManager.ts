import type {
  GameEndReason,
  WavePerformance,
  PowerUpType,
  Condition,
  DDAEvent,
  ConsentRecord,
  QuestionnaireResponse,
  StudyPhase,
  PersistedSession,
} from "../types/game";
import { sessionStore } from "./SessionStore";

export class SessionManager {
  private calibration: WavePerformance | null = null;
  private completedWaves: WavePerformance[] = [];
  private livesRemaining = 0;
  private finalScore = 0;
  private terminationReason: GameEndReason = "completed";
  private musicEnabled = true;
  private sfxEnabled = true;
  private pauseCount = 0;
  private totalPausedMs = 0;
  private ddaEvents: DDAEvent[] = [];
  private questionnaire: QuestionnaireResponse | null = null;
  private identity: PersistedSession;
  
  public constructor() {
    this.identity = sessionStore.load() ?? sessionStore.createLocal();

    sessionStore.save(this.identity);
  }

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

  public getSessionId(): string {
    return this.identity.sessionId;
  }

  public getPhase(): StudyPhase {
    return this.identity.phase;
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

  public setQuestionnaire(response: QuestionnaireResponse): void {
    this.questionnaire = response;
  }

  public getQuestionnaire(): QuestionnaireResponse | null {
    return this.questionnaire;
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

  public getCondition(): Condition |null {
    return this.identity.condition;
  }

  public isTransparent(): boolean {
    return this.identity.condition === "transparent";
  }

  public setConsent(record: ConsentRecord): void {
    this.identity = { ...this.identity, consent: record };

    sessionStore.save(this.identity);
  }

  public getConsent(): ConsentRecord | null {
    return this.identity.consent;
  }

  public setPhase(phase: StudyPhase): void {
    this.identity = { ...this.identity, phase };

    sessionStore.save(this.identity);
  }

  public setIdentity(sessionId: string, condition: Condition): void {
    this.identity = {
      ...this.identity,
      sessionId,
      condition,
      verified: true,
    };

    sessionStore.save(this.identity);
  }

  public isRecording(): boolean {
    return this.identity.phase === "researchRun";
  }

  public isVerified(): boolean {
    return this.identity.verified;
  }

  public resetRun(): void {
    this.calibration = null;
    this.completedWaves = [];
    this.livesRemaining = 0;
    this.finalScore = 0;
    this.terminationReason = "completed";
    this.powerUpsCollectedByType = { shield: 0, speed: 0, fireRate: 0 };
    // TODO: replace by server-assigned value
    this.pauseCount = 0;
    this.totalPausedMs = 0;
    this.ddaEvents = [];
  }
}

export const session = new SessionManager();