import { fondoX, fondoY } from "./constants.js";
import { isLand } from "./map.js";

export function createPlayer(scene) {
  let validPos = false;
  let spawnX, spawnY;

  while (!validPos) {
    spawnX = Phaser.Math.Between(fondoX * 0.2, fondoX * 0.8);
    spawnY = Phaser.Math.Between(fondoY * 0.2, fondoY * 0.8);
    if (isLand(spawnX, spawnY)) {
      validPos = true;
    }
  }

  const player = scene.physics.add
    .sprite(spawnX, spawnY, "player")
    .setScale(0.8);
  player.setCollideWorldBounds(true);

  scene.anims.create({
    key: "bear_walk",
    frames: scene.anims.generateFrameNumbers("player", { start: 0, end: 4 }),
    frameRate: 12,
    repeat: -1,
  });

  player.anims.play("bear_walk");
  return player;
}
