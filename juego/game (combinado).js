// Configuración del juego
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth - 100,
    height: window.innerHeight - 100,
    parent: 'juego',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player, cursors, wasdKeys, background, heartsGroup;
const fondoX = 5000, fondoY = 5000;
const numTrees = 150;
let lives = 3;
let hostilesSpeed = 90;
let animalSpeed = 150;
const detectionRange = 250; // Rango de detección para lobos
let inventory = []; // Inventario donde se guardan los objetos recogidos
let inventoryVisible = false; // Controla si el inventario está visible o no
let inventoryBackground; // Fondo visual del inventario
let inventoryItems = []; // Lista de objetos visuales en el inventario

// Variables configurables para la cantidad de animales
const numPassiveAnimals = 60; // Número de animales pasivos
const numHostileAnimals = 50;  // Número de animales hostiles

function preload() {
    this.load.spritesheet('player', './img/oso.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('vida', './img/corazon.png');
    this.load.image('grass', './img/grass2.png');
    this.load.image('arbol', './img/arbol.png');
    this.load.image('tocon', './img/arbol_tronco.png');
    this.load.spritesheet('rabbit', './img/conejo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('wolf', './img/lobo.png', { frameWidth: 64, frameHeight: 32});
    this.load.image('item1', './img/madera.png'); // Objeto de inventario (item1)
    this.load.image('inventory', './img/inventario.png');
}

function createPlayer(scene) {
    player = scene.physics.add.sprite(fondoX / 2, fondoY / 2, 'player').setScale(0.8);
    player.setCollideWorldBounds(true);

    scene.anims.create({
        key: 'bear_walk',
        frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
        frameRate: 12,
        repeat: -1
    });

    player.anims.play('bear_walk');
}

// Función para crear árboles
function createTrees(scene, treePositions) {
    const trees = scene.physics.add.group();

    treePositions.forEach(position => {
        const tree = trees.create(position.x, position.y, 'arbol').setInteractive();
        tree.setImmovable(true);
        tree.setOrigin(0.5, 1);
        tree.body.setSize(tree.width * 0.2, tree.height * 0.2);
        tree.body.setOffset(tree.width * 0.42, tree.height * 0.8);
        tree.clickCount = 0;

        tree.on('pointerdown', () => handleTreeClick(scene, tree));
    });

    return trees;
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
            if (tree.clickCount >= 3) { // Si se ha clicado 3 veces
                shakeTween.stop(); // Detener animación de sacudida
                tree.setTexture('tocon'); // Cambiar textura del árbol a tronco
                tree.disableInteractive(); // Desactivar la interactividad del árbol

                // Añadir un objeto al inventario cuando se tala el árbol
                addItemToInventory(scene, 'item1'); // Cambiar 'item1' según lo que quieras

                // Restaurar el árbol después de 10 segundos
                scene.time.delayedCall(10000, () => {
                    tree.setTexture('arbol'); // Cambiar de nuevo la textura a árbol
                    tree.setInteractive(); // Hacerlo interactivo otra vez
                    tree.clickCount = 0; // Reiniciar el contador de clics
                });
            }
        }
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
        let heart = scene.add.image(player.x, player.y, 'vida').setScale(0.5);
        heartsGroup.add(heart);
    }
}

// Añadir un ítem al inventario
function addItemToInventory(scene, itemKey) {

    inventory.push(itemKey); // Añadir al inventario

    const item = scene.physics.add.image(0, 0, itemKey).setInteractive().setScale(0.8); // Crear el ítem
    item.on('pointerdown', function () {

        // Hacer el ítem arrastrable
        scene.input.setDraggable(item);
        scene.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX; // Actualizar posición X
            gameObject.y = dragY; // Actualizar posición Y
        });

        // Restaurar la opacidad al soltar
        item.on('dragend', function () {
            this.setAlpha(1);
            scene.input.setDraggable(item, false); // Desactivar arrastre
        });
    });

    inventoryItems.push(item);
    updateInventoryDisplay(); // Actualizar la visualización del inventario
}

// Función que actualiza la visualización del inventario
function updateInventoryDisplay() {
    const startX = inventoryBackground.x + 25; // Margen desde el borde del fondo
    const startY = inventoryBackground.y + 25; // Margen desde el borde del fondo

    // Posicionar cada ítem en el inventario
    inventoryItems.forEach((item, index) => {
        item.x = startX - 153; // Posición X dentro del inventario
        item.y = startY - 95; // Posición Y dentro del inventario ds
        item.setVisible(inventoryVisible); // Mostrar/ocultar ítems
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
        const animal = animals.create(x, y, 'rabbit').setInteractive();
        scene.anims.create({
            key: 'rabbit_walk',
            frames: scene.anims.generateFrameNumbers('rabbit', { start: 0, end: 1 }),
            frameRate: 9,
            repeat: -1
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

        const animal = animals.create(x, y, 'wolf').setInteractive().setScale(0.5);
        scene.anims.create({
            key: 'wolf_walk',
            frames: scene.anims.generateFrameNumbers('wolf', { start: 0, end: 4 }),
            frameRate: 6,
            repeat: -1
        });
        // Colisión con el jugador
        scene.physics.add.overlap(player, animal, () => handleHostileAnimal(scene, animal), null, scene);
        
        // Mover el lobo hacia el jugador si está dentro del rango de detección
        scene.time.addEvent({
            delay: 100,
            callback: () => moveWolfTowardsPlayer(scene, animal),
            loop: true
        });
    }

    return animals;
}

// Verifica si está dentro de la vista de la cámara
function isWithinCameraView(x, y, camera) {
    const cameraBounds = camera.worldView;
    return x >= cameraBounds.x && x <= cameraBounds.x + cameraBounds.width &&
           y >= cameraBounds.y && y <= cameraBounds.y + cameraBounds.height;
}

// Mover animales aleatoriamente
function moveAnimalRandomly(scene, animal) {
    const directions = ['left', 'right', 'up', 'down'];
    const direction = Phaser.Utils.Array.GetRandom(directions);

    let velocityX = 0;
    let velocityY = 0;

    // Usamos if para establecer la velocidad en X según la dirección
    if (direction === 'left') {
        velocityX = -animalSpeed; // Mover a la izquierda
        animal.anims.play('rabbit_walk');
        animal.flipX=false;
    } else if (direction === 'right') {
        velocityX = animalSpeed; // Mover a la derecha
        animal.anims.play('rabbit_walk');
        animal.flipX=true;
    } else {
        velocityX = 0; // No moverse en el eje X
    }

    // Usamos if para establecer la velocidad en Y según la dirección
    if (direction === 'up') {
        velocityY = -animalSpeed; // Mover hacia arriba
        animal.anims.play('rabbit_walk')
    } else if (direction === 'down') {
        velocityY = animalSpeed; // Mover hacia abajo
        animal.anims.play('rabbit_walk')
    } else {
        velocityY = 0; // No moverse en el eje Y
    }

    // Aplicar las velocidades calculadas al animal
    animal.setVelocity(velocityX, velocityY);
    // Repetir el movimiento después de un tiempo aleatorio
    scene.time.delayedCall(Phaser.Math.Between(1000, 3000), () => moveAnimalRandomly(scene, animal));
}


// Función para mover al lobo hacia el jugador
function moveWolfTowardsPlayer(scene, wolf) {
    const distance = Phaser.Math.Distance.Between(wolf.x, wolf.y, player.x, player.y);
    
    if (distance < detectionRange) {
        // Calcular la dirección hacia el jugador
        const directionX = player.x - wolf.x;
        const directionY = player.y - wolf.y;

        // Normalizar la dirección para que el lobo se mueva correctamente
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
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
        if (!wolf.anims.isPlaying || wolf.anims.currentAnim.key !== 'wolf_walk') {
            wolf.anims.play('wolf_walk');
        }
    } else {
        // Si el jugador está fuera del rango, el lobo deja de moverse
        wolf.setVelocity(0);
    }
}





function handleHostileAnimal(scene, animal) {
    if (lives!= 0){
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
    background = this.add.tileSprite(fondoX / 2, fondoY / 2, fondoX, fondoY, 'grass');

    createPlayer(this);

    this.animals = generatePassiveAnimals(this, numPassiveAnimals);
    
    generateHostileAnimals(this, numHostileAnimals);
    
    const treePositions = generateNonOverlappingTreePositions(100);

    this.trees = createTrees(this, treePositions);

    createHearts(this);
    
    
    this.physics.add.collider(player, this.trees);
    
    cursors = this.input.keyboard.createCursorKeys();
    wasdKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Mostrar/ocultar inventario con la tecla 'E'
    this.input.keyboard.on('keydown-E', () => {
        inventoryVisible = !inventoryVisible; // Alternar visibilidad
        // Centrar el inventario respecto al jugador
        const inventoryX = (player.x - inventoryBackground.displayWidth / 50)+5;
        const inventoryY = (player.y - inventoryBackground.displayHeight / 50)+5;
        // Actualizar la posición del fondo del inventario
        inventoryBackground.setPosition(inventoryX, inventoryY);     
        inventoryBackground.setVisible(inventoryVisible); // Mostrar u ocultar fondo
        inventoryItems.forEach(item => item.setVisible(inventoryVisible)); // Mostrar/ocultar ítems
        updateInventoryDisplay(); // Actualizar el inventario visual
    });

    inventoryBackground = this.physics.add.staticImage((player.x), (player.y), "inventory");
    inventoryBackground.displayWidth = 300;  // Ancho del inventario
    inventoryBackground.displayHeight = 200; // Alto del inventario
    // Crear el cuerpo de colisión del inventario
    inventoryBackground.body.setSize(inventoryBackground.displayWidth, inventoryBackground.displayHeight);
    // Actualizar la posición del collider
    console.log(inventoryBackground.body.position);
    // Ocultar inventario inicialmente
    inventoryBackground.setVisible(false);

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
        heart.x = player.x - totalWidth / 2 + (index * 7);
        heart.y = player.y - 17;
    });
}
