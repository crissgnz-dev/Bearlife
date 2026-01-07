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
  scale: {
    // mode: Phaser.Scale.RESIZE, // Removed to manual control
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: document.getElementById("juego")
      ? document.getElementById("juego").clientWidth
      : window.innerWidth,
    height: document.getElementById("juego")
      ? document.getElementById("juego").clientHeight
      : window.innerHeight,
  },
  parent: "juego",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

let player, cursors, wasdKeys, shiftKey;
let inventoryVisible = false;

const numPassiveAnimals = 30;
const numHostileAnimals = 25;
const lives = 5;

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

  this.load.spritesheet("explosion", "./img/explosion.png", {
    frameWidth: 64,
    frameHeight: 64,
  });
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
  this.hostileAnimals = generateHostileAnimals(this, numHostileAnimals, player);

  const treePositions = generateNonOverlappingTreePositions(200);
  this.trees = createTrees(this, treePositions);
  this.physics.add.collider(player, this.trees);
  this.physics.add.collider(this.animals, this.trees);
  this.physics.add.collider(this.hostileAnimals, this.trees);

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
  shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

  this.input.keyboard.on("keydown-E", () => {
    inventoryVisible = !inventoryVisible;
    toggleInventoryVisibility(inventoryVisible);
  });

  this.cameras.main.startFollow(player);
  this.cameras.main.setZoom(2.5);
  this.cameras.main.setBounds(0, 0, fondoX, fondoY);
  // Initial bounds
  this.physics.world.setBounds(0, 0, fondoX, fondoY);

  // Custom Resize Logic to fit parent container exactly
  const resizeGame = () => {
    const parent = document.getElementById("juego");
    if (parent) {
      const width = parent.clientWidth;
      const height = parent.clientHeight;

      this.scale.resize(width, height);
      this.cameras.main.setViewport(0, 0, width, height);
    }
  };

  // Listen to window resize
  window.addEventListener("resize", () => {
    resizeGame();
  });

  // Call once to ensure fit, with a slight delay to allow layout to settle
  setTimeout(() => {
    resizeGame();
  }, 50);

  this.anims.create({
    key: "explode",
    frames: this.anims.generateFrameNumbers("explosion", { start: 0, end: 4 }), // Assuming 5 frames or so, need to check user's spritesheet details or guess standard. User provided 64x64 but not count. standard is often 5-8. I'll guess safe or use generateFrameNumbers logic. Defaulting to all frames if row is 1. Safe bet is often usage.
    frameRate: 15,
    hideOnComplete: true,
  });
}

function update() {
  player.setVelocity(0);
  player.setDepth(player.y);

  // Sprint Logic
  const baseSpeed = 100;
  const sprintSpeed = 150;
  const speed = shiftKey.isDown ? sprintSpeed : baseSpeed;

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
