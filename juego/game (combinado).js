// Configuración del juego
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth - 100,
  height: window.innerHeight - 100,
  parent: "juego",
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

let player, cursors, wasdKeys, background, heartsGroup;
const fondoX = 5000,
  fondoY = 5000;
const numTrees = 150;
const numRock = 150;
const numIron = 150;
const numGold = 150;
let lives = 3;
let hostilesSpeed = 90;
let animalSpeed = 150;
const detectionRange = 250; // Rango de detección para lobos
let inventory = {}; // Cambiado a objeto para almacenar cantidad por tipo
let inventoryVisible = false; // Controla si el inventario está visible o no
let inventoryBackground; // Fondo visual del inventario
let inventorySlots = []; // Lista de slots del inventario
const inventorySlotSize = 30; // Tamaño de cada slot

// Variables configurables para la cantidad de animales
const numPassiveAnimals = 10; // Número de animales pasivos
const numHostileAnimals = 5; // Número de animales hostiles

function preload() {
  this.load.spritesheet("player", "./img/oso.png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  this.load.image("vida", "./img/corazon.png");
  this.load.image("grass", "./img/grass2.png");
  this.load.image("arbol", "./img/arbol.png");
  this.load.image("piedraMena", "./img/piedraMena.png");
  this.load.image("oroMena", "./img/oroMena.png");
  this.load.image("hierroMena", "./img/hierroMena.png");
  this.load.image("tocon", "./img/arbol_tronco.png");
  this.load.spritesheet("rabbit", "./img/conejo.png", {
    frameWidth: 16,
    frameHeight: 16,
  });
  this.load.spritesheet("wolf", "./img/lobo.png", {
    frameWidth: 64,
    frameHeight: 32,
  });
  this.load.image("item1", "./img/madera.png"); // Objeto de inventario (item1)
  this.load.image("piedra", "./img/piedra.png");
  this.load.image("oro", "./img/oro.png");
  this.load.image("hierro", "./img/hierro.png");
  this.load.image("inventory", "./img/inventario 2.png");
}

function createPlayer(scene) {
  player = scene.physics.add
    .sprite(fondoX / 2, fondoY / 2, "player")
    .setScale(0.8);
  player.setCollideWorldBounds(true);

  scene.anims.create({
    key: "bear_walk",
    frames: scene.anims.generateFrameNumbers("player", { start: 0, end: 4 }),
    frameRate: 12,
    repeat: -1,
  });

  player.anims.play("bear_walk");
}

// Función para crear árboles
function createTrees(scene, treePositions) {
  const trees = scene.physics.add.group();

  treePositions.forEach((position) => {
    const tree = trees.create(position.x, position.y, "arbol").setInteractive();
    tree.setImmovable(true);
    tree.setOrigin(0.5, 1);
    tree.body.setSize(tree.width * 0.2, tree.height * 0.2);
    tree.body.setOffset(tree.width * 0.42, tree.height * 0.8);
    tree.clickCount = 0;

    tree.on("pointerdown", () => handleTreeClick(scene, tree));
  });

  return trees;
}

// Función para crear árboles
function createRocks(scene, rocksPositions) {
  const rocks = scene.physics.add.group();

  rocksPositions.forEach((position) => {
    const rock = rocks
      .create(position.x, position.y, "piedraMena")
      .setInteractive();
    rock.setImmovable(true);
    rock.setOrigin(0.5, 1);
    rock.body.setSize(rock.width * 0.2, rock.height * 0.2);
    rock.body.setOffset(rock.width * 0.42, rock.height * 0.8);
    rock.clickCount = 0;

    rocks.on("pointerdown", () => handleRockClick(scene, rock));
  });

  return rocks;
}

function handleRockClick(scene, rock) {
  rock.clickCount++; // Incrementa el contador de clics en el árbol

  // Animación de sacudida del árbol al ser clicado
  const shakeTween = scene.tweens.add({
    targets: rock,
    angle: { from: -10, to: 10 }, // Oscila entre -10 y 10 grados
    duration: 100, // Duración de la sacudida
    yoyo: true, // Repetir hacia atrás después de terminar
    repeat: 3, // Número de veces que repite la animación
    onComplete: () => {
      rock.setAngle(0); // Restablecer el ángulo al terminar
      if (rock.clickCount >= 3) {
        // Si se ha clicado 3 veces
        shakeTween.stop(); // Detener animación de sacudida
        tree.setTexture("tocon"); // Cambiar textura del árbol a tronco
        rock.disableInteractive(); // Desactivar la interactividad del árbol

        // Añadir un objeto al inventario cuando se tala el árbol
        addItemToInventory(scene, "piedra");

        // Restaurar el árbol después de 10 segundos
        scene.time.delayedCall(10000, () => {
          rock.setTexture("piedraMena"); // Cambiar de nuevo la textura a árbol
          rock.setInteractive(); // Hacerlo interactivo otra vez
          rock.clickCount = 0; // Reiniciar el contador de clics
        });
      }
    },
  });
}

// Generar posiciones de árboles no superpuestas
function generateNonOverlappingRockPositions(minDistance) {
  const positions = [];

  for (let i = 0; i < numRock; i++) {
    let validPosition = false;
    let x, y;

    while (!validPosition) {
      x = Phaser.Math.Between(50, fondoX - 50);
      y = Phaser.Math.Between(50, fondoY - 50);
      validPosition = true;

      for (let pos of positions) {
        const distance = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }
    }

    positions.push({ x: x, y: y });
  }

  return positions;
}

function handleTreeClick(scene, tree) {
  tree.clickCount++; // Incrementa el contador de clics en el árbol

  // Animación de sacudida del árbol al ser clicado
  const shakeTween = scene.tweens.add({
    targets: tree,
    angle: { from: -10, to: 10 }, // Oscila entre -10 y 10 grados
    duration: 100, // Duración de la sacudida
    yoyo: true, // Repetir hacia atrás después de terminar
    repeat: 3, // Número de veces que repite la animación
    onComplete: () => {
      tree.setAngle(0); // Restablecer el ángulo al terminar
      if (tree.clickCount >= 3) {
        // Si se ha clicado 3 veces
        shakeTween.stop(); // Detener animación de sacudida
        tree.setTexture("tocon"); // Cambiar textura del árbol a tronco
        tree.disableInteractive(); // Desactivar la interactividad del árbol

        // Añadir un objeto al inventario cuando se tala el árbol
        addItemToInventory(scene, "item1");

        // Restaurar el árbol después de 10 segundos
        scene.time.delayedCall(10000, () => {
          tree.setTexture("arbol"); // Cambiar de nuevo la textura a árbol
          tree.setInteractive(); // Hacerlo interactivo otra vez
          tree.clickCount = 0; // Reiniciar el contador de clics
        });
      }
    },
  });
}

// Generar posiciones de árboles no superpuestas
function generateNonOverlappingTreePositions(minDistance) {
  const positions = [];

  for (let i = 0; i < numTrees; i++) {
    let validPosition = false;
    let x, y;

    while (!validPosition) {
      x = Phaser.Math.Between(50, fondoX - 50);
      y = Phaser.Math.Between(50, fondoY - 50);
      validPosition = true;

      for (let pos of positions) {
        const distance = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }
    }

    positions.push({ x: x, y: y });
  }

  return positions;
}

// Crear corazones
function createHearts(scene) {
  heartsGroup = scene.add.group();
  for (let i = 0; i < lives; i++) {
    let heart = scene.add.image(player.x, player.y, "vida").setScale(0.5);
    heartsGroup.add(heart);
  }
}

// Añadir un ítem al inventario
function addItemToInventory(scene, itemKey) {
  console.log(`Añadiendo ítem: ${itemKey}`);
  // Si el ítem ya existe en el inventario, incrementa la cantidad
  if (inventory[itemKey]) {
    inventory[itemKey].quantity++;
    inventory[itemKey].quantityText.setText(inventory[itemKey].quantity);
  } else {
    // Si no existe, busca un slot vacío
    const emptySlot = inventorySlots.find((slot) => slot.isEmpty);

    if (emptySlot) {
      // Crear el ítem en el slot vacío
      const item = scene.add
        .image(emptySlot.x, emptySlot.y, itemKey)
        .setOrigin(0.5)
        .setInteractive()
        .setScale(0.7);
      item.itemKey = itemKey; // Asegúrate de asignar itemKey aquí
      item.setVisible(true); // Asegúrate de que el ítem sea visible

      // Hacer el ítem arrastrable dentro del inventario
      item.on("pointerdown", function (pointer) {
        scene.input.setDraggable(item);
        item.setTint(0xff00ff);
      });

      scene.input.on("drag", function (pointer, gameObject, dragX, dragY) {
        // Restringir el movimiento dentro del inventario
        const inventoryBounds = inventoryBackground.getBounds();
        const halfItemSize = inventorySlotSize / 2;

        if (
          dragX - halfItemSize >= inventoryBounds.left &&
          dragX + halfItemSize <= inventoryBounds.right &&
          dragY - halfItemSize >= inventoryBounds.top &&
          dragY + halfItemSize <= inventoryBounds.bottom
        ) {
          gameObject.x = dragX;
          gameObject.y = dragY;
        }
      });

      scene.input.on("dragend", function (pointer, gameObject) {
        // Al soltar, ajustar el ítem al slot más cercano
        const closestSlot = getClosestSlot(gameObject.x, gameObject.y);

        gameObject.clearTint();
        if (closestSlot) {
          gameObject.x = closestSlot.x;
          gameObject.y = closestSlot.y;

          // Actualizar los slots
          inventorySlots.forEach((slot) => {
            if (slot.item === gameObject) {
              slot.item = null;
              slot.isEmpty = true;
            }
          });

          closestSlot.item = gameObject;
          closestSlot.isEmpty = false;
        } else {
          // Si no hay slot cercano, mover el ítem de vuelta a su posición original
          const originalSlot = inventory[gameObject.itemKey]?.slot;
          if (originalSlot) {
            gameObject.x = originalSlot.x;
            gameObject.y = originalSlot.y;
          }
        }
      });

      // Crear texto para la cantidad
      const quantityText = scene.add.text(emptySlot.x, emptySlot.y, "1", {
        fontSize: "10px",
        fill: "#fff",
      });
      quantityText.setOrigin(1, -0.6); // Centrar el texto en el slot
      quantityText.setVisible(true); // Asegúrate de que el texto sea visible

      // Guardar en el inventario
      inventory[itemKey] = {
        item: item,
        quantity: 1,
        quantityText: quantityText,
      };

      // Marcar el slot como ocupado
      emptySlot.item = item;
      emptySlot.isEmpty = false;
    } else {
      console.log("No hay espacio en el inventario");
    }
  }
}

// Función para obtener el slot más cercano
function getClosestSlot(x, y) {
  let closestSlot = null;
  let minDistance = Infinity;

  inventorySlots.forEach((slot) => {
    const distance = Phaser.Math.Distance.Between(x, y, slot.x, slot.y);
    if (distance < minDistance) {
      minDistance = distance;
      closestSlot = slot;
    }
  });

  return closestSlot;
}

// Generar los slots del inventario
function createInventorySlots(scene) {
  const rows = 3;
  const cols = 5;
  const startX =
    inventoryBackground.x -
    (cols / 2) * inventorySlotSize +
    inventorySlotSize / 2;
  const startY =
    inventoryBackground.y -
    (rows / 2) * inventorySlotSize +
    inventorySlotSize / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * inventorySlotSize;
      const y = startY + row * inventorySlotSize;

      const slot = scene.add.rectangle(
        x,
        y,
        inventorySlotSize - 4,
        inventorySlotSize - 4,
        0x000000,
        0.2
      );
      slot.setStrokeStyle(1, 0xffffff);
      slot.setVisible(false); // Ocultar inicialmente

      inventorySlots.push({
        x: x,
        y: y,
        item: null,
        isEmpty: true,
        slotRect: slot,
        col: col,
        row: row,
      });
    }
  }

  // Calcular el tamaño del fondo del inventario
  inventoryBackground.displayWidth = cols * inventorySlotSize + 10; // Ancho basado en los slots
  inventoryBackground.displayHeight = rows * inventorySlotSize + 10; // Alto basado en los slots
}

// Mostrar u ocultar el inventario
function toggleInventoryVisibility(visible) {
  inventoryBackground.setVisible(visible);
  inventorySlots.forEach((slot) => {
    slot.slotRect.setVisible(visible);
    if (slot.item) {
      slot.item.setVisible(visible);
      inventory[slot.item.itemKey].quantityText.setVisible(visible);
    }
  });
}

// Generar animales pasivos
function generatePassiveAnimals(scene, numAnimals) {
  const animals = scene.physics.add.group();
  for (let i = 0; i < numAnimals; i++) {
    let x, y;
    do {
      x = Phaser.Math.Between(100, fondoX - 100);
      y = Phaser.Math.Between(100, fondoY - 100);
    } while (isWithinCameraView(x, y, scene.cameras.main));
    const animal = animals.create(x, y, "rabbit").setInteractive();
    scene.anims.create({
      key: "rabbit_walk",
      frames: scene.anims.generateFrameNumbers("rabbit", { start: 0, end: 1 }),
      frameRate: 9,
      repeat: -1,
    });
    moveAnimalRandomly(scene, animal);
  }

  return animals;
}

// Generar animales hostiles
function generateHostileAnimals(scene, numAnimals) {
  const animals = scene.physics.add.group();

  for (let i = 0; i < numAnimals; i++) {
    let x, y;

    // Generar coordenadas fuera del campo de visión de la cámara
    do {
      x = Phaser.Math.Between(50, fondoX - 50);
      y = Phaser.Math.Between(50, fondoY - 50);
    } while (isWithinCameraView(x, y, scene.cameras.main));

    const animal = animals.create(x, y, "wolf").setInteractive().setScale(0.5);
    scene.anims.create({
      key: "wolf_walk",
      frames: scene.anims.generateFrameNumbers("wolf", { start: 0, end: 4 }),
      frameRate: 6,
      repeat: -1,
    });
    // Colisión con el jugador
    scene.physics.add.overlap(
      player,
      animal,
      () => handleHostileAnimal(scene, animal),
      null,
      scene
    );

    // Mover el lobo hacia el jugador si está dentro del rango de detección
    scene.time.addEvent({
      delay: 100,
      callback: () => moveWolfTowardsPlayer(scene, animal),
      loop: true,
    });
  }

  return animals;
}

// Verifica si está dentro de la vista de la cámara
function isWithinCameraView(x, y, camera) {
  const cameraBounds = camera.worldView;
  return (
    x >= cameraBounds.x &&
    x <= cameraBounds.x + cameraBounds.width &&
    y >= cameraBounds.y &&
    y <= cameraBounds.y + cameraBounds.height
  );
}

// Mover animales aleatoriamente
function moveAnimalRandomly(scene, animal) {
  const directions = ["left", "right", "up", "down"];
  const direction = Phaser.Utils.Array.GetRandom(directions);

  let velocityX = 0;
  let velocityY = 0;

  // Usamos if para establecer la velocidad en X según la dirección
  if (direction === "left") {
    velocityX = -animalSpeed; // Mover a la izquierda
    animal.anims.play("rabbit_walk");
    animal.flipX = false;
  } else if (direction === "right") {
    velocityX = animalSpeed; // Mover a la derecha
    animal.anims.play("rabbit_walk");
    animal.flipX = true;
  } else {
    velocityX = 0; // No moverse en el eje X
  }

  // Usamos if para establecer la velocidad en Y según la dirección
  if (direction === "up") {
    velocityY = -animalSpeed; // Mover hacia arriba
    animal.anims.play("rabbit_walk");
  } else if (direction === "down") {
    velocityY = animalSpeed; // Mover hacia abajo
    animal.anims.play("rabbit_walk");
  } else {
    velocityY = 0; // No moverse en el eje Y
  }

  // Aplicar las velocidades calculadas al animal
  animal.setVelocity(velocityX, velocityY);
  // Repetir el movimiento después de un tiempo aleatorio
  scene.time.delayedCall(Phaser.Math.Between(1000, 3000), () =>
    moveAnimalRandomly(scene, animal)
  );
}

// Función para mover al lobo hacia el jugador
function moveWolfTowardsPlayer(scene, wolf) {
  const distance = Phaser.Math.Distance.Between(
    wolf.x,
    wolf.y,
    player.x,
    player.y
  );

  if (distance < detectionRange) {
    // Calcular la dirección hacia el jugador
    const directionX = player.x - wolf.x;
    const directionY = player.y - wolf.y;

    // Normalizar la dirección para que el lobo se mueva correctamente
    const magnitude = Math.sqrt(
      directionX * directionX + directionY * directionY
    );
    const normalizedX = directionX / magnitude;
    const normalizedY = directionY / magnitude;

    // Mover el lobo hacia el jugador
    wolf.setVelocity(normalizedX * hostilesSpeed, normalizedY * hostilesSpeed);

    // Ajustar la orientación del lobo (flipX) dependiendo de la posición del jugador
    if (directionX > 0) {
      wolf.flipX = true; // Si el jugador está a la derecha, el lobo mira a la derecha
    } else {
      wolf.flipX = false; // Si el jugador está a la izquierda, el lobo mira a la izquierda
    }

    // Reproducir la animación del lobo al caminar
    if (!wolf.anims.isPlaying || wolf.anims.currentAnim.key !== "wolf_walk") {
      wolf.anims.play("wolf_walk");
    }
  } else {
    // Si el jugador está fuera del rango, el lobo deja de moverse
    wolf.setVelocity(0);
  }
}

function handleHostileAnimal(scene, animal) {
  if (lives != 0) {
    if (!player.invulnerable) {
      lives -= 1;
      heartsGroup.getChildren().pop().destroy();
      player.invulnerable = true;
      scene.time.delayedCall(2000, () => {
        player.invulnerable = false;
      });
    }
  }
}

function create() {
  background = this.add.tileSprite(
    fondoX / 2,
    fondoY / 2,
    fondoX,
    fondoY,
    "grass"
  );

  createPlayer(this);

  this.animals = generatePassiveAnimals(this, numPassiveAnimals);

  generateHostileAnimals(this, numHostileAnimals);

  const rocksPositions = generateNonOverlappingRockPositions(100);

  this.rocks = createRocks(this, rocksPositions);

  const treePositions = generateNonOverlappingTreePositions(100);

  this.trees = createTrees(this, treePositions);

  createHearts(this);

  this.physics.add.collider(player, this.trees);
  this.physics.add.collider(player, this.rocks);

  cursors = this.input.keyboard.createCursorKeys();
  wasdKeys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    right: Phaser.Input.Keyboard.KeyCodes.D,
  });

  // Crear el fondo del inventario
  inventoryBackground = this.add.image(player.x, player.y, "inventory");
  inventoryBackground.setVisible(false);

  // Generar los slots del inventario
  createInventorySlots(this);

  // Mostrar/ocultar inventario con la tecla 'E'
  this.input.keyboard.on("keydown-E", () => {
    inventoryVisible = !inventoryVisible; // Alternar visibilidad
    toggleInventoryVisibility(inventoryVisible); // Mostrar u ocultar inventario
  });

  this.cameras.main.startFollow(player);
  this.cameras.main.setZoom(2.2);
  this.cameras.main.setBounds(0, 0, fondoX, fondoY);
  this.physics.world.setBounds(0, 0, fondoX, fondoY);
}

function update() {
  player.setVelocity(0);
  const speed = 100;

  if (cursors.left.isDown || wasdKeys.left.isDown) {
    player.setVelocityX(-speed);
    player.flipX = false;
  } else if (cursors.right.isDown || wasdKeys.right.isDown) {
    player.setVelocityX(speed);
    player.flipX = true;
  }

  if (cursors.up.isDown || wasdKeys.up.isDown) {
    player.setVelocityY(-speed);
  } else if (cursors.down.isDown || wasdKeys.down.isDown) {
    player.setVelocityY(speed);
  }

  if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
    player.anims.play("bear_walk", true);
  } else {
    player.anims.play("bear_walk", false);
  }

  // Actualizar la posición de los corazones
  const totalWidth = (lives - 1) * 5.9;

  heartsGroup.children.iterate((heart, index) => {
    heart.x = player.x - totalWidth / 2 + index * 7;
    heart.y = player.y - 17;
  });

  if (inventoryVisible) {
    inventoryBackground.setPosition(player.x, player.y);
    inventorySlots.forEach((slot) => {
      slot.slotRect.x = slot.x =
        inventoryBackground.x -
        inventorySlotSize * 2 +
        slot.col * inventorySlotSize;
      slot.slotRect.y = slot.y =
        inventoryBackground.y -
        inventorySlotSize +
        slot.row * inventorySlotSize;

      // Solo actualizar el item si existe
      if (slot.item) {
        slot.item.x = slot.x;
        slot.item.y = slot.y;

        // Asegurarse de que el itemKey existe en el inventario antes de acceder a quantityText
        const itemKey = slot.item.itemKey;
        if (inventory[itemKey]) {
          inventory[itemKey].quantityText.x =
            slot.x + inventorySlotSize / 2 - 10;
          inventory[itemKey].quantityText.y =
            slot.y + inventorySlotSize / 2 - 20;
        }
      }
    });
  }
}
