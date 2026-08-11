import { WAVE_CONFIG } from "../gameplayConfig";

export type WaveTransition =
  | "spawningStopped"
  | "waveEnded"
  | "waveStarted";

type WavePhase = "active" | "intermission";

export class WaveSystem {
  private waveNumber = 1;
  private phase: WavePhase = "active";
  private phaseStartedAt: number;
  private spawningStopped = false;

  public constructor(startedAt: number) {
    this.phaseStartedAt = startedAt;
  }

  public update(time: number): WaveTransition | null {
    const elapsed = time - this.phaseStartedAt;

    if (this.phase === "active") {
      if (elapsed >= WAVE_CONFIG.durationMs) {
        this.phase = "intermission";
        this.phaseStartedAt = time;

        return "waveEnded";
      }

      if (!this.spawningStopped && elapsed >= WAVE_CONFIG.spawnStopMs) {
        this.spawningStopped = true;

        return "spawningStopped";
      }

      return null;
    }

    if (elapsed >= WAVE_CONFIG.intermissionMs) {
      this.waveNumber += 1;
      this.phase = "active";
      this.phaseStartedAt = time;
      this.spawningStopped = false;

      return "waveStarted";
    }

    return null;
  }

  public getWaveNumber(): number {
    return this.waveNumber;
  }

  public isIntermission(): boolean {
    return this.phase === "intermission";
  }

  public getPhaseRemainingMs(time: number): number {
    const total =
      this.phase === "active"
        ? WAVE_CONFIG.durationMs
        : WAVE_CONFIG.intermissionMs;

    return Math.max(total - (time - this.phaseStartedAt), 0);
  }

  public getPhaseElapsedMs(time: number): number {
    return time - this.phaseStartedAt;
  }
}