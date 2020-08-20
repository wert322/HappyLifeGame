const config = {
    type: Phaser.AUTO,
    scale: {
        parent: 'gameDiv',
        mode: Phaser.Scale.FIT,
        width: 1600,
        height: 900
    },
    backgroundColor: 0xdda0dd,
    scene: [scene1, scene2]
}

const game = new Phaser.Game(config);
