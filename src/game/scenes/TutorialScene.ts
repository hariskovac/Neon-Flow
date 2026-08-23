import Phaser from "phaser";

import { Player } from "../entities/Player";
import { TargetDummy } from "../entities/TargetDummy";
import type { Enemy } from "../entities/enemies/Enemy";
import {
  ARENA,
  DEPTH,
  PALETTE,
  WEAPON_CONFIG,
  HUD_TEXT_STYLE,
  TUTORIAL_CONFIG,
  POWERUP_CONFIG,
  SPAWN_EFFECT_CONFIG,
  SPLITTER_CONFIG,
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
import { Chaser } from "../entities/enemies/Chaser";
import { Dasher } from "../entities/enemies/Dasher";
import { Dodger } from "../entities/enemies/Dodger";
import { Splitter } from "../entities/enemies/Splitter";
import { Shard } from "../entities/enemies/Shard";
import { Winder } from "../entities/enemies/Winder";
import { HudSystem } from "../systems/HudSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
import { resolveActuators } from "../../dda/DifficultyConfig";
import { session } from "../../experiment/SessionManager";
import { generateExampleExplanation } from "../../dda/ExplanationGenerator";
import { TransparencyOverlay } from "../../ui/TransparencyOverlay";
import type { PowerUpType, EnemyType } from "../../types/game";
import { PowerUpEffects } from "../systems/PowerUpEffects";
import { drawArenaBackground } from "../render/ArenaBackground";
import { audio } from "../../audio/AudioSystem";
import { EffectSystem } from "../systems/EffectSystem";
import { SpawnEffect } from "../render/SpawnEffect";
import { SPAWN_APPEARANCE } from "../systems/SpawnSystem";
import { GameClock } from "../systems/GameClock";
import { PauseOverlay } from "../../ui/PauseOverlay";
import { AudioControls } from "../../ui/AudioControls";

type MovementKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export class TutorialScene extends Phaser.Scene {
  private static readonly DEFAULT_MINIMUM_MS = 1200;
  private readonly pendingSpawns: Array<{
    readonly create: () => Enemy;
    readonly readyAt: number;
    readonly effect: SpawnEffect;
  }> = [];

  private readonly spawnEffects: SpawnEffect[] = [];

  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: MovementKeys;
  private weapon!: WeaponSystem;
  private projectiles!: ProjectileSystem;
  private drops!: PowerUpSystem;
  private collisions!: CollisionSystem;
  private prompt!: TutorialPrompt;
  private hud!: HudSystem;
  private score!: ScoreSystem;
  private hitMessageUntil = 0;
  private hitLabel!: Phaser.GameObjects.Text;
  private overlay!: TransparencyOverlay;
  private powerUps!: PowerUpEffects;
  private effects!: EffectSystem;
  private readonly clock = new GameClock();
  private pauseOverlay!: PauseOverlay;

  private steps: TutorialStep[] = [];
  private stepIndex = 0;
  private stepStartedAt = 0;
  private keyCaps: KeyCapDisplay | null = null;
  private readyToStart = false;

  private targets: Enemy[] = [];
  private aimAngle = -Math.PI / 2;
  private hasPointerInput = false;
  private windowPointerX = 0;
  private windowPointerY = 0;
  private stepEntered = false;
  private spacePressed = false;

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

    this.clock.reset();
    this.spawnEffects.length = 0;
    this.pendingSpawns.length = 0;

    audio.attach(this);
    new AudioControls(this);

    this.effects = new EffectSystem(this);

    this.physics.world.setBounds(ARENA.x, ARENA.y, ARENA.width, ARENA.height);
    drawArenaBackground(this);

    this.player = new Player(
      this,
      ARENA.x + ARENA.width / 2,
      ARENA.y + ARENA.height / 2,
    );

    this.weapon = new WeaponSystem();
    this.powerUps = new PowerUpEffects();

    this.projectiles = new ProjectileSystem(this, ARENA, {
      projectileRadius: WEAPON_CONFIG.projectileRadius,
      projectileLifetimeMs: WEAPON_CONFIG.projectileLifetimeMs,
      maxActiveProjectiles: WEAPON_CONFIG.maxActiveProjectiles,
      color: PALETTE.projectile,
      lineWidth: WEAPON_CONFIG.projectileLineWidth,
    });

    this.score = new ScoreSystem();
    this.hud = new HudSystem(this, 5);

    this.hitLabel = this.add.text(
      ARENA.x + ARENA.width / 2,
      ARENA.y + ARENA.height - 60,
      "",
      { ...HUD_TEXT_STYLE, fontSize: "17px", color: PALETTE.textAccent },
    );

    this.hitLabel.setOrigin(0.5, 0.5);
    this.hitLabel.setDepth(DEPTH.overlay);

    this.drops = new PowerUpSystem(this, 0);

    this.collisions = new CollisionSystem(
      this.projectiles,
      this.targets,
      this.player,
      this.drops,
    );

    this.prompt = new TutorialPrompt(this);
    this.pauseOverlay = new PauseOverlay(this);
    this.registerInput();

    this.overlay = new TransparencyOverlay(this);

    for (let index = 0; index < 4; index += 1) {
      this.spawnEffects.push(new SpawnEffect(this));
    }

    this.steps = this.buildSteps();
    this.enterStep(this.clock.now(this.time.now))

    this.events.once("shutdown", () => {
      this.game.canvas.ownerDocument.removeEventListener(
        "mousemove",
        this.handleWindowPointer,
      );
    });
  }

  public update(rawTime: number): void {
    if (this.clock.isPaused()) {
      return;
    }

    const time = this.clock.now(rawTime);

    const context: TutorialContext = {
      scene: this,
      stepStartedAt: this.stepStartedAt,
      now: time,
    };

    const pointer = this.input.activePointer;

    this.updateAimAngle();
    this.recordKeysUsed();

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
      audio.playSfx("playerFire");
      this.projectiles.spawn(shot);
    }

    for (const effect of this.spawnEffects) {
      effect.update(time);
    }

    for (let index = this.pendingSpawns.length - 1; index >= 0; index -= 1) {
      const pending = this.pendingSpawns[index];

      if (time >= pending.readyAt) {
        pending.effect.stop();
        this.targets.push(pending.create());
        this.pendingSpawns.splice(index, 1);
      }
    }

    for (const target of this.targets) {
      target.update(time, this.player.getX(), this.player.getY());
    }

    this.projectiles.update(time);
    this.effects.update(time);
    this.drops.update(time);

    const result = this.collisions.update();

    for (const type of result.collected) {
      audio.playSfx("powerUp");
      this.powerUps.collect(type, time);
    }

    this.applyPowerUpEffects(time);

    for (const kill of result.killed) {
      this.effects.burst(kill.x, kill.y, kill.color, time);

      if (kill.type === "splitter") {
        this.spawnShards(kill.x, kill.y);
      }

      if (kill.segments !== undefined) {
        for (const segment of kill.segments) {
          this.effects.burst(segment.x, segment.y, kill.color, time);
        }
      }
    }

    if (result.playerHit && !this.player.isInvincible(time)) {
      if (this.powerUps.consumeShield()) {
        audio.playSfx("shieldAbsorb"); 
        this.hitLabel.setText("Shield absorbed the hit.");
        this.hitMessageUntil = time + TUTORIAL_CONFIG.hitFlashMs;

        if (result.playerHitBy !== null) {
          this.effects.burst(
            result.playerHitBy.x,
            result.playerHitBy.y,
            result.playerHitBy.color,
            time,
          );
        }
      } else {
        audio.playSfx("playerDeath");
        this.effects.playerBurst(
          this.player.getX(),
          this.player.getY(),
          PALETTE.player,
          time,
        );

        this.player.respawn(
          time,
          ARENA.x + ARENA.width / 2,
          ARENA.y + ARENA.height / 2,
        );

        this.hitMessageUntil = time + TUTORIAL_CONFIG.hitFlashMs;
      }
    }

    if (time >= this.hitMessageUntil) {
      this.hitLabel.setText("");
    } else if (this.hitLabel.text === "") {
      this.hitLabel.setText("Hit! Tutorial lives are unlimited.");
    }

    this.hud.update({
      score: this.score.getScore(),
      livesRemaining: 5,
      waveNumber: 0,
      remainingMs: 0,
      isIntermission: false,
      isCalibration: false,
      isTutorial: true,
    });

    this.advanceStep(context, time);
  }

  private buildSteps(): TutorialStep[] {
    const centerX = ARENA.x + ARENA.width / 2;
    const centerY = ARENA.y + ARENA.height / 2;

    console.log(session.isTransparent());

    const steps: TutorialStep[] = [
      {
        id: "movement",
        title: "Move with WASD",
        body: "Use the movement keys to move around the arena.",
        onEnter: () => {
          this.keyCaps = new KeyCapDisplay(
            this,
            centerX,
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
          this.targets.push(new TargetDummy(this, centerX, ARENA.y + 220));
        },
        isComplete: () => this.allTargetsCleared(),
        onExit: () => this.clearTargets(),
      },
      {
        id: "lives",
        title: "Taking damage",
        body:
          "Enemy attacks and collisions each cost one life during the game. " +
          "You will have five. Lives are unlimited in this tutorial.\n\n" +
          "Press SPACE to continue.",
        onEnter: () => {
          this.spacePressed = false;
        },
        isComplete: () => this.spacePressed,
        minimumMs: 2000,
      },
      {
        id: "chaser",
        title: "Chasers",
        body:
          "Chasers pursue you. They start slow but get faster the longer " +
          "they survive. Destroy them quickly.",
        onEnter: (context) => {
          const positions = [
            { x: ARENA.x + 160, y: ARENA.y + 160 },
            { x: ARENA.x + ARENA.width - 160, y: ARENA.y + 160 },
            { x: ARENA.x + ARENA.width / 2, y: ARENA.y + 140 },
          ];

          for (const point of positions) {
            this.beginSpawn(
              "chaser",
              point.x,
              point.y,
              context.now,
              () => new Chaser(this, point.x, point.y, this.enemySpeedMultiplier()),
            );
          }
        },
        enterDelayMs: 4000,
        isComplete: () => this.allTargetsCleared(),
        onExit: () => this.clearTargets(),
      },
      {
        id: "dodger",
        title: "Dodgers",
        body:
          "Dodgers move towards you and dodge your attacks. " +
          "Try pinning them against walls or spraying them with fire.",
        onEnter: (context) => {
          const positions = [
            { x: centerX - 260, y: centerY - 200 },
            { x: centerX + 260, y: centerY - 200 },
            { x: centerX, y: centerY - 280 },
          ];

          for (const point of positions) {
            this.beginSpawn(
              "dodger",
              point.x,
              point.y,
              context.now,
              () =>
                new Dodger(
                  this,
                  point.x,
                  point.y,
                  this.projectiles,
                  this.enemySpeedMultiplier(),
                ),
            );
          }
        },
        enterDelayMs: 4000,
        isComplete: () => this.allTargetsCleared(),
        minimumMs: TUTORIAL_CONFIG.dodgerMinimumMs,
        onExit: () => this.clearTargets(),
      },
      {
        id: "dasher",
        title: "Dashers",
        body:
          "Dashers lock onto your position, then charge. Dodge the dash and " +
          "attack while they recover.",
        onEnter: (context) => {
          const positions = [
            { x: ARENA.x + 200, y: ARENA.y + 200 },
            { x: ARENA.x + ARENA.width - 200, y: ARENA.y + ARENA.height - 200 },
          ];

          for (const point of positions) {
            this.beginSpawn(
              "dasher",
              point.x,
              point.y,
              context.now,
              () =>
                new Dasher(
                  this,
                  point.x,
                  point.y,
                  this.enemySpeedMultiplier(),
                  context.now,
                ),
            );
          }
        },
        enterDelayMs: 4000,
        isComplete: () => this.allTargetsCleared(),
        onExit: () => this.clearTargets(),
      },
      {
        id: "splitter",
        title: "Splitters",
        body:
          "Splitters move steadily, but break into two smaller shards when " +
          "destroyed. Clear all three to continue. ",
        enterDelayMs: TUTORIAL_CONFIG.enemyIntroDelayMs,
        onEnter: (context) => {
          const spawnX = ARENA.x + 160;
          const spawnY = ARENA.y + ARENA.height - 160;

          this.beginSpawn(
            "splitter",
            spawnX,
            spawnY,
            context.now,
            () =>
              new Splitter(this, spawnX, spawnY, this.enemySpeedMultiplier()),
          );
        },
        isComplete: () => this.allTargetsCleared(),
        onExit: () => this.clearTargets(),
      },
      {
        id: "winder",
        title: "Winders",
        body:
          "Winders weave toward you in a chain. The tail cannot hurt you. " +
          "Shoot the head to destroy them. ",
        enterDelayMs: TUTORIAL_CONFIG.enemyIntroDelayMs,
        onEnter: (context) => {
          const spawnX = ARENA.x + ARENA.width - 200;
          const spawnY = ARENA.y + ARENA.height / 2;

          this.beginSpawn(
            "winder",
            spawnX,
            spawnY,
            context.now,
            () =>
              new Winder(
                this,
                spawnX,
                spawnY,
                this.enemySpeedMultiplier(),
                Math.atan2(
                  ARENA.y + ARENA.height / 2 - spawnY,
                  ARENA.x + ARENA.width / 2 - spawnX,
                ),
              ),
          );
        },
        isComplete: () => this.allTargetsCleared(),
        onExit: () => this.clearTargets(),
      },
      {
        id: "powerUpsIntro",
        title: "Power-ups",
        body:
          "Power-ups can appear when you defeat enemies. Collect one by " +
          "touching it.",
        isComplete: (context) => context.now - context.stepStartedAt > 3000,
        minimumMs: 3000,
      },
      this.buildPowerUpStep(
        "shield", 
        "Shield", 
        "Blocks the next hit you take.",
        centerX - 180,
        centerY + 60,
      ),
      this.buildPowerUpStep(
        "speed",
        "Speed Boost",
        "Temporarily increases your movement speed.",
        centerX + 180,
        centerY + 60,
      ),
      this.buildPowerUpStep(
        "fireRate",
        "Rapid Fire",
        "Temporarily increases your firing rate.",
        centerX,
        centerY + 130,
      ),
      {
        id: "adaptiveDifficulty",
        title: "Adaptive difficulty",
        body:
          "During the game, the difficulty may increase or decrease based " +
          "on how you are performing.",
        isComplete: (context) => context.now - context.stepStartedAt > 6000,
        minimumMs: 6000,
      },
      {
        id: "transparencyExample",
        title: "Between waves",
        body:
          "You will be shown whether the difficulty changed, what changed, " +
          "and why. It will look like this. Press SPACE to continue.",
        onEnter: () => {
          this.spacePressed = false;
          this.overlay.show(generateExampleExplanation());
        },
        isComplete: () => this.spacePressed,
        minimumMs: 2000,
        onExit: () => {
          this.overlay.hide();
        },
      },
      {
        id: "ready",
        title: "Ready",
        body:
          "You will now play a short calibration round, which sets your " +
          "starting difficulty. Press SPACE to begin.",
        onEnter: () => {
          this.readyToStart = false;
        },
        isComplete: () => this.readyToStart,
      },
    ];

    return steps.filter(
      (step) => step.id !== "transparencyExample" || session.isTransparent(),
    );
  }

  private enterStep(time: number): void {
    const step = this.steps[this.stepIndex];

    if (step === undefined) {
      return;
    }

    this.stepStartedAt = time;
    this.stepEntered = false;
    this.prompt.show(step.title, step.body);

    if ((step.enterDelayMs ?? 0) <= 0) {
      this.runStepEnter(step, time);
    }
  }

  private runStepEnter(step: TutorialStep, time: number): void {
    this.stepEntered = true;

    step.onEnter?.({ scene: this, stepStartedAt: this.stepStartedAt, now: time });
  }

  private advanceStep(context: TutorialContext, time: number): void {
    const step = this.steps[this.stepIndex];

    if (step === undefined) {
      return;
    }

    if (!this.stepEntered) {
      if (time - this.stepStartedAt < (step.enterDelayMs ?? 0)) {
        return;
      }

      this.runStepEnter(step, time);
    }

    step.onUpdate?.(context);

    const minimum = step.minimumMs ?? TutorialScene.DEFAULT_MINIMUM_MS;

    if (time - this.stepStartedAt < minimum) {
      return;
    }

    if (!step.isComplete(context)) {
      return;
    }

    step.onExit?.(context);

    this.stepIndex += 1;

    if (this.stepIndex >= this.steps.length) {
      this.finish();

      return;
    }

    this.enterStep(time);
  }

  private buildPowerUpStep(
    type: PowerUpType,
    title: string,
    body: string,
    x: number,
    y: number,
  ): TutorialStep {
    return {
      id: `powerUp-${type}`,
      title,
      body,
      onEnter: () => {
        this.drops.placePermanent(x, y, type);
      },
      isComplete: () => this.drops.getDrops().length === 0,
    };
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

  private beginSpawn(
    type: EnemyType,
    x: number,
    y: number,
    time: number,
    create: () => Enemy,
  ): void {
    const effect = this.spawnEffects.find((candidate) => !candidate.isActive());

    if (effect === undefined) {
      this.targets.push(create());

      return;
    }

    const appearance = SPAWN_APPEARANCE[type];

    effect.start(x, y, appearance.outline, appearance.color, time);
    audio.playSfx("enemySpawn");

    this.pendingSpawns.push({
      create,
      readyAt: time + SPAWN_EFFECT_CONFIG.durationMs,
      effect,
    });
  }

  private spawnShards(x: number, y: number): void {
    const half = SPLITTER_CONFIG.shardSeparation / 2;
    const multiplier = this.enemySpeedMultiplier();

    const first = new Shard(this, x - half, y, multiplier, false);
    const second = new Shard(this, x + half, y, multiplier, false);

    first.setPartner(second);
    second.setPartner(first);

    this.targets.push(first, second);
  }

  private finish(): void {
    this.prompt.hide();
    session.setPhase("calibration");
    this.scene.start("CalibrationScene");
  }

  private recordKeysUsed(): void {
    const before = this.keysUsed.size;

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

    if (before === 0 && this.keysUsed.size > 0) {
      audio.unlock();
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

    keyboard.on("keydown-SPACE", () => {
      this.spacePressed = true;
    });

    this.cursors = keyboard.createCursorKeys();

    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", this.markPointerInput, this);
    this.input.on("pointerdown", this.markPointerInput, this);

    this.game.canvas.ownerDocument.addEventListener(
      "mousemove",
      this.handleWindowPointer,
    );

    this.cursors = keyboard.createCursorKeys();

    keyboard.on("keydown-ESC", this.togglePause, this);

    keyboard.on("keydown-SPACE", () => {
      this.readyToStart = true;
    });
  }

  private togglePause(): void {
    const rawTime = this.time.now;

    if (this.clock.isPaused()) {
      this.clock.resume(rawTime);
      this.physics.resume();
      this.pauseOverlay.setVisible(false);
      audio.setPaused(false);
    } else {
      this.clock.pause(rawTime);
      this.physics.pause();
      this.pauseOverlay.setVisible(true);
      audio.setPaused(true);
    }
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

  private markPointerInput(): void {
    this.hasPointerInput = true;
  }

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

  private enemySpeedMultiplier(): number {
    return resolveActuators(TUTORIAL_CONFIG.enemyLevel).enemySpeedMultiplier;
  }

  private allTargetsCleared(): boolean {
    if (this.pendingSpawns.length > 0) {
      return false;
    }

    return this.targets.length > 0 && this.targets.every((t) => !t.isAlive());
  }

  private clearTargets(): void {
    for (const target of this.targets) {
      target.despawn();
    }

    this.targets.length = 0;
  }
}