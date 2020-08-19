class scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("logo", "images/logo.png");
    }

    create() {
        this.add.text(window.innnerWidth, 20, "Happy Life Game", {font: "28px cursive"});
        this.add.text(window.innnerWidth, 20, "Press space to ready up", {font: "12px cursive"});
        this.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.spaceKey.isDown) {
            this.scene.start("playGame");
        }
    }
}