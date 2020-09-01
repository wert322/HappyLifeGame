class scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("logo", "images/logo.png");
    }

    create() {
        // Text used in start screen
        this.add.text(config.scale.width/2, 100, "Happy Life Game", {font: "128px Georgia"}).setOrigin(0.5);
        this.add.text(config.scale.width/2, 800, "Press space to start", {font: "48px Georgia"}).setOrigin(0.5);

        // Keyboard inputs
        this.keyboard = this.input.keyboard.addKeys("SPACE");

        // Update player list when room users changes
        socket.on('roomUsers', ({ room, users }) => {
            this.updatePlayerList(users);
        });
    }

    update() {
        if (this.keyboard.SPACE.isDown && players.length >= 2) {
            this.scene.start("playGame");
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
            var color = "";
            if (i === 0) {
                color = "0xFF5757"; // red
            } else if (i === 1) {
                color = "0xFF9C57"; // orange
            } else if (i === 2) {
                color = "0xFFF4B7"; // yellow
            } else if (i === 3) {
                color = "0xE2F0CB"; // green
            } else if (i === 4) {
                color = "0x85EAD7"; // light blue
            } else { // if i === 5
                color = "0xC7CEEA"; // blue
            }
            if (users[i].username === username) {
                userID = i;
            }
            let user = {name: users[i].username, playerColor: color, location: 0, balance: 0, childrenCount: 0, married: "", traits: []};
            players.push(user);
        }
    }
}