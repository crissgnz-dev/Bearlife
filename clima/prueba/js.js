const config = {
    type: Phaser.AUTO,
    width: 1245,
    height: 810,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'imagenes/Background_Free_Valley_pack/Background_Layered.png');
    this.load.spritesheet('character', 'imagenes/lpc_entry/png/walkcycle/BODY_male.png', { frameWidth: 50, frameHeight: 65 });
}

function create() {
    this.add.image(400, 300, 'background');
    this.player = this.physics.add.sprite(400, 300, 'character');

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('character', { start: 0, end: 100 }),
        frameRate: 10,
        repeat: -1
    });

    this.player.anims.play('walk');
}

function update() {
    const cursors = this.input.keyboard.createCursorKeys();

    if (cursors.left.isDown) {
        this.player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        this.player.setVelocityX(160);
    } else {
        this.player.setVelocityX(0);
    }

    if (cursors.up.isDown) {
        this.player.setVelocityY(-160);
    } else if (cursors.down.isDown) {
        this.player.setVelocityY(160);
    } else {
        this.player.setVelocityY(0);
    }
}

