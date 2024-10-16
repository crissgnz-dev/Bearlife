// Configuración del juego
const config = {
    type: Phaser.AUTO, 
    width: 1600,
    height: 690,
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

let player, cursors, wasdKeys, background, heartsGroup;
let fondoX = 5000, fondoY = 5000;
const numTrees = 150; // Número total de árboles
let lives = 3; // Vidas del jugador

function preload() {
    this.load.spritesheet('player', './img/oso.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('vida', './img/corazon.png');
    this.load.image('grass', './img/cesped3.png');
    this.load.image('arbol', './img/arbol.png');
    this.load.image('tocon', './img/arbol_tronco.png');
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

// Función para crear árboles y manejar su interacción
function createTrees(scene, treePositions) {
    const trees = scene.physics.add.group();

    treePositions.forEach(position => {
        const tree = trees.create(position.x, position.y, 'arbol').setInteractive();
        tree.setImmovable(true);
        tree.setOrigin(0.5, 1);
        tree.body.setSize(tree.width * 0.2, tree.height * 0.2);
        tree.body.setOffset(tree.width * 0.42, tree.height * 0.8);
        tree.clickCount = 0; // Inicializar el contador de clics

        tree.on('pointerdown', function() {
            handleTreeClick(scene, tree);
        });
    });

    return trees;
}

// Función que maneja el clic en los árboles
function handleTreeClick(scene, tree) {
    tree.clickCount++;

    const shakeTween = scene.tweens.add({
        targets: tree,
        angle: { from: -10, to: 10 },
        duration: 100,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
            tree.setAngle(0); // Resetear el ángulo después de la animación

            if (tree.clickCount >= 3) {
                shakeTween.stop();
                tree.setAngle(0); // Asegurarse de que vuelva a su posición original
                tree.setTexture('tocon');
                tree.disableInteractive();

                // Restaurar el árbol después de 10 segundos
                scene.time.delayedCall(10000, () => {
                    tree.setTexture('arbol');
                    tree.setInteractive();
                    tree.clickCount = 0; // Reiniciar contador
                });
            }
        }
    });
}

// Función para generar posiciones aleatorias de árboles sin superposición
function generateNonOverlappingTreePositions(minDistance) {
    const positions = [];

    for (let i = 0; i < numTrees; i++) {
        let validPosition = false;
        let x, y;

        // Intentar generar una posición válida hasta que se logre
        while (!validPosition) {
            x = Phaser.Math.Between(50, fondoX - 50); // Evita los bordes del mapa
            y = Phaser.Math.Between(50, fondoY - 50);
            validPosition = true;

            // Verificar si la nueva posición está lo suficientemente lejos de las anteriores
            for (let pos of positions) {
                const distance = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
                if (distance < minDistance) {
                    validPosition = false; // Si están muy cerca, no es una posición válida
                    break;
                }
            }
        }

        // Si encontramos una posición válida, la añadimos a la lista
        positions.push({ x: x, y: y });
    }

    return positions;
}


// Crear un grupo de corazones sobre el personaje
function createHearts(scene) {
    heartsGroup = scene.add.group();

    for (let i = 0; i < lives; i++) {
        // Crear los corazones como sprites más pequeños
        let heart = scene.add.image(player.x, player.y, 'vida').setScale(0.5);
        heartsGroup.add(heart);
    }
}

function create() {
    background = this.add.tileSprite(fondoX / 2, fondoY / 2, fondoX, fondoY, 'grass');

    // Crear jugador y corazones
    createPlayer(this);
    createHearts(this);

    // Crear árboles
    const treePositions = generateNonOverlappingTreePositions(100); // 100 píxeles de separación mínima
    this.trees = createTrees(this, treePositions);
    
    // Añadir colisiones entre jugador y árboles
    this.physics.add.collider(player, this.trees);

    // Configurar controles del teclado (Flechas y WASD)
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

    // Movimiento del jugador (Flechas y WASD)
    if (cursors.left.isDown || wasdKeys.left.isDown) {
        player.setVelocityX(-40);
        player.flipX = false;
    } else if (cursors.right.isDown || wasdKeys.right.isDown) {
        player.setVelocityX(40);
        player.flipX = true;
    }

    if (cursors.up.isDown || wasdKeys.up.isDown) {
        player.setVelocityY(-40);
    } else if (cursors.down.isDown || wasdKeys.down.isDown) {
        player.setVelocityY(40);
    }

    if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
        player.anims.play("bear_walk", true);
    } else {
        player.anims.play("bear_walk", false);
    }

    // Calcular el ancho total de los corazones
    const totalWidth = (lives - 1) * 15; // Espaciado entre corazones (20px entre cada uno)

    // Actualizar la posición de los corazones para que siempre estén centrados sobre el jugador
    heartsGroup.children.iterate((heart, index) => {
        heart.x = player.x - totalWidth / 2 + (index * 15); // Centramos los corazones
        heart.y = player.y - 18; // Mantener los corazones encima del jugador
    });
}
