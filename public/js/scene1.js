class scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("logo", "images/logo.png");
    }

    create() {
        this.add.text(config.scale.width/2, 100, "Happy Life Game", {font: "128px Georgia"}).setOrigin(0.5);
        this.add.text(config.scale.width/2, 800, "Press space to start", {font: "48px Georgia"}).setOrigin(0.5);
        this.keyboard = this.input.keyboard.addKeys("SPACE");
    }

    update() {
        if (this.keyboard.SPACE.isDown) {
            this.scene.start("playGame");
        }
    }
}