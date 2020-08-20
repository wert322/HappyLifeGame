class scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    preload() {
        this.load.image('cardChildEvent', 'images/Child_Event_Card.png');
        this.load.image('cardChildMisfortune', 'images/Child_Misfortune_Card.png');
        this.load.image('cardChildLucky', 'images/Child_Lucky_Card.png');
    }
    
    create() {
        var cardlist = setupBoard();
        for (i = 0; i < 5; i++) {
            this.cardChildEvent1 = this.add.sprite(150, 100 + 150 * i, 'cardChildEvent');
            this.cardChildEvent1.setScale(0.175);
            this.cardChildEvent1.setAngle(180);
        }
    }

    update() {
        if (0) {
            this.update;
        }
    }
    
    // sets up the card orderings and returns an array of cards
    setupBoard() {
        let cardList = [];
        for (i = 0; i < 99; i++) {
            let card = {age:"", type:""};
            if (i < 33) {
                card.age = "child";
            } else if (i < 66) {
                card.age = "adult"
            } else {
                card.age = "old age"
            }
            if (i % 3 === 0) {
                card.type = "event";
            } else if (i % 3 === 1) {
                card.type = "lucky"
            } else {
                card.type = "misfortune"
            }
            cardList.push(card);
        }
        return cardList;
    }

    /* rolls a die and returns the value (1 to 6) */
    rollDie() {
        return Math.floor(Math.random() * 6 + 1);
    }

    // rolls two die and returns the sum, value(1 to 12)
    rollTwoDie() {
        return rollDie() + rollDie();
    }
}