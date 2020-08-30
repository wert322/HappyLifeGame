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
                color = "#FF9AA2";
            } else if (i === 1) {
                color = "#FFB7B2";
            } else if (i === 2) {
                color = "#FFDAC1";
            } else if (i === 3) {
                color = "#E2F0CB";
            } else if (i === 4) {
                color = "#85EAD7";
            } else { // if i === 5
                color = "#C7CEEA";
            }
            if (users[i].username === username) {
                userID = i;
            }
            let user = {id: i, name: users[i].username, playerColor: color, location: 0, money: 0};
            players.push(user);
        }
    }
}