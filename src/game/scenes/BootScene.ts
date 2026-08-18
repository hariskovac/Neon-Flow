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
    this.load.audio(AUDIO_CONFIG.keys.playerSpawn, "audio/sfx-enemy-spawn.wav");
    // this.load.audio(AUDIO_CONFIG.keys.enemyFire, "audio/sfx-enemy-fire.wav");
    this.load.audio(AUDIO_CONFIG.keys.enemySpawn, "audio/sfx-enemy-spawn.wav");
    this.load.audio(AUDIO_CONFIG.keys.enemyHit, "audio/sfx-enemy-hit.wav");
    this.load.audio(AUDIO_CONFIG.keys.enemyDeath, "audio/sfx-enemy-death.wav");
    // this.load.audio(AUDIO_CONFIG.keys.playerHit, "audio/sfx-player-hit.wav");
    this.load.audio(AUDIO_CONFIG.keys.playerDeath, "audio/sfx-player-death.wav");
    this.load.audio(AUDIO_CONFIG.keys.powerUp, "audio/sfx-power-up.wav");
    this.load.audio(AUDIO_CONFIG.keys.shieldAbsorb, "audio/sfx-shield-absorb.wav");
  }

  public create(): void {
    session.reset();
    this.scene.start("TutorialScene");
  }
}