import { fondoX, fondoY } from './constants.js';
import { isFertileLand, isLand } from './map.js';
import { addItemToInventory } from './inventory.js';
import { loseLife, getLives } from './ui.js';

const numTrees = 150;
const detectionRange = 250;
const hostilesSpeed = 90;
const animalSpeed = 150;

// TREES
export function createTrees(scene, treePositions) {
  const trees = scene.physics.add.group();

  treePositions.forEach((position) => {
    if (isFertileLand(position.x, position.y)) {
      const tree = trees.create(position.x, position.y, "arbol").setInteractive();
      tree.setImmovable(true);
      tree.setOrigin(0.5, 1);
      tree.body.setSize(tree.width * 0.2, tree.height * 0.2);
      tree.body.setOffset(tree.width * 0.42, tree.height * 0.8);
      tree.clickCount = 0;

      tree.on("pointerdown", () => handleTreeClick(scene, tree));
    }
  });

  return trees;
}

function handleTreeClick(scene, tree) {
  tree.clickCount++;

  const shakeTween = scene.tweens.add({
    targets: tree,
    angle: { from: -10, to: 10 },
    duration: 100,
    yoyo: true,
    repeat: 3,
    onComplete: () => {
      tree.setAngle(0);
      if (tree.clickCount >= 3) {
        shakeTween.stop();
        tree.setTexture("tocon");
        tree.disableInteractive();

        addItemToInventory(scene, "item1");

        scene.time.delayedCall(10000, () => {
          tree.setTexture("arbol");
          tree.setInteractive();
          tree.clickCount = 0;
        });
      }
    },
  });
}

export function generateNonOverlappingTreePositions(minDistance) {
  const positions = [];
  let attempts = 0;

  for (let i = 0; i < numTrees; i++) {
    let validPosition = false;
    let x, y;
    attempts = 0;

    while (!validPosition && attempts < 100) {
      attempts++;
      x = Phaser.Math.Between(50, fondoX - 50);
      y = Phaser.Math.Between(50, fondoY - 50);

      if (!isFertileLand(x, y)) continue;

      validPosition = true;

      for (let pos of positions) {
        const distance = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }
    }

    if (validPosition) positions.push({ x: x, y: y });
  }
  return positions;
}

// PASSIVE ANIMALS
export function generatePassiveAnimals(scene, numAnimals) {
  const animals = scene.physics.add.group();
  let attempts = 0;
  for (let i = 0; i < numAnimals; i++) {
    let x, y;
    let valid = false;
    attempts = 0;

    do {
      attempts++;
      x = Phaser.Math.Between(100, fondoX - 100);
      y = Phaser.Math.Between(100, fondoY - 100);

      if (isLand(x, y) && isWithinCameraView(x, y, scene.cameras.main)) {
        valid = true;
      }
    } while (!valid && attempts < 50);

    if (valid) {
      const animal = animals.create(x, y, "rabbit").setInteractive();
      scene.anims.create({
        key: "rabbit_walk",
        frames: scene.anims.generateFrameNumbers("rabbit", { start: 0, end: 1 }),
        frameRate: 9,
        repeat: -1,
      });
      moveAnimalRandomly(scene, animal);
    }
  }
  return animals;
}

function moveAnimalRandomly(scene, animal) {
  const directions = ["left", "right", "up", "down"];
  const direction = Phaser.Utils.Array.GetRandom(directions);

  let velocityX = 0;
  let velocityY = 0;

  if (direction === "left") {
    velocityX = -animalSpeed;
    animal.anims.play("rabbit_walk");
    animal.flipX = false;
  } else if (direction === "right") {
    velocityX = animalSpeed;
    animal.anims.play("rabbit_walk");
    animal.flipX = true;
  }

  if (direction === "up") {
    velocityY = -animalSpeed;
    animal.anims.play("rabbit_walk");
  } else if (direction === "down") {
    velocityY = animalSpeed;
    animal.anims.play("rabbit_walk");
  }

  const nextX = animal.x + velocityX * 0.5;
  const nextY = animal.y + velocityY * 0.5;

  if (isLand(nextX, nextY)) {
    animal.setVelocity(velocityX, velocityY);
  } else {
    animal.setVelocity(0, 0);
  }

  scene.time.delayedCall(Phaser.Math.Between(1000, 3000), () =>
    moveAnimalRandomly(scene, animal)
  );
}

// HOSTILE ANIMALS
export function generateHostileAnimals(scene, numAnimals, player) {
  const animals = scene.physics.add.group();
  let attempts = 0;

  for (let i = 0; i < numAnimals; i++) {
    let x, y;
    let valid = false;
    attempts = 0;

    do {
      attempts++;
      x = Phaser.Math.Between(50, fondoX - 50);
      y = Phaser.Math.Between(50, fondoY - 50);

      if (isLand(x, y) && isWithinCameraView(x, y, scene.cameras.main)) {
        valid = true;
      }
    } while (!valid && attempts < 50);

    if (valid) {
      const animal = animals.create(x, y, "wolf").setInteractive().setScale(0.5);
      scene.anims.create({
        key: "wolf_walk",
        frames: scene.anims.generateFrameNumbers("wolf", { start: 0, end: 4 }),
        frameRate: 6,
        repeat: -1,
      });

      scene.physics.add.overlap(player, animal, () => handleHostileAnimal(scene, animal, player), null, scene);

      scene.time.addEvent({
        delay: 100,
        callback: () => moveWolfTowardsPlayer(scene, animal, player),
        loop: true,
      });
    }
  }
  return animals;
}

function moveWolfTowardsPlayer(scene, wolf, player) {
  const distance = Phaser.Math.Distance.Between(wolf.x, wolf.y, player.x, player.y);

  if (distance < detectionRange) {
    const directionX = player.x - wolf.x;
    const directionY = player.y - wolf.y;
    const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
    const normalizedX = directionX / magnitude;
    const normalizedY = directionY / magnitude;

    const nextX = wolf.x + normalizedX * 10;
    const nextY = wolf.y + normalizedY * 10;

    if (isLand(nextX, nextY)) {
      wolf.setVelocity(normalizedX * hostilesSpeed, normalizedY * hostilesSpeed);
    } else {
      wolf.setVelocity(0);
    }

    if (directionX > 0) wolf.flipX = true;
    else wolf.flipX = false;

    if (!wolf.anims.isPlaying || wolf.anims.currentAnim.key !== "wolf_walk") {
      wolf.anims.play("wolf_walk");
    }
  } else {
    wolf.setVelocity(0);
  }
}

function handleHostileAnimal(scene, animal, player) {
  const currentLives = getLives();
  if (currentLives != 0) {
    if (!player.invulnerable) {
      loseLife(); // UI update
      player.invulnerable = true;
      scene.time.delayedCall(2000, () => {
        player.invulnerable = false;
      });
    }
  }
}

function isWithinCameraView(x, y, camera) {
  const cameraBounds = camera.worldView;
  return (
    x >= cameraBounds.x &&
    x <= cameraBounds.x + cameraBounds.width &&
    y >= cameraBounds.y &&
    y <= cameraBounds.y + cameraBounds.height
  );
}
