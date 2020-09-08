const cardCount = 99; // Number of cards excluding start/goal
const players = []; // Stores player info
const cardMoveToCenterTime = 1000; // Time needed to move landed card to middle of screen
const cardFlipTime = 500; // Time needed to flip landed card
const canvasWidth = 1920; // Width of the canvas
const canvasHeight = 1080; // Height of the canvas

// user colors: red         orange      yellow      green       light blue  blue
const colors = ["0xFF5757", "0xFF9C57", "0xFFF4B7", "0xE2F0CB", "0x85EAD7", "0xC7CEEA"];

var userID = -1; // user ID

const config = {
    type: Phaser.AUTO,
    scale: {
        parent: 'gameDiv',
        mode: Phaser.Scale.FIT,
        width: canvasWidth,
        height: canvasHeight
    },
    // backgroundColor: 0xdda0dd,
    backgroundColor: 0xffbfea,
    scene: [scene1, scene2]
}

const game = new Phaser.Game(config);
