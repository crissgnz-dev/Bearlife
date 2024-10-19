// Configuración del juego
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'juego',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true,
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
const detectionRange = 300; // Rango de detección para lobos

// Variables configurables para la cantidad de animales
const numPassiveAnimals = 500; // Número de animales pasivos
const numHostileAnimals = 500;  // Número de animales hostiles

function preload() {
    this.load.spritesheet('player', './img/oso.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('vida', './img/corazon.png');
    this.load.image('grass', './img/grass2.png');
    this.load.image('arbol', './img/arbol.png');
    this.load.image('tocon', './img/arbol_tronco.png');
    this.load.spritesheet('rabbit', './img/conejo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('wolf', './img/lobo.png', { frameWidth: 64, frameHeight: 32});
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

// Manejar clic en los árboles
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
                tree.setAngle(0);
                tree.setTexture('tocon');
                tree.disableInteractive();

                scene.time.delayedCall(10000, () => {
                    tree.setTexture('arbol');
                    tree.setInteractive();
                    tree.clickCount = 0;
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
    const totalWidth = (lives - 1) * 15;

    heartsGroup.children.iterate((heart, index) => {
        heart.x = player.x - totalWidth / 2 + (index * 15);
        heart.y = player.y - 18;
    });
}
