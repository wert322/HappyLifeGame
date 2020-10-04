class scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("logo", "images/logo.png");
        this.load.image("startButton", "images/start_button.png");
    }

    create() {
            // debug tools
            this.debugText = this.add.text(0, 0, "", {fontSize: "20px", fontFamily: "Roboto"}).setOrigin(0);
            this.debugText.visible = debugMode;

        // counter used to update room players
        this.updateRoomCounter = 0;

        // start screen title and buttons
        this.title = this.add.text(canvasWidth / 2, 100, "Happy Life Game", {font: "128px Roboto", align: "center"}).setOrigin(0.5);
        // this.add.sprite(150, 100, "logo").setOrigin(0.5).setScale(0.25);
        
        // set up start button to start game on press if 2+ players in the room
        this.startButton = this.add.sprite(canvasWidth / 2, canvasHeight - 150, "startButton").setOrigin(0.5);
        this.notEnoughPlayers = this.add.text(canvasWidth / 2, canvasHeight - 250, "Need another player", {font: "48px Roboto", color: '#ff2626', align: "center"}).setOrigin(0.5);
        this.notEnoughPlayers.alpha = 0;
        this.startButton.setInteractive();
        var self = this;
        this.startButton.on('pointerdown', function() {
            if (players.length < 2) {
                self.needPlayer(self);
            } else if (!self.started) { // players.length >= 2
                socket.emit("gameStart", true);
                this.scene.scene.start("playGame");
            }
        });

        // update player list when room users changes
        socket.on('roomUsers', ({ room, users }) => {
            this.sys.game.scale.setGameSize(canvasWidth, canvasHeight);
            this.updatePlayerList(users);
        });

        // on game start automatically start the game
        socket.on('startGame', ({filler}) => {
            this.scene.start("playGame");
        });

        // display users in the room
        this.add.rectangle(canvasWidth / 2, canvasHeight / 2, canvasWidth / 2, canvasHeight / 2, "0xffffff").setOrigin(0.5);
        // Container for users
        this.allUserInfoText = this.add.container(0, 0);
        for (let i = 0; i < 6; i++) {
            this.add.rectangle(530 + 450 * (i % 2), 320 + 200 * Math.round((i - 1) / 2), 50, 50, colors[i]).setOrigin(0.5);
            let userText = this.add.text(580 + 450 * (i % 2), 320 + 200 * Math.round((i - 1) / 2), "", {font: "50px Roboto", color: "#111111"}).setOrigin(0, 0.5);
            this.allUserInfoText.add(userText);
        }

        // used to fix the scaling glitch
        this.sys.game.scale.setGameSize(canvasWidth, canvasHeight);
    }

    update() {
        // debugging variables
        this.debugText.setText("updateRoomCounter: " + this.updateRoomCounter);

        if (players.length === 0 && this.updateRoomCounter < updateRoomCounterMax) {
            this.updateRoomCounter++;
            if (this.updateRoomCounter === updateRoomCounterMax) {
                socket.emit("getRoomUsers", true);
            }
        }
        for (let i = 0; i < 6; i++) {
            let userText = this.allUserInfoText.getAt(i);
            if (i < players.length) {
                userText.setText(players[i].name);
            } else {
                userText.setText("");
            }
        }
    }

    // Adds room users to player list
    //      name          : the player's username
    //      playerColor   : the player color (used for player icon)
    //      location      : card location (0 means startcard, 1 means 1st card, etc)
    //      balance       : amount a user has in millions of yen
    //      childrenCount : number of children the player has
    //      married       : empty string if player is not married, partner's username if married
    //      traits        : an array that contains trait objects (name, description) the player has
    //      skipTurn      : boolean that stores if player skips their next turn
    updatePlayerList(users) {
        while (players.length > 0) {
            players.pop();
        }
        for (let i = 0; i < users.length; i++) {
            var color = colors[i];
            if (users[i].username === username) {
                userID = i;
            }
            let user = {name: users[i].username, playerColor: color, location: 0, balance: 0, childrenCount: 0, married: "", traits: [], skipTurn: false};
            players.push(user);
        }
    }

    // if not enough players in the room, show the message
    needPlayer(self) {
        self.notEnoughPlayers.alpha = 1;
        self.tweens.add({
            targets: self.notEnoughPlayers,
            props: {
                alpha: 0
            },
            delay: 2000,
            duration: 500,
            yoyo: false,
            repeat: 0
        });
    }
}