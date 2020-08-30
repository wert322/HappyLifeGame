const cardCount = 99; // number of cards excluding start/goal
const players = []; // stores player info
const userID = -1; // user ID
const { username, room } = Qs.parse(location.search, { // username and room
    ignoreQueryPrefix: true
});

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
