/** board setup */
const canvasWidth = 1920; // Width of the canvas
const canvasHeight = 1080; // Height of the canvas
const cardCount = 99; // Number of cards excluding start/goal
const debugMode = true; // debug mode (shows certain variable info in top left)
const updateRoomCounterMax = 100; // Counter used for updating player room

/** user colors: red         orange      yellow      green       light blue  blue */
const colors = ["0xFF5757", "0xFF9C57", "0xFFF4B7", "0xE2F0CB", "0x85EAD7", "0xC7CEEA"];

/** Stores player info, specifically these conditions.
 *     name          : the player's username
 *     playerColor   : the player color (used for player icon)
 *     location      : card location (0 means startcard, 1 means 1st card, etc)
 *     balance       : amount a user has in millions of yen
 *     childrenCount : number of children the player has
 *     married       : empty string if player is not married, partner's username if married
 *     traits        : an array that contains trait objects (name, description) the player has
 *     addToRoll     : number that stores number added to their roll on their next turn
 *     skipTurn      : number that stores number of turns the player skips
 *     alive         : boolean that stores if player is alive
 */
const players = [];


/** Animation Timings */
const cardMoveToCenterTime = 1000;  // Time needed to move landed card to middle of screen
const moveForwardOneCardTime = 250; // Time needed to move player token up by one card
const cardFlipTime = 500;           // Time needed to flip landed card

var userID = -1; // user ID

const rollInfo = {playerID: -1, roll: -1, type: "", optionIDs: []}; // stores the roll info

const config = {
    type: Phaser.AUTO,
    scale: {
        parent: 'gameDiv',
        mode: Phaser.Scale.FIT,
        width: canvasWidth,
        height: canvasHeight,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
    backgroundColor: 0xffbfea,
    scene: [scene1, scene2, scene3]
}

const game = new Phaser.Game(config);
