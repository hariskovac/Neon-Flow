import Phaser from "phaser";

import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { CalibrationScene } from "./scenes/CalibrationScene";
import { InstructionsScene } from "./scenes/InstructionsScene";
import { TutorialScene } from "./scenes/TutorialScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  parent: "game-container",

  width: 960,
  height: 540,

  backgroundColor: "#0b1020",

  physics: {
    default: "arcade",

    arcade: {
      gravity: {
        x: 0,
        y: 0,
      },

      debug: false,
    },
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [BootScene, TutorialScene, GameScene, ResultsScene, CalibrationScene, InstructionsScene],
};