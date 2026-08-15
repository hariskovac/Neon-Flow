import Phaser from "phaser";

import { Player } from "../entities/Player";
import { TargetDummy } from "../entities/TargetDummy";
import type { Enemy } from "../entities/enemies/Enemy";
import {
  ARENA,
  DEPTH,
  PALETTE,
  WEAPON_CONFIG,
} from "../gameplayConfig";
import { CollisionSystem } from "../systems/CollisionSystem";
import type { MovementInput } from "../systems/PlayerMovement";
import { resolveMovementVector } from "../systems/PlayerMovement";
import { PowerUpSystem } from "../systems/PowerUpSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import { TutorialPrompt } from "../tutorial/TutorialPrompt";
import type { TutorialContext, TutorialStep } from "../tutorial/TutorialStep";
import { KeyCapDisplay } from "../tutorial/KeyCapDisplay";

type MovementKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export class TutorialScene extends Phaser.Scene {
  private static readonly DEFAULT_MINIMUM_MS = 1200;

  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: MovementKeys;
  private weapon!: WeaponSystem;
  private projectiles!: ProjectileSystem;
  private drops!: PowerUpSystem;
  private collisions!: CollisionSystem;
  private prompt!: TutorialPrompt;

  private steps: TutorialStep[] = [];
  private stepIndex = 0;
  private stepStartedAt = 0;
  private keyCaps: KeyCapDisplay | null = null;

  private targets: Enemy[] = [];
  private aimAngle = -Math.PI / 2;
  private hasPointerInput = false;

  private readonly keysUsed = new Set<string>();

  public constructor() {
    super({ key: "TutorialScene" });
  }

  public create(): void {
    this.stepIndex = 0;
    this.stepStartedAt = 0;
    this.aimAngle = -Math.PI / 2;
    this.hasPointerInput = false;
    this.keysUsed.clear();
    this.targets = [];

    this.physics.world.setBounds(ARENA.x, ARENA.y, ARENA.width, ARENA.height);
    this.drawArena();

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

    const enemyProjectiles = new ProjectileSystem(this, ARENA, {
      projectileRadius: WEAPON_CONFIG.projectileRadius,
      projectileLifetimeMs: WEAPON_CONFIG.projectileLifetimeMs,
      maxActiveProjectiles: 8,
      color: PALETTE.enemyProjectile,
    });

    this.drops = new PowerUpSystem(this, 0);

    this.collisions = new CollisionSystem(
      this.projectiles,
      enemyProjectiles,
      this.targets,
      this.player,
      this.drops,
    );

    this.prompt = new TutorialPrompt(this);
    this.registerInput();

    this.steps = this.buildSteps();
    this.enterStep(this.time.now);
  }

  public update(time: number): void {
    const context: TutorialContext = {
      scene: this,
      stepStartedAt: this.stepStartedAt,
      now: time,
    };

    const pointer = this.input.activePointer;

    this.updateAimAngle(pointer);
    this.recordKeysUsed();

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
    }

    this.projectiles.update(time);
    this.collisions.update();

    const step = this.steps[this.stepIndex];

    if (step === undefined) {
      return;
    }

    step.onUpdate?.(context);

    const minimum = step.minimumMs ?? TutorialScene.DEFAULT_MINIMUM_MS;

    if (time - this.stepStartedAt < minimum) {
      return;
    }

    if (step.isComplete(context)) {
      step.onExit?.(context);

      this.stepIndex += 1;

      if (this.stepIndex >= this.steps.length) {
        this.finish();

        return;
      }

      this.enterStep(time);
    }
  }

  private buildSteps(): TutorialStep[] {
    return [
      {
        id: "movement",
        title: "Move with WASD",
        body: "Use the movement keys to move around the arena.",
        onEnter: () => {
          this.keyCaps = new KeyCapDisplay(
            this,
            ARENA.x + ARENA.width / 2,
            ARENA.y + ARENA.height - 110,
          );
        },
        onUpdate: () => {
          this.keyCaps?.update(this.keysUsed);
        },
        isComplete: () => this.keysUsed.size >= 4,
        onExit: () => {
          this.keyCaps?.destroy();
          this.keyCaps = null;
        },
      },
      {
        id: "firing",
        title: "Aim with the mouse",
        body: "Hold left click to fire. Destroy the target to continue.",
        onEnter: () => {
          this.targets.push(
            new TargetDummy(
              this,
              ARENA.x + ARENA.width / 2,
              ARENA.y + 150,
            ),
          );
        },
        isComplete: () => this.targets.every((target) => !target.isAlive()),
        onExit: () => {
          this.targets.length = 0;
        },
      },
    ];
  }

  private enterStep(time: number): void {
    const step = this.steps[this.stepIndex];

    if (step === undefined) {
      return;
    }

    this.stepStartedAt = time;
    this.prompt.show(step.title, step.body);

    step.onEnter?.({ scene: this, stepStartedAt: time, now: time });
  }

  private finish(): void {
    this.prompt.hide();
    this.scene.start("CalibrationScene");
  }

  private recordKeysUsed(): void {
    if (this.movementKeys.W.isDown || this.cursors.up.isDown) {
      this.keysUsed.add("up");
    }

    if (this.movementKeys.A.isDown || this.cursors.left.isDown) {
      this.keysUsed.add("left");
    }

    if (this.movementKeys.S.isDown || this.cursors.down.isDown) {
      this.keysUsed.add("down");
    }

    if (this.movementKeys.D.isDown || this.cursors.right.isDown) {
      this.keysUsed.add("right");
    }
  }

  private registerInput(): void {
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
}