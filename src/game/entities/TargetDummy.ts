import Phaser from "phaser";

import type { EnemyType } from "../../types/game";
import type { Enemy } from "./enemies/Enemy";
import { CHASER_CONFIG, DEPTH, PALETTE, TUTORIAL_CONFIG } from "../gameplayConfig";

export class TargetDummy implements Enemy {
  private readonly view: Phaser.GameObjects.Arc;
  private readonly body: Phaser.Physics.Arcade.Body;

  private alive = true;
  private health = TUTORIAL_CONFIG.dummyHealth;
  private persistenceHandle = -1;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    this.view = scene.add.circle(x, y, CHASER_CONFIG.radius, PALETTE.targetDummy);
    this.view.setDepth(DEPTH.enemy);

    scene.physics.add.existing(this.view);

    const body = this.view.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The target dummy doesn't have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(CHASER_CONFIG.radius);
    this.body.setImmovable(true);
  }

  public allowsDrop(): boolean {
    return false;
  }

  public update(): void {
    return;
  }

  public isAlive(): boolean {
    return this.alive;
  }

  public getX(): number {
    return this.view.x;
  }

  public getY(): number {
    return this.view.y;
  }

  public getColor(): number {
    return PALETTE.targetDummy;
  }

  public getRadius(): number {
    return CHASER_CONFIG.radius;
  }

  public getType(): EnemyType {
    return "chaser";
  }

  public getPersistenceHandle(): number {
      return this.persistenceHandle;
  }

  public setPersistenceHandle(handle: number): void {
      this.persistenceHandle = handle;
  }

  public setPosition(x: number, y: number): void {
    this.body.reset(x, y);
  }

  public takeHit(): boolean {
    if (!this.alive) {
      return false;
    }

    this.health -= 1;

    if (this.health > 0) {
      this.view.setAlpha(
        0.35 + 0.65 * (this.health / TUTORIAL_CONFIG.dummyHealth),
      );

      return false;
    }

    this.alive = false;
    this.body.enable = false;
    this.view.destroy();

    return true;
  }

  public despawn(): void {
    this.takeHit();
  }

  public getBlockingParts(): ReadonlyArray<{ x: number; y: number; radius: number; }> {
    return [];
  }
}