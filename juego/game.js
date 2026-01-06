import { fondoX, fondoY } from "./utils/constants.js";
import { generateIslandMap, drawMap, isLand } from "./utils/map.js";
import { createPlayer } from "./utils/player.js";
import {
  createTrees,
  generateNonOverlappingTreePositions,
  generatePassiveAnimals,
  generateHostileAnimals,
  updateAnimals,
} from "./utils/entities.js";
import { createHearts, updateHeartsPosition } from "./utils/ui.js";
import {
  createInventorySlots,
  toggleInventoryVisibility,
  updateInventoryPositions,
  setInventoryBackground,
} from "./utils/inventory.js";

console.log("GAME JS LOADED - MODULARIZED");

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth - 100,
  height: window.innerHeight - 100,
  parent: "juego",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

let player, cursors, wasdKeys;
let inventoryVisible = false;

const numPassiveAnimals = 30;
const numHostileAnimals = 25;
const lives = 3;

function preload() {
  this.load.spritesheet("player", "./img/oso.png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  this.load.image("vida", "./img/corazon.png");
  this.load.image("grass", "./img/grass6.png");
  this.load.image("sand", "./img/sand3.png");
  this.load.image("water", "./img/water4.png");
  this.load.image("arbol", "./img/arbol3.png");
  this.load.image("tocon", "./img/arbol_tronco2.png");
  this.load.spritesheet("rabbit", "./img/conejo.png", {
    frameWidth: 16,
    frameHeight: 16,
  });
  this.load.spritesheet("gat", "./img/gato.png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  this.load.spritesheet("pig", "./img/chancho.png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  this.load.spritesheet("cow", "./img/vaca.png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  this.load.spritesheet("chicken", "./img/gallina.png", {
    frameWidth: 16,
    frameHeight: 16,
  });
  this.load.spritesheet("sheep", "./img/oveja.png", {
    frameWidth: 32,
    frameHeight: 32,
  });

  this.load.spritesheet("wolf", "./img/lobo.png", {
    frameWidth: 64,
    frameHeight: 32,
  });
  this.load.spritesheet("boar", "./img/jabali.png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  this.load.spritesheet("tiger", "./img/tigre.png", {
    frameWidth: 55,
    frameHeight: 27,
  });

  this.load.image("item1", "./img/madera.png");
  this.load.image("inventory", "./img/inventario 2.png");
}

function create() {
  generateIslandMap();
  drawMap(this);

  player = createPlayer(this);

  this.animals = generatePassiveAnimals(this, numPassiveAnimals);
  generateHostileAnimals(this, numHostileAnimals, player);

  const treePositions = generateNonOverlappingTreePositions(200);
  this.trees = createTrees(this, treePositions);
  this.physics.add.collider(player, this.trees);

  createHearts(this, lives);

  const inventoryBackground = this.add.image(player.x, player.y, "inventory");
  inventoryBackground.setVisible(false);
  setInventoryBackground(inventoryBackground);
  createInventorySlots(this);

  cursors = this.input.keyboard.createCursorKeys();
  wasdKeys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    right: Phaser.Input.Keyboard.KeyCodes.D,
  });

  this.input.keyboard.on("keydown-E", () => {
    inventoryVisible = !inventoryVisible;
    toggleInventoryVisibility(inventoryVisible);
  });

  this.cameras.main.startFollow(player);
  this.cameras.main.setZoom(2.5);
  this.cameras.main.setBounds(0, 0, fondoX, fondoY);
  this.physics.world.setBounds(0, 0, fondoX, fondoY);
}

function update() {
  player.setVelocity(0);
  const speed = 100;

  let newVelX = 0;
  let newVelY = 0;

  if (cursors.left.isDown || wasdKeys.left.isDown) {
    newVelX = -speed;
    player.flipX = false;
  } else if (cursors.right.isDown || wasdKeys.right.isDown) {
    newVelX = speed;
    player.flipX = true;
  }

  if (cursors.up.isDown || wasdKeys.up.isDown) {
    newVelY = -speed;
  } else if (cursors.down.isDown || wasdKeys.down.isDown) {
    newVelY = speed;
  }

  if (isLand(player.x + newVelX * 0.1, player.y)) {
    player.setVelocityX(newVelX);
  }
  if (isLand(player.x, player.y + newVelY * 0.1)) {
    player.setVelocityY(newVelY);
  }

  if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
    player.anims.play("bear_walk", true);
  } else {
    player.anims.play("bear_walk", false);
  }

  updateHeartsPosition(player);
  if (inventoryVisible) {
    updateInventoryPositions(player.x, player.y);
  }

  updateAnimals(this);
}
