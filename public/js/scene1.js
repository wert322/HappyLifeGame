class scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("logo", "images/logo.png");
    }

    create() {
        this.add.text(config.scale.width/2, 100, "Happy Life Game", {font: "128px Georgia"}).setOrigin(0.5);
        this.add.text(config.scale.width/2, 800, "Press space to start", {font: "48px Georgia"}).setOrigin(0.5);
        this.keyboard = this.input.keyboard.addKeys("SPACE");
    }

    update() {
        if (this.keyboard.SPACE.isDown) {
            this.scene.start("playGame");
        }
        socket.on('roomUsers', ({ room, users }) => {
            this.updatePlayerList(users);
        });
    }

    // adds room users to player list
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
            let user = {name: users[i].username, playerColor: color, location: 0, money: 0};
            players.push(user);
        }
    }
}