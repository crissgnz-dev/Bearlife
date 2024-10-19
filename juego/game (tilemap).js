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
let fondoX = 5000, fondoY = 5000;
const numTrees = 150; // Número total de árboles
const numRocks = 50;  // Número total de rocas
let lives = 3; // Vidas del jugador

function preload() {
    this.load.spritesheet('player', './img/oso.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('vida', './img/corazon.png');
    this.load.image('grass', './img/grass2.png');
    this.load.image('dirt', './img/dirt.png'); // Terreno de tierra
    this.load.image('water', './img/water.jpg'); // Agua
    this.load.image('arbol', './img/arbol.png');
    this.load.image('tocon', './img/arbol_tronco.png');
    this.load.image('rock', './img/piedra.png'); // Imagen de roca
}

function createPlayer(scene) {
    player = scene.physics.add.sprite(100, 100, 'player').setScale(0.8);
    player.setCollideWorldBounds(true);

    scene.anims.create({
        key: 'bear_walk',
        frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
        frameRate: 12,
        repeat: -1
    });

    player.anims.play('bear_walk');
}

// Función para generar posiciones aleatorias sin superposición
function generateNonOverlappingPositions(minDistance, numObjects, areaWidth, areaHeight) {
    const positions = [];

    for (let i = 0; i < numObjects; i++) {
        let validPosition = false;
        let x, y;

        while (!validPosition) {
            x = Phaser.Math.Between(50, areaWidth - 50); // Evitar bordes
            y = Phaser.Math.Between(50, areaHeight - 50);
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

// Crear un grupo de árboles
function createTrees(scene, treePositions) {
    const trees = scene.physics.add.group();

    treePositions.forEach(position => {
        const tree = trees.create(position.x, position.y, 'arbol').setInteractive();
        tree.setImmovable(true);
        tree.setOrigin(0.5, 1);
        tree.body.setSize(tree.width * 0.2, tree.height * 0.2);
        tree.body.setOffset(tree.width * 0.42, tree.height * 0.8);
        tree.clickCount = 0;

        tree.on('pointerdown', function() {
            handleTreeClick(scene, tree);
        });
    });

    return trees;
}

// Crear un grupo de rocas
function createRocks(scene, rockPositions) {
    const rocks = scene.physics.add.group();

    rockPositions.forEach(position => {
        const rock = rocks.create(position.x, position.y, 'rock');
        rock.setImmovable(true);
    });

    return rocks;
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

// Crear corazones sobre el personaje
function createHearts(scene) {
    heartsGroup = scene.add.group();

    for (let i = 0; i < lives; i++) {
        let heart = scene.add.image(player.x, player.y, 'vida').setScale(0.5);
        heartsGroup.add(heart);
    }
}

// Generar el fondo dinámico
function createBackground(scene) {
    for (let x = 0; x < fondoX; x += 64) {
        for (let y = 0; y < fondoY; y += 64) {
            let tileType = Phaser.Math.Between(0, 1); // 0 = grass, 1 = dirt, 2 = water
            let texture = (tileType === 0) ? 'grass' : (tileType === 1) ? 'dirt' : 'water';
            scene.add.tileSprite(x, y, 64, 64, texture);
        }
    }
}

// Crear el mundo
function createWorld(scene) {
    // Generar árboles
    const treePositions = generateNonOverlappingPositions(100, numTrees, fondoX, fondoY);
    scene.trees = createTrees(scene, treePositions);

    // Generar rocas
    const rockPositions = generateNonOverlappingPositions(100, numRocks, fondoX, fondoY);
    scene.rocks = createRocks(scene, rockPositions);
}

function create() {
    // Crear el fondo
    createBackground(this);

    // Crear el jugador
    createPlayer(this);

    // Crear el mundo con árboles, rocas, etc.
    createWorld(this);

    // Crear corazones
    createHearts(this);

    // Colisiones
    this.physics.add.collider(player, this.trees);
    this.physics.add.collider(player, this.rocks);

    // Configurar controles
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

let speed = 100;
function update() {
    player.setVelocity(0);

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

    const totalWidth = (lives - 1) * 15;

    heartsGroup.children.iterate((heart, index) => {
        heart.x = player.x - totalWidth / 2 + (index * 15);
        heart.y = player.y - 18;
    });
}
