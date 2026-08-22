interface EnemyLifetime {
  readonly spawnedAt: number;
  diedAt: number | null;
  clearedByDeath: boolean;
}

export interface PersistenceSummary {
  // average enemy persistence
  readonly persistence: number;
  readonly tracked: number;
  readonly clearedByDeath: number;
}

export class PersistenceTracker {
  private readonly lifetimes: EnemyLifetime[] = [];

  public recordSpawn(time: number): number {
    this.lifetimes.push({
      spawnedAt: time,
      diedAt: null,
      clearedByDeath: false,
    });

    return this.lifetimes.length - 1;
  }

  // record enemy killed by player
  public recordDeath(handle: number, time: number): void {
    const lifetime = this.lifetimes[handle];

    if (lifetime === undefined || lifetime.diedAt !== null) {
      return;
    }

    lifetime.diedAt = time;
  }

  // record enemy cleared by player death
  public recordClearedByDeath(handle: number, time: number): void {
    const lifetime = this.lifetimes[handle];

    if (lifetime === undefined || lifetime.diedAt !== null) {
      return;
    }

    lifetime.diedAt = time;
    lifetime.clearedByDeath = true;
  }

  public summarise(waveEndedAt: number): PersistenceSummary {
    let total = 0;
    let tracked = 0;
    let clearedByDeath = 0;

    for (const lifetime of this.lifetimes) {
      if (lifetime.clearedByDeath) {
        clearedByDeath += 1;

        continue;
      }

      const available = waveEndedAt - lifetime.spawnedAt;

      if (available <= 0) {
        continue;
      }

      const survived =
        lifetime.diedAt === null
          ? available
          : Math.min(lifetime.diedAt - lifetime.spawnedAt, available);

      total += survived / available;
      tracked += 1;
    }

    return {
      persistence: tracked === 0 ? 0 : total / tracked,
      tracked,
      clearedByDeath,
    };
  }

  public reset(): void {
    this.lifetimes.length = 0;
  }
}