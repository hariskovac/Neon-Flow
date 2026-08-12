import Phaser from "phaser";

import { WeaponSystem } from "../systems/WeaponSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { HudSystem } from "../systems/HudSystem";
import { LivesSystem } from "../systems/LivesSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
import { Player } from "../entities/Player";
import type { MovementInput } from "../systems/PlayerMovement";
import { resolveMovementVector } from "../systems/PlayerMovement";
import { ARENA, DEPTH, PALETTE, PLAYER_CONFIG, WEAPON_CONFIG, ENEMY_WEAPON_CONFIG, WAVE_CONFIG } from "../gameplayConfig";
import { CollisionSystem } from "../systems/CollisionSystem";
import { SpawnSystem } from "../systems/SpawnSystem";
import { WaveSystem } from "../systems/WaveSystem";
import { PerformanceMonitor } from "../systems/PerformanceMonitor";
import type { GameEndReason } from "../../types/game";
import { session } from "../../experiment/SessionManager";
import { DifficultyController } from "../../dda/DifficultyController";
import { resolveActuators } from "../../dda/DifficultyConfig";
import { CALIBRATION_CONFIG } from "../gameplayConfig";
import { mapCalibration } from "../../dda/CalibrationMapper";

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
  private enemyProjectiles!: ProjectileSystem;
  private score!: ScoreSystem;
  private lives!: LivesSystem;
  private hud!: HudSystem;
  private performance!: PerformanceMonitor;
  private difficulty!: DifficultyController;

  private aimAngle = -Math.PI / 2;
  private hasPointerInput = false;
  private spawner!: SpawnSystem;

  private collisions!: CollisionSystem;
  private waves!: WaveSystem;

  public constructor() {
    super({ key: "GameScene" });
  }

  public create(): void {
    this.performance = new PerformanceMonitor();
    const calibration = mapCalibration(session.getCalibration());

    this.difficulty = new DifficultyController(calibration.startingLevel);

    console.log("Calibration mapping", calibration);

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
      CALIBRATION_CONFIG.fixedLevel,
    );

    this.collisions = new CollisionSystem(
      this.projectiles,
      this.enemyProjectiles,
      this.spawner.getEnemies(),
      this.player,
    );

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
    this.waves = new WaveSystem(this.time.now);
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
    const transition = this.waves.update(time);

    if (transition === "spawningStopped") {
      this.spawner.setSpawningEnabled(false);
    }

    if (transition === "waveEnded") {
      this.recordWave(time);

      const summary = session.getCompletedWaves().at(-1);

      if (summary !== undefined) {
        const decision = this.difficulty.evaluate(summary);

        this.spawner.setActuators(resolveActuators(decision.nextLevel));

        console.log("DDA decision", decision);
      }

      this.score.addWaveSurvivalBonus();
      this.spawner.clearAll();
      this.enemyProjectiles.reset();

      if (session.getCompletedWaveCount() >= WAVE_CONFIG.totalWaves) {
        this.endSession("completed");

        return;
      }
    } 

    if (transition === "waveStarted") {
      this.spawner.setSpawningEnabled(true);
      this.spawner.resetSpawnTimer(time);
      this.spawner.resetWaveCounters();
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

    if (this.waves.isIntermission()) {
      this.updateHud(time);

      return;
    }

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
        this.recordWave(time);
        this.spawner.clearAll();
        this.enemyProjectiles.reset();
        this.endSession("lives_exhausted");

        return;
      }
    }

    this.updateHud(time);
  }

  private readMovementInput(): MovementInput {
    return {
      up: this.movementKeys.W.isDown || this.cursors.up.isDown,
      down: this.movementKeys.S.isDown || this.cursors.down.isDown,
      left: this.movementKeys.A.isDown || this.cursors.left.isDown,
      right: this.movementKeys.D.isDown || this.cursors.right.isDown,
    };
  }

  private updateHud(time: number): void {
    this.hud.update({
      score: this.score.getScore(),
      livesRemaining: this.lives.getLivesRemaining(),
      waveNumber: this.waves.getWaveNumber(),
      remainingMs: this.waves.getPhaseRemainingMs(time),
      isIntermission: this.waves.isIntermission(),
      isCalibration: false,
    });
  }

  private recordWave(time: number): void {
    const summary = this.performance.summarise(
      this.waves.getWaveNumber(),
      this.spawner.getActiveCount(),
      this.waves.getPhaseElapsedMs(time),
      this.spawner.getSpawnedThisWave()
    );

    session.addCompletedWave(summary);
    this.performance.reset();

    console.log("Wave complete", summary);
  }

  private endSession(reason: GameEndReason): void {
    session.setOutcome(
      this.score.getScore(),
      this.lives.getLivesRemaining(),
      reason,
    );

    this.scene.start("ResultsScene");
  }
}