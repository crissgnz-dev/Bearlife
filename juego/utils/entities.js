import { fondoX, fondoY, TILE_SIZE, MAP_COLS, MAP_ROWS } from "./constants.js";
import { isFertileLand, isLand } from "./map.js";
import { addItemToInventory } from "./inventory.js";
import { loseLife, getLives } from "./ui.js";

const numTrees = 150;
const detectionRange = 250;
const hostilesSpeed = 100;
const animalSpeed = 150;

export function createTrees(scene, treePositions) {
  const trees = scene.physics.add.group();

  treePositions.forEach((position) => {
    if (isFertileLand(position.x, position.y)) {
      const tree = trees
        .create(position.x, position.y, "arbol")
        .setInteractive();
      tree.setScale(1.5);
      tree.setImmovable(true);
      tree.setOrigin(0.5, 1);
      tree.body.setSize(tree.width * 0.5, tree.height * 0.2);
      tree.body.setOffset(tree.width * 0.25, tree.height * 0.8);
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
      const gridX = Phaser.Math.Between(1, MAP_COLS - 2);
      const gridY = Phaser.Math.Between(1, MAP_ROWS - 2);

      x = gridX * TILE_SIZE + TILE_SIZE / 2;
      y = gridY * TILE_SIZE + TILE_SIZE / 2;

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

export function generatePassiveAnimals(scene, numAnimals) {
  const animals = scene.physics.add.group();
  let attempts = 0;
  for (let i = 0; i < numAnimals; i++) {
    let x, y;
    let valid = false;
    attempts = 0;

    do {
      attempts++;
      const gridX = Phaser.Math.Between(2, MAP_COLS - 3);
      const gridY = Phaser.Math.Between(2, MAP_ROWS - 3);

      x = gridX * TILE_SIZE + TILE_SIZE / 2;
      y = gridY * TILE_SIZE + TILE_SIZE / 2;

      if (isLand(x, y)) {
        valid = true;
      }
    } while (!valid && attempts < 50);

    if (valid) {
      const animalType = Phaser.Math.Between(0, 5);
      let animal;
      let animKey = "";
      let frameRate = 8;

      if (animalType === 0) {
        animal = animals.create(x, y, "rabbit").setInteractive();
        animal.animalType = "rabbit";
        animKey = "rabbit_walk";
        frameRate = 9;
      } else if (animalType === 1) {
        animal = animals.create(x, y, "gat").setInteractive().setScale(0.8);
        animal.animalType = "gat";
        animKey = "gat_walk";
      } else if (animalType === 2) {
        animal = animals.create(x, y, "pig").setInteractive();
        animal.animalType = "pig";
        animKey = "pig_walk";
      } else if (animalType === 3) {
        animal = animals.create(x, y, "chicken").setInteractive();
        animal.animalType = "chicken";
        animKey = "chicken_walk";
      } else if (animalType === 4) {
        animal = animals.create(x, y, "cow").setInteractive().setScale(0.8);
        animal.animalType = "cow";
        animKey = "cow_walk";
      } else if (animalType === 5) {
        animal = animals.create(x, y, "sheep").setInteractive().setScale(0.8);
        animal.animalType = "sheep";
        animKey = "sheep_walk";
      }

      if (!scene.anims.exists(animKey)) {
        const frames =
          animalType === 0
            ? scene.anims.generateFrameNumbers("rabbit", { start: 0, end: 1 })
            : scene.anims.generateFrameNumbers(animal.texture.key, {
                start: 0,
                end: 3,
              });

        scene.anims.create({
          key: animKey,
          frames: frames,
          frameRate: frameRate,
          repeat: -1,
        });
      }

      moveAnimalRandomly(scene, animal);
    }
  }
  return animals;
}

function moveAnimalRandomly(scene, animal) {
  if (!animal || !animal.scene) return;

  const directions = ["left", "right", "up", "down"];
  const direction = Phaser.Utils.Array.GetRandom(directions);

  let velocityX = 0;
  let velocityY = 0;

  const animalStats = {
    rabbit: { anim: "rabbit_walk", speedModifier: 0 },
    gat: { anim: "gat_walk", speedModifier: 0 },
    pig: { anim: "pig_walk", speedModifier: 50 },
    chicken: { anim: "chicken_walk", speedModifier: 0 },
    cow: { anim: "cow_walk", speedModifier: 50 },
    sheep: { anim: "sheep_walk", speedModifier: 25 },
  };

  const animalType = animal.animalType || "rabbit";
  const info = animalStats[animalType];
  const currentSpeed = animalSpeed - info.speedModifier;

  if (direction === "left") {
    velocityX = -currentSpeed;
    animal.flipX = true;
  } else if (direction === "right") {
    velocityX = currentSpeed;
    animal.flipX = false;
  }

  if (direction === "up") {
    velocityY = -currentSpeed;
  } else if (direction === "down") {
    velocityY = currentSpeed;
  }

  if (scene.anims.exists(info.anim)) {
    animal.anims.play(info.anim, true);
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

const SAFE_DISTANCE = 400;
const START_CHASE_DIST = 75;
const STOP_CHASE_DIST = 150;

export function generateHostileAnimals(scene, numAnimals, player) {
  const animals = scene.physics.add.group();
  let attempts = 0;

  for (let i = 0; i < numAnimals; i++) {
    let x, y;
    let valid = false;
    attempts = 0;

    do {
      attempts++;
      const gridX = Phaser.Math.Between(1, MAP_COLS - 2);
      const gridY = Phaser.Math.Between(1, MAP_ROWS - 2);

      x = gridX * TILE_SIZE + TILE_SIZE / 2;
      y = gridY * TILE_SIZE + TILE_SIZE / 2;

      if (isLand(x, y)) {
        const distToPlayer = Phaser.Math.Distance.Between(
          x,
          y,
          player.x,
          player.y
        );
        if (distToPlayer > SAFE_DISTANCE) {
          valid = true;
        }
      }
    } while (!valid && attempts < 100);

    if (valid) {
      const type = Phaser.Math.RND.pick(["wolf", "boar", "tiger"]);
      let animal;
      let speed = hostilesSpeed;
      let animKey = "";
      let health = 5;

      if (type === "wolf") {
        animal = animals.create(x, y, "wolf").setInteractive().setScale(0.5);
        speed = hostilesSpeed;
        animKey = "wolf_walk";
        health = 5;
      } else if (type === "boar") {
        animal = animals.create(x, y, "boar").setInteractive().setScale(0.6);
        speed = hostilesSpeed;
        animKey = "boar_walk";
        health = 5;
      } else if (type === "tiger") {
        animal = animals.create(x, y, "tiger").setInteractive().setScale(0.6);
        speed = hostilesSpeed + 20;
        animKey = "tiger_walk";
        health = 6;
      }

      animal.health = health;
      animal.hostileType = type;
      animal.isChasing = false;

      if (!scene.anims.exists(animKey)) {
        let endFrame = 3;
        if (type === "wolf") endFrame = 4;

        scene.anims.create({
          key: animKey,
          frames: scene.anims.generateFrameNumbers(type, {
            start: 0,
            end: endFrame,
          }),
          frameRate: 6,
          repeat: -1,
        });
      }

      scene.physics.add.overlap(
        player,
        animal,
        () => handleHostileAnimal(scene, animal, player),
        null,
        scene
      );

      scene.time.addEvent({
        delay: 100,
        callback: () =>
          moveWolfTowardsPlayer(scene, animal, player, speed, animKey),
        loop: true,
      });
    }
  }
  return animals;
}

function moveWolfTowardsPlayer(scene, wolf, player, speed, animKey) {
  if (!wolf || !wolf.body) return;
  const distance = Phaser.Math.Distance.Between(
    wolf.x,
    wolf.y,
    player.x,
    player.y
  );

  let shouldChase = false;

  if (wolf.isChasing) {
    if (distance < STOP_CHASE_DIST) {
      shouldChase = true;
    } else {
      shouldChase = false;
      wolf.isChasing = false;
    }
  } else {
    if (distance < START_CHASE_DIST) {
      shouldChase = true;
      wolf.isChasing = true;
    }
  }

  if (shouldChase) {
    const directionX = player.x - wolf.x;
    const directionY = player.y - wolf.y;
    const magnitude = Math.sqrt(
      directionX * directionX + directionY * directionY
    );

    if (magnitude > 0) {
      const normalizedX = directionX / magnitude;
      const normalizedY = directionY / magnitude;

      const nextX = wolf.x + normalizedX * 10;
      const nextY = wolf.y + normalizedY * 10;

      if (isLand(nextX, nextY)) {
        wolf.setVelocity(normalizedX * speed, normalizedY * speed);
      } else {
        wolf.setVelocity(0);
      }
    }

    if (directionX > 0) wolf.flipX = true;
    else wolf.flipX = false;

    if (!wolf.anims.isPlaying || wolf.anims.currentAnim.key !== animKey) {
      wolf.anims.play(animKey, true);
    }
  } else {
    wolf.setVelocity(0);
    wolf.anims.stop();
  }
}

function handleHostileAnimal(scene, animal, player) {
  const currentLives = getLives();
  if (currentLives != 0) {
    if (!player.invulnerable) {
      loseLife();
      player.invulnerable = true;
      scene.time.delayedCall(2000, () => {
        player.invulnerable = false;
      });
    }
  }
}

export function updateAnimals(scene) {
  if (scene.animals) {
    scene.animals.getChildren().forEach((animal) => {
      if (
        animal.body &&
        (animal.body.velocity.x !== 0 || animal.body.velocity.y !== 0)
      ) {
        const lookAhead = 20;

        const vx = animal.body.velocity.x;
        const vy = animal.body.velocity.y;
        const speed = Math.sqrt(vx * vx + vy * vy);

        if (speed > 0) {
          const nextX = animal.x + (vx / speed) * lookAhead;
          const nextY = animal.y + (vy / speed) * lookAhead;

          if (!isLand(nextX, nextY)) {
            animal.setVelocity(0, 0);
          }
        }
      }
    });
  }
}
