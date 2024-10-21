// Configuración básica del juego en Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'juego',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true, // Cambia a 'false' en producción
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Variables globales
let player, cursors, wasdKeys, background, heartsGroup;
let fondoX = 5000, fondoY = 5000; // Dimensiones del mapa
const numTrees = 150; // Número total de árboles en el mapa
let lives = 3; // Vidas del jugador
let speed = 100;

// Animales
let hostilesSpeed = 90;
let animalSpeed = 150;
const detectionRange = 300; // Rango de detección para lobos
const numPassiveAnimals = 100; // Número de animales pasivos
const numHostileAnimals = 100;  // Número de animales hostiles

// Inventario
let inventory = []; // Inventario donde se guardan los objetos recogidos
let inventoryVisible = false; // Controla si el inventario está visible o no
let inventoryBackground; // Fondo visual del inventario
let inventoryItems = []; // Lista de objetos visuales en el inventario

// Carga de imágenes y sprites
function preload() {
    this.load.spritesheet('player', './img/oso.png', { frameWidth: 32, frameHeight: 32 }); // Jugador
    this.load.image('vida', './img/corazon.png'); // Imagen de corazones (vidas)
    this.load.image('grass', './img/grass2.png'); // Fondo del mapa (césped)
    this.load.image('arbol', './img/arbol.png'); // Árboles del mapa
    this.load.image('tocon', './img/arbol_tronco.png'); // Tronco cuando un árbol es talado
    this.load.image('item1', './img/madera.png'); // Objeto de inventario (item1)
    this.load.image('inventory', './img/inventario.png');
    // Animales Pasivos
    this.load.spritesheet('deer', './img/ciervo.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('rabbit', './img/conejo.png', { frameWidth: 16, frameHeight: 16 });

    // Animales Hostiles
    this.load.spritesheet('boar', './img/jabali.png', { frameWidth: 48, frameHeight: 32 });
    this.load.spritesheet('wolf', './img/lobo.png', { frameWidth: 64, frameHeight: 32});
    this.load.spritesheet('tiger', './img/tigre.png', { frameWidth: 55, frameHeight: 27});
}

// Función para crear el jugador
function createPlayer(scene) {
    player = scene.physics.add.sprite(300, 400, 'player').setScale(0.8);
    player.setCollideWorldBounds(true);

    // Animación del jugador caminando
    scene.anims.create({
        key: 'bear_walk',
        frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
        frameRate: 12,
        repeat: -1 // Repite la animación continuamente
    });

    player.anims.play('bear_walk'); // Activar animación por defecto
}

// Función para crear los árboles interactivos
function createTrees(scene, treePositions) {
    const trees = scene.physics.add.group(); // Crear un grupo de árboles

    // Generar cada árbol en las posiciones definidas
    treePositions.forEach(position => {
        const tree = trees.create(position.x, position.y, 'arbol').setInteractive(); // Árbol interactivo
        tree.setImmovable(true); // El árbol no se mueve si lo chocan
        tree.setOrigin(0.5, 1); // Cambiar el punto de origen del sprite
        tree.body.setSize(tree.width * 0.2, tree.height * 0.2); // Reducir el área de colisión
        tree.body.setOffset(tree.width * 0.42, tree.height * 0.8); // Ajustar el offset del cuerpo
        tree.clickCount = 0; // Contador de clics para talar el árbol

        // Evento al hacer clic en el árbol
        tree.on('pointerdown', function () {
            handleTreeClick(scene, tree);
        });
    });

    return trees; // Devolver el grupo de árboles creados
}

// Función que maneja la tala del árbol al hacer clic
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

// Función que genera posiciones de árboles sin superponerlos
function generateNonOverlappingTreePositions(minDistance) {
    const positions = [];

    // Generar 'numTrees' posiciones no superpuestas
    for (let i = 0; i < numTrees; i++) {
        let validPosition = false;
        let x, y;

        // Intentar generar una posición válida
        while (!validPosition) {
            x = Phaser.Math.Between(50, fondoX - 50); // Generar coordenada X
            y = Phaser.Math.Between(50, fondoY - 50); // Generar coordenada Y
            validPosition = true;

            // Verificar que la posición esté lo suficientemente lejos de otras
            for (let pos of positions) {
                const distance = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
                if (distance < minDistance) {
                    validPosition = false;
                    break;
                }
            }
        }

        // Si es válida, añadir la posición al array
        positions.push({ x: x, y: y });
    }

    return positions; // Devolver las posiciones generadas
}

// Función para crear los corazones (vidas) sobre el jugador
function createHearts(scene) {
    heartsGroup = scene.add.group(); // Crear grupo de corazones (vidas)

    // Añadir 'lives' corazones al grupo
    for (let i = 0; i < lives; i++) {
        let heart = scene.add.image(player.x, player.y, 'vida').setScale(0.4); // Corazón
        heartsGroup.add(heart); // Añadir cada corazón al grupo
    }
}

function generatePassiveAnimals(scene, numAnimals) {
    const animals = scene.physics.add.group();

    for (let i = 0; i < numAnimals; i++) {
        let x, y;
        do {
            x = Phaser.Math.Between(100, fondoX - 100);
            y = Phaser.Math.Between(100, fondoY - 100);
        } while (isWithinCameraView(x, y, scene.cameras.main));

        // Seleccionar aleatoriamente qué tipo de animal generar
        const animalType = Phaser.Math.Between(0, 1); // 0 para conejo, 1 para ciervo
        
        let animal;
        if (animalType === 0) {
            // Crear un conejo
            animal = animals.create(x, y, 'rabbit').setInteractive();
            animal.animalType = 'rabbit'; // Asignar tipo de animal
            scene.anims.create({
                key: 'rabbit_walk',
                frames: scene.anims.generateFrameNumbers('rabbit', { start: 0, end: 1 }),
                frameRate: 9,
                repeat: -1
            });
        } else {
            // Crear un ciervo
            animal = animals.create(x, y, 'deer').setInteractive().setScale(0.8);
            animal.animalType = 'deer'; // Asignar tipo de animal
            scene.anims.create({
                key: 'deer_walk',
                frames: scene.anims.generateFrameNumbers('deer', { start: 1, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        animal.health = 3; // Asignar vida a cada animal pasivo

        // Mover el animal aleatoriamente
        let animalEvent = scene.time.addEvent({
            delay: 1000,
            callback: () => moveAnimalRandomly(scene, animal),
            loop: true
        });
        
        // Escucha cuando se clickea al animal para hacerle daño
        animal.on('pointerdown', () => {
            dealDamageToAnimal(animal, scene, animalEvent);
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

function moveAnimalRandomly(scene, animal) {
    const directions = ['left', 'right', 'up', 'down'];
    const direction = Phaser.Utils.Array.GetRandom(directions);

    let velocityX = 0;
    let velocityY = 0;

    // Usamos if para establecer la velocidad en X según la dirección
    if (direction === 'left') {
        velocityX = -animalSpeed; // Mover a la izquierda
        if (animal.animalType === 'rabbit') {
            animal.anims.play('rabbit_walk');
        } else if (animal.animalType === 'deer') {
            animal.anims.play('deer_walk');
        }
        animal.flipX = false;
    } else if (direction === 'right') {
        velocityX = animalSpeed; // Mover a la derecha
        if (animal.animalType === 'rabbit') {
            animal.anims.play('rabbit_walk');
        } else if (animal.animalType === 'deer') {
            animal.anims.play('deer_walk');
        }
        animal.flipX = true;
    } else {
        velocityX = 0; // No moverse en el eje X
    }

    // Usamos if para establecer la velocidad en Y según la dirección
    if (direction === 'up') {
        velocityY = -animalSpeed; // Mover hacia arriba
        if (animal.animalType === 'rabbit') {
            animal.anims.play('rabbit_walk');
        } else if (animal.animalType === 'deer') {
            animal.anims.play('deer_walk');
        }
    } else if (direction === 'down') {
        velocityY = animalSpeed; // Mover hacia abajo
        if (animal.animalType === 'rabbit') {
            animal.anims.play('rabbit_walk');
        } else if (animal.animalType === 'deer') {
            animal.anims.play('deer_walk');
        }
    } else {
        velocityY = 0; // No moverse en el eje Y
    }

    // Aplicar las velocidades calculadas al animal
    animal.setVelocity(velocityX, velocityY);
}



function moveHostileAnimalTowardsPlayer(scene, animal, speed, animationKey) {
    const distance = Phaser.Math.Distance.Between(animal.x, animal.y, player.x, player.y);

    if (distance < detectionRange) {
        const directionX = player.x - animal.x;
        const directionY = player.y - animal.y;

        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
        const normalizedX = directionX / magnitude;
        const normalizedY = directionY / magnitude;

        animal.setVelocity(normalizedX * speed, normalizedY * speed);
        animal.flipX = directionX > 0;

        animal.anims.play(animationKey, true); // Reproducir la animación específica del animal
    } else {
        animal.setVelocity(0);
    }
}

function createHostileAnimal(scene, x, y, type) {

    let animal;
    let speed;
    let animationKey;
    let health;

    if (type === 'wolf') {
        animal = scene.physics.add.sprite(x, y, 'wolf').setInteractive().setScale(0.5);
        speed = hostilesSpeed;
        animationKey = 'wolf_walk';
        health = 5;
        scene.anims.create({
            key: animationKey,
            frames: scene.anims.generateFrameNumbers('wolf', { start: 0, end: 4 }),
            frameRate: 6,
            repeat: -1
        });
    } else if (type === 'boar') {
        animal = scene.physics.add.sprite(x, y, 'boar').setInteractive().setScale(0.6);
        speed = hostilesSpeed;
        animationKey = 'boar_walk';
        health = 5;
        scene.anims.create({
            key: animationKey,
            frames: scene.anims.generateFrameNumbers('boar', { start: 0, end: 6 }),
            frameRate: 6,
            repeat: -1
        });
    } else if (type === 'tiger') {
        animal = scene.physics.add.sprite(x, y, 'tiger').setInteractive().setScale(0.6);
        speed = hostilesSpeed + 20; // Tigre más rápido
        animationKey = 'tiger_walk';
        health = 6;
        scene.anims.create({
            key: animationKey,
            frames: scene.anims.generateFrameNumbers('tiger', { start: 0, end: 5 }),
            frameRate: 6,
            repeat: -1
        });
    }

    animal.health = health;

    // Configurar el comportamiento de movimiento hacia el jugador
    let animalEvent = scene.time.addEvent({
        delay: 100,
        callback: () => moveHostileAnimalTowardsPlayer(scene, animal, speed, animationKey),
        loop: true
    });

    // Escucha cuando se clickea al animal para hacerle daño
    animal.on('pointerdown', () => {
        dealDamageToAnimal(animal, scene, animalEvent);
    });

    return animal;
}


// Función para generar varios animales hostiles
function generateHostileAnimals(scene, numAnimals) {
    const animals = scene.physics.add.group();

    for (let i = 0; i < numAnimals; i++) {
        let x, y;
        do {
            x = Phaser.Math.Between(50, fondoX - 50);
            y = Phaser.Math.Between(50, fondoY - 50);
        } while (isWithinCameraView(x, y, scene.cameras.main));

        const animalType = Phaser.Math.RND.pick(['wolf', 'boar', 'tiger']);
        const animal = createHostileAnimal(scene, x, y, animalType);

        animals.add(animal);
        scene.physics.add.overlap(player, animal, () => handleHostileAnimal(scene, animal), null, scene);
    }

    return animals;
}


function handleHostileAnimal(scene, animal) {
    if (!player.invulnerable && lives != 0) {
        lives -= 1;
        heartsGroup.getChildren().pop().destroy();
        player.invulnerable = true;
        player.setTint(0xff0000);  // Cambiar a rojo al recibir daño
        scene.time.delayedCall(1000, () => {
            player.invulnerable = false;
            player.clearTint();  // Volver al color original
        });
    }
}

function dealDamageToAnimal(animal, scene, animalEvent) {
    if(animal.health!=0){
        animal.health -= 1; // Reducir la salud del animal
        animal.setVelocity(0)
        // Cambiar el color a rojo
        animal.setTint(0xff0000);
        // Después de un pequeño tiempo, restaurar el color
        scene.time.delayedCall(500, () => {
            animal.clearTint();
        }); 
    }
    // Si la salud del animal es 0, destruirlo
    if (animal.health === 0) {
        // Desactivar cualquier colisión y movimiento
        animal.body.enable = false; // Desactivar colisiones físicas
        animal.anims.stop();

        // Remover el animal del grupo, si está en uno
        if (animal.parentContainer) {
            animal.parentContainer.remove(animal);
        }

        // Usar un retraso para asegurarte de que no está en uso en otro evento
        scene.time.delayedCall(50, () => {
            animalEvent.remove();
            animal.destroy();
        });
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

// Función principal de creación del juego
function create() {
    background = this.add.tileSprite(fondoX / 2, fondoY / 2, fondoX, fondoY, 'grass'); // Crear fondo

    // Crear jugador
    createPlayer(this);

    this.animals = generatePassiveAnimals(this, numPassiveAnimals);
    
    generateHostileAnimals(this, numHostileAnimals);

    // Crear árboles y añadir colisión con el jugador
    const treePositions = generateNonOverlappingTreePositions(100); // Separación mínima de 100px
    this.trees = createTrees(this, treePositions);
    this.physics.add.collider(player, this.trees); // Colisión entre jugador y árboles
    
    createHearts(this);

    // Controles de movimiento (teclado)
    cursors = this.input.keyboard.createCursorKeys(); // Flechas de dirección
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

    // Configurar la cámara para que siga al jugador
    this.cameras.main.startFollow(player);
    this.cameras.main.setZoom(2); // Zoom de la cámara
    this.cameras.main.setBounds(0, 0, fondoX, fondoY); // Límites de la cámara
    this.physics.world.setBounds(0, 0, fondoX, fondoY); // Límites del mundo del juego
}


// Función de actualización del juego (se ejecuta en cada frame)
function update() {
    player.setVelocity(0); // Detener al jugador por defecto

    // Control de movimiento con flechas o teclas WASD
    if (cursors.left.isDown || wasdKeys.left.isDown) {
        player.setVelocityX(-speed); // Mover a la izquierda
        player.flipX = false; // No voltear horizontalmente
    } else if (cursors.right.isDown || wasdKeys.right.isDown) {
        player.setVelocityX(speed); // Mover a la derecha
        player.flipX = true; // Voltear horizontalmente
    }

    if (cursors.up.isDown || wasdKeys.up.isDown) {
        player.setVelocityY(-speed); // Mover hacia arriba
    } else if (cursors.down.isDown || wasdKeys.down.isDown) {
        player.setVelocityY(speed); // Mover hacia abajo
    }

    // Reproducir la animación de caminar solo si el jugador se está moviendo
    if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
        player.anims.play("bear_walk", true);
    } else {
        player.anims.play("bear_walk", false); // Detener animación si no hay movimiento
    }

    // Actualizar la posición de los corazones (vidas) sobre el jugador
    const totalWidth = (lives - 1) * 5.9; // Espaciado entre corazones
    heartsGroup.children.iterate((heart, index) => {
        heart.x = player.x - totalWidth / 2 + (index * 7); // Centramos los corazones
        heart.y = player.y - 17; // Mantener los corazones encima del jugador
    });
    
}
 