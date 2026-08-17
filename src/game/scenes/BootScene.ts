import Phaser from "phaser";
import { session } from "../../experiment/SessionManager";
import { AUDIO_CONFIG } from "../gameplayConfig";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super({key: "BootScene"});
  }

  public preload(): void {
    this.load.setBaseURL(import.meta.env.BASE_URL);

    this.load.audio(AUDIO_CONFIG.keys.music, "audio/music.ogg");
    this.load.audio(AUDIO_CONFIG.keys.playerFire, "audio/sfx-player-fire.wav");
    // this.load.audio(AUDIO_CONFIG.keys.enemyFire, "audio/enemy-fire.wav");
    // this.load.audio(AUDIO_CONFIG.keys.enemySpawn, "audio/enemy-spawn.wav");
    // this.load.audio(AUDIO_CONFIG.keys.enemyDeath, "audio/enemy-death.wav");
    // this.load.audio(AUDIO_CONFIG.keys.playerHit, "audio/player-hit.wav");
    // this.load.audio(AUDIO_CONFIG.keys.playerDeath, "audio/player-death.wav");
    // this.load.audio(AUDIO_CONFIG.keys.powerUpPickup, "audio/powerup.wav");
  }

  public create(): void {
    session.reset();
    this.scene.start("TutorialScene");
  }
}