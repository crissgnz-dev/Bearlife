// Configuración del juego
const config = {
    type: Phaser.AUTO, // Tipo de renderizado (automático: WebGL o Canvas)
    width: window.innerWidth, // Ancho del juego igual al ancho de la ventana
    height: window.innerHeight, // Alto del juego igual al alto de la ventana
    physics: {
        default: 'arcade', // Motor de física por defecto
        arcade: {
            gravity: { y: 0 }, // Sin gravedad en el eje Y
            debug: true, // Habilitar el modo de depuración
            debugShowBody: true, // Mostrar los cuerpos físicos
            debugShowStaticBody: true, // Mostrar los cuerpos estáticos
            debugBodyColor: 0xff0000
        }
    },
    scene: {
        preload: preload, // Función para cargar recursos
        create: create, // Función para crear objetos
        update: update // Función para actualizar el juego
    }
};

// Crear una nueva instancia del juego con la configuración anterior
const game = new Phaser.Game(config);

let player, cursors, background;
let fondoX = 10000, fondoY = 10000; // Dimensiones del fondo

// Función para cargar recursos
function preload() {
    this.load.image('player', './img/oso2.png'); // Cargar la imagen del personaje
    this.load.image('vida', './img/corazon.png'); // Cargar la imagen del personaje
    this.load.image('grass', './img/cesped3.png'); // Cargar la imagen del fondo
    this.load.image('arbol', './img/arbol2.png'); // Cargar la imagen del árbol
    this.load.image('tocon', './img/tronco3.png'); // Cargar la imagen del árbol
}

// Arrays para almacenar las posiciones X e Y de los árboles
const treeX = [];
const treeY = [];
const numTrees = 150; // Número total de árboles

// Ajustar la longitud de los arrays al número de árboles
treeX.length = numTrees;
treeY.length = numTrees;

// Generar posiciones aleatorias para los árboles
for (let i = 0; i < numTrees; i++) {
    let cerca; // Variable para verificar si los árboles están demasiado cerca
    do {
        cerca = false;
        // Generar una posición aleatoria para el árbol dentro de los límites del fondo
        treeX[i] = Math.floor((Math.random() * (fondoX - 300)) + 200);
        treeY[i] = Math.floor((Math.random() * (fondoY - 300)) + 200);

        // Verificar si el árbol está demasiado cerca de otro árbol
        for (let j = 0; j < i; j++) {
            if (Math.abs(treeX[i] - treeX[j]) < 40 && Math.abs(treeY[i] - treeY[j]) < 40) {
                cerca = true;
                break;
            }
        }
    } while (cerca); // Repetir hasta que la posición sea adecuada
}

console.log(treeX + " & " + treeY); // Imprimir las posiciones de los árboles

function create() {

    // Crear el fondo del juego
    background = this.add.tileSprite(0, 0, fondoX, fondoY, 'grass');
    
    // Crear el jugador
    this.player = this.physics.add.sprite(100, 100, 'player').setScale(0.8);
    this.player.setCollideWorldBounds(true); // Evitar que el jugador salga del mundo
    
    // Configurar los controles del teclado
    cursors = this.input.keyboard.createCursorKeys();
    
    // Configurar la cámara para seguir al jugador
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(2.2);

    // Crear un grupo de árboles
    this.trees = this.physics.add.group();
    for (let i = 0; i < numTrees; i++) {
        // Crear cada árbol en la posición generada
        let tree = this.trees.create(treeX[i], treeY[i], 'arbol').setScale(1).setInteractive();
        tree.setImmovable(true); // Hacer que los árboles sean inmóviles
        tree.body.setSize(tree.width * 0.2, tree.height * 0.4); // Ajustar el tamaño del cuerpo del árbol
        tree.body.setOffset(tree.width * 0.42, tree.height * 0.53); // Ajustar el offset del cuerpo del árbol
    }

    // Configurar la interacción con los árboles
    this.trees.children.iterate(function (tree) {
        tree.on('pointerdown', function (pointer) {
            tree.setTexture("tocon"); // Cambiar la textura del árbol al ser clicado
            tree.body.setSize(tree.width * 0.2, tree.height * 0.4); // Ajustar el tamaño del cuerpo del árbol
            tree.body.setOffset(tree.width * 0.41, tree.height * 0.59); // Ajustar el offset del cuerpo del árbol
            tree.disableInteractive(); // Deshabilitar la interacción
            this.time.delayedCall(2000, function () {
                tree.setTexture('arbol'); // Restaurar la textura original después de 5 segundos
                tree.body.setSize(tree.width * 0.2, tree.height * 0.4); // Ajustar el tamaño del cuerpo del árbol
                tree.body.setOffset(tree.width * 0.42, tree.height * 0.53); // Ajustar el offset del cuerpo del árbol
                tree.setInteractive(); // Habilitar la interacción nuevamente
            }, [], this);
        }, this);
    }, this);

    // Añadir colisión entre el jugador y los árboles
    this.physics.add.collider(this.player, this.trees);

    let x= this.player.x;
    let y= this.player.y;

    this.hearts = this.add.group({
        key: 'vida',
        repeat: 2, // Número de corazones menos uno
        setXY: { x: x, y: y, stepX: 30 }
    });

    this.lives = 3; // Número inicial de vidas

    // Establecer los límites del mundo y la cámara
    this.cameras.main.setBounds(0, 0, fondoX, fondoY); // Los límites de la cámara
    this.physics.world.setBounds(0, 0, fondoX, fondoY); // Limitar el movimiento del personaje dentro del mundo

    // Ajustar el tamaño del juego cuando se redimensiona la ventana
    window.addEventListener('resize', resizeGame);
}

// Función para actualizar el juego en cada frame
function update() {

    this.player.setVelocity(0); // Detener el movimiento del personaje

    // Movimiento a la izquierda
    if (cursors.left.isDown) {
        this.player.setVelocityX(-200);
        this.player.flipX = false;
    } 
    // Movimiento a la derecha
    else if (cursors.right.isDown) {
        this.player.setVelocityX(200);
        this.player.flipX = true;
    }

    // Movimiento hacia arriba
    if (cursors.up.isDown) {
        this.player.setVelocityY(-200);
    } 
    // Movimiento hacia abajo
    else if (cursors.down.isDown) {
        this.player.setVelocityY(200);
    }
}

// Función para redimensionar el juego cuando se cambia el tamaño de la ventana
function resizeGame() {
    let canvas = game.canvas;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    game.scale.resize(width, height);
}

