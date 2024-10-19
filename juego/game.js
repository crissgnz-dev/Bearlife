// Configuración básica del juego en Phaser
const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 500,
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
 