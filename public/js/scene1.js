class scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("logo", "images/logo.png");
    }

    create() {
        // Text used in start screen
        this.title = this.add.text(canvasWidth / 2, 100, "Happy Life Game", {font: "128px Georgia", align: "center"}).setOrigin(0.5);
        this.add.text(canvasWidth / 2, canvasHeight - 100, "Click to start", {font: "48px Georgia", align: "center"}).setOrigin(0.5);

        // this.add.sprite(150, 100, "logo").setOrigin(0.5).setScale(0.25);

        // Update player list when room users changes
        socket.on('roomUsers', ({ room, users }) => {
            this.updatePlayerList(users);
        });

        // Display users in the room
        this.add.rectangle(canvasWidth / 2, canvasHeight / 2, canvasWidth / 2, canvasHeight / 2, "0xffffff").setOrigin(0.5);
        // Container for users
        this.allUserInfoText = this.add.container(0, 0);
        for (let i = 0; i < 6; i++) {
            this.add.rectangle(530 + 450 * (i % 2), 320 + 200 * Math.round((i - 1) / 2), 50, 50, colors[i]).setOrigin(0.5);
            let userText = this.add.text(580 + 450 * (i % 2), 320 + 200 * Math.round((i - 1) / 2), "", {font: "50px arial", color: "#111111"}).setOrigin(0, 0.5);
            this.allUserInfoText.add(userText);
        }
    }

    update() {
        if (this.input.activePointer.isDown && players.length >= 2) {
            // add emit to lock the room here
            this.scene.start("playGame");
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
    updatePlayerList(users) {
        while (players.length > 0) {
            players.pop();
        }
        for (let i = 0; i < users.length; i++) {
            var color = colors[i];
            if (users[i].username === username) {
                userID = i;
            }
            let user = {name: users[i].username, playerColor: color, location: 0, balance: 0, childrenCount: 0, married: "", traits: []};
            players.push(user);
        }
    }
}