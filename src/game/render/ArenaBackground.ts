import Phaser from "phaser";

import { ARENA, GRID_CONFIG, DEPTH, PALETTE } from "../gameplayConfig";

export function drawArenaBackground(scene: Phaser.Scene): void {
  const floor = scene.add.rectangle(
    ARENA.x + ARENA.width / 2,
    ARENA.y + ARENA.height / 2,
    ARENA.width,
    ARENA.height,
    PALETTE.arenaFloor,
  );

  floor.setDepth(DEPTH.arena);

  const grid = scene.add.graphics();

  grid.setDepth(DEPTH.arena);
  grid.lineStyle(GRID_CONFIG.lineWidth, GRID_CONFIG.colour, GRID_CONFIG.alpha);

  for (
    let x = ARENA.x + GRID_CONFIG.cellSize;
    x < ARENA.x + ARENA.width;
    x += GRID_CONFIG.cellSize
  ) {
    grid.lineBetween(x, ARENA.y, x, ARENA.y + ARENA.height);
  }

  for (
    let y = ARENA.y + GRID_CONFIG.cellSize;
    y < ARENA.y + ARENA.height;
    y += GRID_CONFIG.cellSize
  ) {
    grid.lineBetween(ARENA.x, y, ARENA.x + ARENA.width, y);
  }

  const border = scene.add.rectangle(
    ARENA.x + ARENA.width / 2,
    ARENA.y + ARENA.height / 2,
    ARENA.width,
    ARENA.height,
  );

  border.setStrokeStyle(2, PALETTE.arenaBorder);
  border.setDepth(DEPTH.arena);
}