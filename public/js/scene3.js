/**
 * This is the results screen once the game has ended.
 */
class scene3 extends Phaser.Scene {
    constructor() {
        super("endGame");
    }

    preload() {
        this.results = this.text.add(canvasHeight / 2, canvasWidth / 2, "", {font: "50px Roboto"}).setOrigin(0.5);
        socket.on('finalTabulation', ({usernames, balances}) => {
            var outcome = "Results:\n";
            for (let i = 0; i < players.length; i++) {
                outcome += i + ': ' +  usernames[i] + " with " + balances[i] + 'million 円';
                if (i !== players.length - 1) {
                    outcome += '\n';
                }
            }
            this.results.setText(outcome);
        });
    }

    create() {
        this.text.add(0, 0, "Game Ended", {font: "50px Roboto"});
    }

    update() {}
}