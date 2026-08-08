import Phaser from "phaser";

import type { Vector2 } from "../../types/game";
import { DEPTH, PALETTE, PLAYER_CONFIG } from "../gameplayConfig";

export class Player {
  private readonly view: Phaser.GameObjects.Rectangle;
  private readonly turret: Phaser.GameObjects.Rectangle;
  private readonly body: Phaser.Physics.Arcade.Body;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    this.turret = scene.add.rectangle(
      x,
      y,
      PLAYER_CONFIG.turretLength,
      PLAYER_CONFIG.turretThickness,
      PALETTE.turret,
    );

    this.turret.setOrigin(0, 0.5);
    this.turret.setDepth(DEPTH.turret);

    this.view = scene.add.rectangle(
      x,
      y,
      PLAYER_CONFIG.size,
      PLAYER_CONFIG.size,
      PALETTE.player,
    );

    this.view.setStrokeStyle(2, PALETTE.playerOutline);
    this.view.setDepth(DEPTH.player);

    scene.physics.add.existing(this.view);

    const body = this.view.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The player does not have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(true);
  }

  public update(movement: Vector2, aimAngle: number): void {
    this.body.setVelocity(
      movement.x * PLAYER_CONFIG.speed,
      movement.y * PLAYER_CONFIG.speed,
    );

    this.turret.setPosition(this.view.x, this.view.y);
    this.turret.setRotation(aimAngle);
  }

  public getX(): number {
    return this.view.x;
  }

  public getY(): number {
    return this.view.y;
  }
}