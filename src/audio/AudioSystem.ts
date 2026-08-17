import Phaser from "phaser";

import { AUDIO_CONFIG } from "../game/gameplayConfig";

type SfxName = keyof typeof AUDIO_CONFIG.levels;

export class AudioSystem {
  private scene: Phaser.Scene | null = null;
  private music: Phaser.Sound.BaseSound | null = null;

  private unlocked = false;
  private musicEnabled = true;
  private sfxEnabled = true;

  private readonly lastPlayedAt = new Map<string, number>();

  public attach(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  public unlock(): void {
    if (this.unlocked) {
      return;
    }

    this.unlocked = true;

    this.startMusic();
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public playSfx(name: SfxName): void {
    if (!this.unlocked || !this.sfxEnabled || this.scene === null) {
      return;
    }

    const now = this.scene.time.now;
    const last = this.lastPlayedAt.get(name) ?? Number.NEGATIVE_INFINITY;

    if (now - last < AUDIO_CONFIG.minRepeatMs[name]) {
      return;
    }

    this.lastPlayedAt.set(name, now);

    this.scene.sound.play(AUDIO_CONFIG.keys[name], {
      volume: AUDIO_CONFIG.sfxVolume * AUDIO_CONFIG.levels[name],
    });
  }

  public startMusic(): void {
    if (!this.unlocked || !this.musicEnabled || this.scene === null) {
      return;
    }

    if (this.music !== null && this.music.isPlaying) {
      return;
    }

    if (!this.scene.cache.audio.exists(AUDIO_CONFIG.keys.music)) {
      return;
    }

    this.music = this.scene.sound.add(AUDIO_CONFIG.keys.music, {
      loop: true,
      volume: AUDIO_CONFIG.musicVolume,
    });

    this.music.play();
  }

  public stopMusic(): void {
    if (this.music === null) {
      return;
    }

    this.music.stop();
    this.music = null;
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;

    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  public setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public resetThrottles(): void {
    this.lastPlayedAt.clear();
  }
}

export const audio = new AudioSystem();