import { WAVE_CONFIG } from "../gameplayConfig";

export type WaveTransition =
  | "spawningStopped"
  | "waveEnded"
  | "waveStarted";

type WavePhase = "active" | "intermission";

export class WaveSystem {
  private waveNumber = 1;
  private phase: WavePhase = "active";
  private phaseStartedAt: number | null = null;
  private spawningStopped = false;

  public update(time: number): WaveTransition | null {
    if (this.phaseStartedAt === null) {
      this.phaseStartedAt = time;

      return null;
    }
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
    if (this.phaseStartedAt === null) {
      return this.phase === "active"
        ? WAVE_CONFIG.durationMs
        : WAVE_CONFIG.intermissionMs;
    }

    const total =
      this.phase === "active"
        ? WAVE_CONFIG.durationMs
        : WAVE_CONFIG.intermissionMs;

    return Math.max(total - (time - this.phaseStartedAt), 0);
  }

  public getPhaseElapsedMs(time: number): number {
    if (this.phaseStartedAt === null) {
      return 0;
    }

    return time - this.phaseStartedAt;
  }
}