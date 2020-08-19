const config = {
    type: Phaser.AUTO,
    scale: {
        parent: 'gameDiv',
        mode: Phaser.Scale.FIT,
        width: 800,
        height: 600
    },
    backgroundColor: 0xdda0dd,
    scene: [scene1, scene2]
}

const game = new Phaser.Game(config);

/* rolls a die and returns the value (1 to 6) */
function rollDie() {
    return Math.floor(Math.random() * 6 + 1);
}

// rolls two die and returns the sum, value(1 to 12)
function rollTwoDie() {
    return rollDie() + rollDie();
}

const cardList = [];
function setupBoard() {
    for (i = 0; i < 99; i++) {
        var card = {age:"child", type:"event"};
        cardList.push(card);
    }
}
