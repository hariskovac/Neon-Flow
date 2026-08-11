import Phaser from "phaser";
import { session } from "../../experiment/SessionManager";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super({key: "BootScene"});
  }

  public create(): void {
    session.reset();
    this.scene.start("CalibrationScene");
  }
}