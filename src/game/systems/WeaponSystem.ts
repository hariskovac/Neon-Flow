import { WEAPON_CONFIG } from "../gameplayConfig";

export interface ShotRequest {
  readonly originX: number;
  readonly originY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  // aiming angle for shots
  readonly angle: number;
  readonly firedAt: number;
}

export interface WeaponOptions {
  readonly fireIntervalMs?: number;
  readonly projectileSpeed?: number;
  readonly muzzleOffset?: number;
}

export class WeaponSystem {
  private readonly baseFireIntervalMs: number;
  private readonly projectileSpeed: number;
  private readonly muzzleOffset: number;

  private fireIntervalMs: number;
  private lastShotAt: number | null = null;
  private shotsFired = 0;

  public constructor(options: WeaponOptions = {}) {
    this.baseFireIntervalMs =
      options.fireIntervalMs ?? WEAPON_CONFIG.fireIntervalMs;
    this.projectileSpeed =
      options.projectileSpeed ?? WEAPON_CONFIG.projectileSpeed;
    this.muzzleOffset = options.muzzleOffset ?? WEAPON_CONFIG.muzzleOffset;

    this.fireIntervalMs = this.baseFireIntervalMs;
  }

  // controls when next shot can be fired
  public isReady(now: number): boolean {
    if (this.lastShotAt === null) {
      return true;
    }

    return now - this.lastShotAt >= this.fireIntervalMs;
  }

  // shoots when fire is held and firing is ready
  public tryFire(
    now: number,
    isFiring: boolean,
    playerX: number,
    playerY: number,
    aimAngle: number,
  ): ShotRequest[] {
    if (!isFiring || !this.isReady(now)) {
      return [];
    }

    this.lastShotAt = now;
    this.shotsFired += 1;

    const splay = (WEAPON_CONFIG.barrelSplayDegrees * Math.PI) / 180;
    const offset = WEAPON_CONFIG.barrelSeparation / 2;

    const sideX = Math.cos(aimAngle + Math.PI / 2);
    const sideY = Math.sin(aimAngle + Math.PI / 2);

    return [-1, 1].map((side) => {
      const angle = aimAngle + splay * side;
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);

      return {
        originX:
          playerX + directionX * this.muzzleOffset + sideX * offset * side,
        originY:
          playerY + directionY * this.muzzleOffset + sideY * offset * side,
        velocityX: directionX * this.projectileSpeed,
        velocityY: directionY * this.projectileSpeed,
        angle,
        firedAt: now,
      };
    });
  }

  // multiplier for firing rate power-up
  public setFireRateMultiplier(multiplier: number): void {
    const clamped = Math.min(
      Math.max(multiplier, WEAPON_CONFIG.minFireRateMultiplier),
      WEAPON_CONFIG.maxFireRateMultiplier,
    );

    this.fireIntervalMs = this.baseFireIntervalMs / clamped;
  }

  // removes firing rate multiplier
  public clearFireRateMultiplier(): void {
    this.fireIntervalMs = this.baseFireIntervalMs;
  }

  public getFireIntervalMs(): number {
    return this.fireIntervalMs;
  }

  // tracks shots fired
  public getShotsFired(): number {
    return this.shotsFired;
  }

  public reset(): void {
    this.fireIntervalMs = this.baseFireIntervalMs;
    this.lastShotAt = null;
    this.shotsFired = 0;
  }
}

