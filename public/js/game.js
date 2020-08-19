const gameState = {}

function preload() {
  this.load.image('cardChildEvent', 'images/Child_Event_Card.png');
  this.load.image('cardChildMisfortune', 'images/Child_Misfortune_Card.png');
  this.load.image('cardChildLucky', 'images/Child_Lucky_Card.png');
}

function create() {
  gameState.cursors = this.input.keyboard.createCursorKeys();
  gameState.cardChildEvent = this.add.sprite(150, 100, 'cardChildEvent');
  gameState.cardChildEvent.width=100;
}

function update() {
   if (gameState.cursors.down.isDown) {
   gameState.cardChildEvent.y += 1;
 }
}

const config = {
  type: Phaser.CANVAS,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innnerWidth * window.devicePixelRatio,
    height: 0.5 * window.innnerWidth * window.devicePixelRatio
  },
  backgroundColor: 0xdda0dd,
  scene: {
    preload,
    create,
    update
  }
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

function setupBoard {
  var card01 = {age:"child",type:"event"};
}
