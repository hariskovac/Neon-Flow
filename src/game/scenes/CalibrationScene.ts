import Phaser from "phaser";

import { session } from "../../experiment/SessionManager";
import { Player } from "../entities/Player";
import {
  ARENA,
  CALIBRATION_CONFIG,
  PALETTE,
  WEAPON_CONFIG,
  WAVE_CONFIG
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
import { PowerUpEffects } from "../systems/PowerUpEffects";
import { PowerUpSystem } from "../systems/PowerUpSystem";
import { resolveActuators } from "../../dda/DifficultyConfig";
import { POWERUP_CONFIG } from "../gameplayConfig";
import { drawArenaBackground } from "../render/ArenaBackground";
import { audio } from "../../audio/AudioSystem";
import { EffectSystem } from "../systems/EffectSystem";

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
  private spawner!: SpawnSystem;
  private collisions!: CollisionSystem;
  private score!: ScoreSystem;
  private lives!: LivesSystem;
  private hud!: HudSystem;
  private performance!: PerformanceMonitor;
  private powerUps!: PowerUpEffects;
  private drops!: PowerUpSystem;
  private effects!: EffectSystem;

  private startedAt: number | null = null;
  private aimAngle = -Math.PI / 2;
  private hasPointerInput = false;
  private windowPointerX = 0;
  private windowPointerY = 0;
  private finished = false;
  private lastCountdownSecond = 0;

  public constructor() {
    super({ key: "CalibrationScene" });
  }

  public create(): void {
    this.finished = false;
    this.aimAngle = -Math.PI / 2;
    this.hasPointerInput = false;

    audio.attach(this);

    this.effects = new EffectSystem(this);

    this.physics.world.setBounds(
      ARENA.x,
      ARENA.y,
      ARENA.width,
      ARENA.height,
    );

    drawArenaBackground(this);

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
      lineWidth: WEAPON_CONFIG.projectileLineWidth,
    });

    this.spawner = new SpawnSystem(
      this,
      ARENA,
      this.projectiles,
      CALIBRATION_CONFIG.fixedLevel,
    );

    this.powerUps = new PowerUpEffects();

    this.drops = new PowerUpSystem(
      this,
      resolveActuators(CALIBRATION_CONFIG.fixedLevel).powerUpDropChance,
    );

    this.collisions = new CollisionSystem(
      this.projectiles,
      this.spawner.getEnemies(),
      this.player,
      this.drops,
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

    this.game.canvas.ownerDocument.addEventListener(
      "mousemove",
      this.handleWindowPointer,
    );

    this.events.once("shutdown", () => {
      this.game.canvas.ownerDocument.removeEventListener(
        "mousemove",
        this.handleWindowPointer,
      );
    });
  }

  public update(time: number): void {
    if (this.finished) {
      return;
    }

    if (this.startedAt === null) {
      this.startedAt = time;

      return;
    }

    const elapsed = time - this.startedAt;

    this.updateCountdown(elapsed);

    if (elapsed >= CALIBRATION_CONFIG.durationMs) {
      this.finish(time, elapsed);

      return;
    }

    const pointer = this.input.activePointer;

    this.updateAimAngle();

    const movement = resolveMovementVector(this.readMovementInput());
    this.player.update(time, movement, this.aimAngle);

    const shots = this.weapon.tryFire(
      time,
      pointer.isDown,
      this.player.getX(),
      this.player.getY(),
      this.aimAngle,
    );

    for (const shot of shots) {
      this.projectiles.spawn(shot);
    }

    if (shots.length > 0) {
      audio.playSfx("playerFire");
      this.performance.recordShotFired();
    }

    this.projectiles.update(time);

    this.spawner.update(time, this.player.getX(), this.player.getY());

    for (const enemy of this.spawner.getEnemies()) {
      enemy.update(time, this.player.getX(), this.player.getY());
    }

    const result = this.collisions.update();

    this.performance.recordShotsHit(result.shotsHit);
    this.effects.update(time);
    this.drops.update(time);
    this.applyPowerUpEffects(time);

    for (const kill of result.killed) {
      this.effects.burst(kill.x, kill.y, kill.color, time);
      this.score.addKill(kill.type);
      this.performance.recordKill(kill.type);

      this.spawner
        .getPersistence()
        .recordDeath(kill.persistenceHandle, time);

      if (kill.type === "splitter") {
        this.spawner.spawnSplitChildren(kill.x, kill.y, time);
      }

      if (kill.segments !== undefined) {
        for (const segment of kill.segments) {
          this.effects.burst(segment.x, segment.y, kill.color, time);
        }
      }

      if (kill.canDrop && this.drops.rollForDrop(kill.x, kill.y, time)) {
        this.performance.recordPowerUpSpawned();
      }
    }

    for (const type of result.collected) {
      audio.playSfx("powerUp");
      this.powerUps.collect(type, time);
      this.performance.recordPowerUpCollected();
    }

    if (result.playerHit && !this.player.isInvincible(time)) {
      if (this.powerUps.consumeShield()) {
        audio.playSfx("shieldAbsorb"); 
        this.performance.recordShieldHit();

        if (result.playerHitBy !== null) {
          this.effects.burst(
            result.playerHitBy.x,
            result.playerHitBy.y,
            result.playerHitBy.color,
            time,
          );

          this.spawner
            .getPersistence()
            .recordClearedByDeath(result.playerHitBy.persistenceHandle, time);
        }
      } else {
        audio.playSfx("playerDeath");
        this.effects.playerBurst(
          this.player.getX(),
          this.player.getY(),
          PALETTE.player,
          time,
        );

        this.cameras.main.shake(180, 0.006)

        for (const cleared of this.spawner.clearAllWithEffects(time)) {
          this.effects.burst(cleared.x, cleared.y, cleared.color, time);
        }

        this.lives.loseLife();
        this.performance.recordLifeLost();

        this.player.respawn(
          time,
          ARENA.x + ARENA.width / 2,
          ARENA.y + ARENA.height / 2,
        );

        if (!this.lives.isAlive()) {
          this.finish(time, elapsed);

          return;
        }
      }
    }

    this.hud.update({
      score: this.score.getScore(),
      livesRemaining: this.lives.getLivesRemaining(),
      waveNumber: 0,
      remainingMs: CALIBRATION_CONFIG.durationMs - elapsed,
      isIntermission: false,
      isCalibration: true,
      isTutorial: false,
    });
  }

  // hands calibration summary off to session manager
  private finish(time: number, elapsed: number): void {
    this.finished = true;

    const summary = this.performance.summarise(
      0,
      elapsed,
      this.spawner.getSpawnedThisWave(),
      this.spawner.getPersistence().summarise(time),
    );

    session.setCalibration(summary);
    this.spawner.clearAll();

    console.log("Calibration complete", summary);

    this.scene.start("GameScene");
  }

  private markPointerInput(): void {
    this.hasPointerInput = true;
  }

  private readonly handleWindowPointer = (event: MouseEvent): void => {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();

    const scaleX = this.game.scale.width / rect.width;
    const scaleY = this.game.scale.height / rect.height;

    this.windowPointerX = (event.clientX - rect.left) * scaleX;
    this.windowPointerY = (event.clientY - rect.top) * scaleY;
    this.hasPointerInput = true;
  };

  private updateAimAngle(): void {
    if (!this.hasPointerInput) {
      return;
    }

    const deltaX = this.windowPointerX - this.player.getX();
    const deltaY = this.windowPointerY - this.player.getY();

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

  private updateCountdown(elapsed: number): void {
    const remaining = CALIBRATION_CONFIG.durationMs - elapsed;
    const second = Math.ceil(remaining / 1000);

    if (second > WAVE_CONFIG.countdownSeconds || second < 1) {
      return;
    }

    if (second === this.lastCountdownSecond) {
      return;
    }

    this.lastCountdownSecond = second;

    audio.playSfx("beep");
  }

  private applyPowerUpEffects(time: number): void {
    if (this.powerUps.isSpeedActive(time)) {
      this.player.setSpeedMultiplier(POWERUP_CONFIG.speedMultiplier);
    } else {
      this.player.clearSpeedMultiplier();
    }

    this.player.setShieldActive(this.powerUps.hasShield());

    if (this.powerUps.isFireRateActive(time)) {
      this.weapon.setFireRateMultiplier(POWERUP_CONFIG.fireRateMultiplier);
    } else {
      this.weapon.clearFireRateMultiplier();
    }
  }
}