import { PLAYER_CONFIG } from "../gameplayConfig";

export class LivesSystem {
  private readonly startingLives: number;

  private livesRemaining: number;

  public constructor(startingLives: number = PLAYER_CONFIG.startingLives) {
    if (!Number.isInteger(startingLives) || startingLives < 1) {
      throw new Error(
        `Starting lives must be a positive integer, received ${String(startingLives)}.`,
      );
    }

    this.startingLives = startingLives;
    this.livesRemaining = startingLives;
  }

  public loseLife(): number {
    if (this.livesRemaining > 0) {
      this.livesRemaining -= 1;
    }

    return this.livesRemaining;
  }

  public getLivesRemaining(): number {
    return this.livesRemaining;
  }

  public getStartingLives(): number {
    return this.startingLives;
  }

  public isAlive(): boolean {
    return this.livesRemaining > 0;
  }
}