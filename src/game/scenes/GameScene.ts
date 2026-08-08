import Phaser from "phaser";

type MovementKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

import { WeaponSystem } from "../systems/WeaponSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";

export class GameScene extends Phaser.Scene {
  private static readonly PLAYER_SPEED = 260;

  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: MovementKeys;
  private weapon!: WeaponSystem;
  private projectiles!: ProjectileSystem;

  private aimAngle = -Math.PI / 2;
  private hasPointerInput = false;



  public constructor() {
    super({ key: "GameScene" });
  }

  public create(): void {
    this.add
      .text(24, 20, "Neon Flow", {
        color: "#f4f7ff",
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
      })
      .setDepth(10);

    this.add
      .text(24, 54, "Move with WASD or the arrow keys", {
        color: "#aebbd4",
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
      })
      .setDepth(10);

    this.player = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      32,
      32,
      0x62e6c8,
    );

    this.player.setStrokeStyle(2, 0xffffff);

    this.physics.add.existing(this.player);

    const playerBody = this.getPlayerBody();
    playerBody.setCollideWorldBounds(true);

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    this.cursors = keyboard.createCursorKeys();

    this.movementKeys = keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as MovementKeys;

    this.weapon = new WeaponSystem();
    this.projectiles = new ProjectileSystem(this);

    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", this.markPointerInput, this);
    this.input.on("pointerdown", this.markPointerInput, this);
  }

  private markPointerInput(): void {
    this.hasPointerInput = true;
  }

  private updateAimAngle(pointer: Phaser.Input.Pointer): void {
    if (!this.hasPointerInput) {
      return;
    }
 
    const deltaX = pointer.worldX - this.player.x;
    const deltaY = pointer.worldY - this.player.y;
 
    if (deltaX === 0 && deltaY === 0) {
      return;
    }
 
    this.aimAngle = Math.atan2(deltaY, deltaX);
  }


  public update(time: number): void {
    const playerBody = this.getPlayerBody();

    let horizontalMovement = 0;
    let verticalMovement = 0;

    if (
      this.movementKeys.A.isDown ||
      this.cursors.left.isDown
    ) {
      horizontalMovement -= 1;
    }

    if (
      this.movementKeys.D.isDown ||
      this.cursors.right.isDown
    ) {
      horizontalMovement += 1;
    }

    if (
      this.movementKeys.W.isDown ||
      this.cursors.up.isDown
    ) {
      verticalMovement -= 1;
    }

    if (
      this.movementKeys.S.isDown ||
      this.cursors.down.isDown
    ) {
      verticalMovement += 1;
    }

    playerBody.setVelocity(
      horizontalMovement,
      verticalMovement,
    );

    if (
      horizontalMovement !== 0 ||
      verticalMovement !== 0
    ) {
      playerBody.velocity
        .normalize()
        .scale(GameScene.PLAYER_SPEED);
    }

    const pointer = this.input.activePointer;

    this.updateAimAngle(pointer);

    const shot = this.weapon.tryFire(
      time,
      pointer.isDown,
      this.player.x,
      this.player.y,
      this.aimAngle,
    );

    if (shot !== null) {
      this.projectiles.spawn(shot);
    }

    this.projectiles.update(time);
  }

  private getPlayerBody(): Phaser.Physics.Arcade.Body {
    const body = this.player.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error(
        "The player does not have an Arcade Physics body.",
      );
    }

    return body;
  }
}