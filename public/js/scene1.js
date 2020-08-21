class scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("logo", "images/logo.png");
    }

    create() {
        this.add.text(config.scale.width/2 - 550, 20, "Happy Life Game", {font: "128px Georgia"});
        this.add.text(config.scale.width/2 - 200, 800, "Press space to start", {font: "48px Georgia"});
        this.keyboard = this.input.keyboard.addKeys("SPACE");
    }

    update() {
        if (this.keyboard.SPACE.isDown) {
            this.scene.start("playGame");
        }
    }
}