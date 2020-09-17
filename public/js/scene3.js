class scene3 extends Phaser.Scene {
    constructor() {
        super("endGame");
    }

    preload() {}

    create() {
        this.text.add(0, 0, "Game ended", {font: "50px Roboto"});
    }

    update() {}
}