import Phaser from "phaser";

import { session } from "../../experiment/SessionManager";
import { Player } from "../entities/Player";
import {
  ARENA,
  CALIBRATION_CONFIG,
  DEPTH,
  ENEMY_WEAPON_CONFIG,
  PALETTE,
  PLAYER_CONFIG,
  WEAPON_CONFIG,
} from "../gameplayConfig";
import { CollisionSystem } from "../systems/CollisionSystem";
import { PerformanceMonitor } from "../systems/PerformanceMonitor";
import { HudSystem } from "../systems/HudSystem";
import { LivesSystem } from "../systems/LivesSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
import { SpawnSystem } from "../systems/SpawnSystem";
import type { MovementInput } from "../systems/PlayerMovement";
import { resolveMovementVector } from "../systems/PlayerMovement";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { WeaponSystem } from "../systems/WeaponSystem";

type MovementKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export class CalibrationScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: MovementKeys;
  private weapon!: WeaponSystem;
  private projectiles!: ProjectileSystem;
  private enemyProjectiles!: ProjectileSystem;
  private spawner!: SpawnSystem;
  private collisions!: CollisionSystem;
  private score!: ScoreSystem;
  private lives!: LivesSystem;
  private hud!: HudSystem;
  private performance!: PerformanceMonitor;

  private startedAt = 0;
  private aimAngle = -Math.PI / 2;
  private hasPointerInput = false;
  private finished = false;

  public constructor() {
    super({ key: "CalibrationScene" });
  }

  public create(): void {
    this.startedAt = this.time.now;
    this.finished = false;
    this.aimAngle = -Math.PI / 2;
    this.hasPointerInput = false;

    this.physics.world.setBounds(
      ARENA.x,
      ARENA.y,
      ARENA.width,
      ARENA.height,
    );

    this.drawArena();

    this.score = new ScoreSystem();
    this.lives = new LivesSystem();
    this.performance = new PerformanceMonitor();
    this.hud = new HudSystem(this, this.lives.getStartingLives());

    this.player = new Player(
      this,
      ARENA.x + ARENA.width / 2,
      ARENA.y + ARENA.height / 2,
    );

    this.weapon = new WeaponSystem();

    this.projectiles = new ProjectileSystem(this, ARENA, {
      projectileRadius: WEAPON_CONFIG.projectileRadius,
      projectileLifetimeMs: WEAPON_CONFIG.projectileLifetimeMs,
      maxActiveProjectiles: WEAPON_CONFIG.maxActiveProjectiles,
      color: PALETTE.projectile,
    });

    this.enemyProjectiles = new ProjectileSystem(this, ARENA, {
      projectileRadius: ENEMY_WEAPON_CONFIG.projectileRadius,
      projectileLifetimeMs: ENEMY_WEAPON_CONFIG.projectileLifetimeMs,
      maxActiveProjectiles: ENEMY_WEAPON_CONFIG.maxActiveProjectiles,
      color: PALETTE.enemyProjectile,
    });

    this.spawner = new SpawnSystem(
      this,
      ARENA,
      this.projectiles,
      this.enemyProjectiles,
    );

    this.collisions = new CollisionSystem(
      this.projectiles,
      this.enemyProjectiles,
      this.spawner.getEnemies(),
      this.player,
    );

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard input not available");
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

  public update(time: number): void {
    if (this.finished) {
      return;
    }

    const elapsed = time - this.startedAt;

    if (elapsed >= CALIBRATION_CONFIG.durationMs) {
      this.finish(elapsed);

      return;
    }

    const pointer = this.input.activePointer;

    this.updateAimAngle(pointer);

    const movement = resolveMovementVector(this.readMovementInput());
    this.player.update(time, movement, this.aimAngle);

    const shot = this.weapon.tryFire(
      time,
      pointer.isDown,
      this.player.getX(),
      this.player.getY(),
      this.aimAngle,
    );

    if (shot !== null) {
      this.projectiles.spawn(shot);
      this.performance.recordShotFired();
    }

    this.projectiles.update(time);

    this.spawner.update(time, this.player.getX(), this.player.getY());

    for (const enemy of this.spawner.getEnemies()) {
      enemy.update(time, this.player.getX(), this.player.getY());
    }

    this.enemyProjectiles.update(time);

    const result = this.collisions.update();

    this.performance.recordShotsHit(result.shotsHit);

    for (const enemyType of result.killed) {
      this.score.addKill(enemyType);
      this.performance.recordKill(enemyType);
    }

    if (result.playerHit && !this.player.isInvincible(time)) {
      const respawnX = ARENA.x + ARENA.width / 2;
      const respawnY = ARENA.y + ARENA.height / 2;

      this.lives.loseLife();
      this.performance.recordLifeLost();

      this.collisions.clearRespawnArea(
        respawnX,
        respawnY,
        PLAYER_CONFIG.respawnPushbackRadius,
      );

      this.player.respawn(time, respawnX, respawnY);

      if (!this.lives.isAlive()) {
        this.finish(elapsed);

        return;
      }
    }

    this.hud.update({
      score: this.score.getScore(),
      livesRemaining: this.lives.getLivesRemaining(),
      waveNumber: 0,
      remainingMs: CALIBRATION_CONFIG.durationMs - elapsed,
      isIntermission: false,
      isCalibration: true,
    });
  }

  // hands calibration summary off to session manager
  private finish(elapsed: number): void {
    this.finished = true;

    const summary = this.performance.summarise(
      0,
      this.spawner.getActiveCount(),
      elapsed,
      this.spawner.getSpawnedThisWave()
    );

    session.setCalibration(summary);
    this.spawner.clearAll();

    console.log("Calibration complete", summary);

    this.scene.start("GameScene");
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

  private readMovementInput(): MovementInput {
    return {
      up: this.movementKeys.W.isDown || this.cursors.up.isDown,
      down: this.movementKeys.S.isDown || this.cursors.down.isDown,
      left: this.movementKeys.A.isDown || this.cursors.left.isDown,
      right: this.movementKeys.D.isDown || this.cursors.right.isDown,
    };
  }
}