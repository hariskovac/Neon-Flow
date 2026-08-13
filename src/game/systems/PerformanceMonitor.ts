import type { EnemyType, WavePerformance } from "../../types/game";
import { createEmptyKillTally } from "../../types/game";

export class PerformanceMonitor {
  private shotsFired = 0;
  private shotsHit = 0;
  private killsByType: Record<EnemyType, number> = createEmptyKillTally();
  private livesLost = 0;
  private shieldHitsAbsorbed = 0;
  private powerUpsSpawned = 0;
  private powerUpsCollected = 0;

  public recordShotFired(): void {
    this.shotsFired += 1;
  }

  public recordKill(enemyType: EnemyType): void {
    this.killsByType[enemyType] += 1;
  }

  public recordShotsHit(count: number): void {
    this.shotsHit += count;
  }

  public recordShieldHit(): void {
    this.shieldHitsAbsorbed += 1;
  }

  public recordLifeLost(): void {
    this.livesLost += 1;
  }

  public recordPowerUpSpawned(): void {
    this.powerUpsSpawned += 1;
  }

  public recordPowerUpCollected(): void {
    this.powerUpsCollected += 1;
  }

  public summarise(
    waveNumber: number,
    enemiesRemaining: number,
    durationMs: number,
    enemiesSpawned: number,
  ): WavePerformance {
    return {
      waveNumber,
      durationMs,
      killsByType: { ...this.killsByType },
      livesLost: this.livesLost,
      shieldHitsAbsorbed: this.shieldHitsAbsorbed,
      enemiesRemaining,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      enemiesSpawned,
    };
  }

  public reset(): void {
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.killsByType = createEmptyKillTally();
    this.livesLost = 0;
    this.shieldHitsAbsorbed = 0;
  }
}