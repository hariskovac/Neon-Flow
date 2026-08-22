export class GameClock {
  private pausedAt: number | null = null;
  private totalPausedMs = 0;
  private pauseCount = 0;

  //time with all pauses removed
  public now(rawTime: number): number {
    if (this.pausedAt !== null) {
      return this.pausedAt - this.totalPausedMs;
    }

    return rawTime - this.totalPausedMs;
  }

  public pause(rawTime: number): void {
    if (this.pausedAt !== null) {
      return;
    }

    this.pausedAt = rawTime;
    this.pauseCount += 1;
  }

  public resume(rawTime: number): void {
    if (this.pausedAt === null) {
      return;
    }

    this.totalPausedMs += rawTime - this.pausedAt;
    this.pausedAt = null;
  }

  public isPaused(): boolean {
    return this.pausedAt !== null;
  }

  public getPauseCount(): number {
    return this.pauseCount;
  }

  public getTotalPausedMs(): number {
    return this.totalPausedMs;
  }

  public reset(): void {
    this.pausedAt = null;
    this.totalPausedMs = 0;
    this.pauseCount = 0;
  }
}