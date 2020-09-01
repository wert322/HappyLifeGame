const cardCount = 99; // number of cards excluding start/goal
const players = []; // stores player info
const cardMoveToCenterTime = 1000; // time needed to move landed card to middle of screen
const cardFlipTime = 500; // time needed to flip landed card
var userID = -1; // user ID

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
