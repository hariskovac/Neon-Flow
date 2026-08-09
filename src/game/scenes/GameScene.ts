import Phaser from "phaser";

import { WeaponSystem } from "../systems/WeaponSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { HudSystem } from "../systems/HudSystem";
import { LivesSystem } from "../systems/LivesSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
import { Player } from "../entities/Player";
import type { MovementInput } from "../systems/PlayerMovement";
import { resolveMovementVector } from "../systems/PlayerMovement";
import { ARENA, DEPTH, PALETTE, PLAYER_CONFIG } from "../gameplayConfig";
import { Chaser } from "../entities/enemies/Chaser";
import { CollisionSystem } from "../systems/CollisionSystem";
import { Ranged } from "../entities/enemies/Ranged";

type MovementKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: MovementKeys;
  private weapon!: WeaponSystem;
  private projectiles!: ProjectileSystem;
  private score!: ScoreSystem;
  private lives!: LivesSystem;
  private hud!: HudSystem;

  private aimAngle = -Math.PI / 2;
  private hasPointerInput = false;

  private chasers: Chaser[] = [];
  private ranged: Ranged[] = [];

  private collisions!: CollisionSystem;

  public constructor() {
    super({ key: "GameScene" });
  }

  public create(): void {
    this.physics.world.setBounds(
      ARENA.x,
      ARENA.y,
      ARENA.width,
      ARENA.height,
    );

    this.drawArena();

    this.score = new ScoreSystem();
    this.lives = new LivesSystem();
    this.hud = new HudSystem(this, this.lives.getStartingLives());

    this.player = new Player(
      this,
      this.scale.width / 2,
      this.scale.height / 2,
    );

    this.weapon = new WeaponSystem();
    this.projectiles = new ProjectileSystem(this);

    this.chasers = [
      new Chaser(this, ARENA.x + 80, ARENA.y + 80),
      new Chaser(this, ARENA.x + ARENA.width - 80, ARENA.y + 80),
      new Chaser(this, ARENA.x + ARENA.width / 2, ARENA.y + ARENA.height - 80),
    ];

    this.ranged = [
      new Ranged (
        this,
        ARENA.x + 120,
        ARENA.y + ARENA.height - 100,
        this.projectiles,
      ),
      new Ranged (
        this,
        ARENA.x + ARENA.width - 120,
        ARENA.y + ARENA.height - 100,
        this.projectiles,
      ),
    ];

    this.collisions = new CollisionSystem(this.projectiles, this.chasers, this.ranged, this.player);

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    this.movementKeys = keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as MovementKeys;

    this.cursors = keyboard.createCursorKeys();

    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", this.markPointerInput, this);
    this.input.on("pointerdown", this.markPointerInput, this);
  }

  private drawArena(): void {
    const arena = this.add.rectangle(
      ARENA.x + ARENA.width / 2,
      ARENA.y + ARENA.height / 2,
      ARENA.width,
      ARENA.height,
      PALETTE.arenaFloor,
    );

    arena.setStrokeStyle(2, PALETTE.arenaBorder);
    arena.setDepth(DEPTH.arena);
  }

  private markPointerInput(): void {
    this.hasPointerInput = true;
  }

  private updateAimAngle(pointer: Phaser.Input.Pointer): void {
    if (!this.hasPointerInput) {
      return;
    }

    const deltaX = pointer.worldX - this.player.getX();
    const deltaY = pointer.worldY - this.player.getY();

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    this.aimAngle = Math.atan2(deltaY, deltaX);
  }


  public update(time: number): void {
    const pointer = this.input.activePointer;

    this.updateAimAngle(pointer);

    const movement = resolveMovementVector(this.readMovementInput());
    this.player.update(time, movement, this.aimAngle);

    for (const chaser of this.chasers) {
      chaser.update(time, this.player.getX(), this.player.getY());
    }

    for (const attacker of this.ranged) {
      attacker.update(this.player.getX(), this.player.getY());
    }

    const shot = this.weapon.tryFire(
      time,
      pointer.isDown,
      this.player.getX(),
      this.player.getY(),
      this.aimAngle,
    );

    if (shot !== null) {
      this.projectiles.spawn(shot);
    }

    this.projectiles.update(time);

    const result = this.collisions.update();

    for (let index = 0; index < result.chasersKilled; index += 1) {
      this.score.addKill("chaser");
    }

    for (let index = 0; index < result.rangedKilled; index += 1) {
      this.score.addKill("ranged");
    }

    if (result.playerHit && !this.player.isInvincible(time)) {
      const respawnX = ARENA.x + ARENA.width / 2;
      const respawnY = ARENA.y + ARENA.height / 2;

      this.lives.loseLife();

      this.collisions.clearRespawnArea(
        respawnX,
        respawnY,
        PLAYER_CONFIG.respawnPushbackRadius,
      );

      this.player.respawn(time, respawnX, respawnY);
    }

    this.hud.update(this.score.getScore(), this.lives.getLivesRemaining());
  }

  private readMovementInput(): MovementInput {
    return {
      up: this.movementKeys.W.isDown || this.cursors.up.isDown,
      down: this.movementKeys.S.isDown || this.cursors.down.isDown,
      left: this.movementKeys.A.isDown || this.cursors.left.isDown,
      right: this.movementKeys.D.isDown || this.cursors.right.isDown,
    };
  }
}