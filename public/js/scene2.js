class scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    preload() {
        // All the cards used
        this.load.image('cardChildEvent', 'images/child_event_card.png');
        this.load.image('cardChildMisfortune', 'images/child_misfortune_card.png');
        this.load.image('cardChildLucky', 'images/child_lucky_card.png');
        this.load.image('cardAdultEvent', 'images/adult_event_card.png');
        this.load.image('cardAdultMisfortune', 'images/adult_misfortune_card.png');
        this.load.image('cardAdultLucky', 'images/adult_lucky_card.png');
        this.load.image('cardOldAgeEvent', 'images/old_age_event_card.png');
        this.load.image('cardOldAgeMisfortune', 'images/old_age_misfortune_card.png');
        this.load.image('cardOldAgeLucky', 'images/old_age_lucky_card.png');
        this.load.image('cardStart', 'images/start_card.png');
        this.load.image('cardGoal', 'images/goal_card.png');
    }
    
    create() {
        // Set up cards
        var cardList = this.setupCards();
        var cards = this.setupBoard(cardList);
        this.allCardsGroup = this.add.container(0, 0, cards);

        // Keyboard inputs
        this.keyboard = this.input.keyboard.addKeys("LEFT,RIGHT,UP,DOWN,SPACE,T,Y");

        // Game variables
        this.counter = 0; // testing purposes: what card to pick
        this.turn = false; // who's turn it is
        this.displayingCard = false; // currently displaying a card on the screen or not

        // Game variable display
        this.turnDisplay = this.add.text(100, 10, "false", {font: "60px arial"});
        this.counterDisplay = this.add.text(10, 10, "0", {font: "60px arial"});
    }

    update() {
        this.turnDisplay.setText(this.turn.toString());
        this.counterDisplay.setText("" + this.counter);
        if (this.keyboard.LEFT.isDown && this.allCardsGroup.x <= 0) {
            this.allCardsGroup.x += 10;
        }
        if (this.keyboard.RIGHT.isDown && this.allCardsGroup.x >= -3500) {
            this.allCardsGroup.x -= 10;
        }
        if (this.keyboard.UP.isDown && this.counter < this.allCardsGroup.count('visible', true)) {
            this.counter++;
        }
        if (this.keyboard.DOWN.isDown && this.counter > 0) {
            this.counter--;
        }
        if (this.keyboard.T.isDown) {
            this.turn = true;
        }
        if (this.keyboard.SPACE.isDown && this.turn) {
            this.hideDisplayCardEvent = this.time.addEvent({ delay: 3000, callback: this.hideDisplayCard, callbackScope: this });
            this.turn = false;
            this.displayingCard = true;
            this.landedCard(this.counter);
        }
    }
    
    // sets up the card orderings and returns an array of cards
    setupCards() {
        let cardList = [];
        for (let i = 1; i <= cardCount; i++) {
            let card = {age:"", type:"", special:"", landed: false, xpos: 0, ypos: 0, anglepos: 0};
            if (i <= 33) {
                card.age = "Child";
            } else if (i <= 66) {
                card.age = "Adult"
            } else {
                card.age = "OldAge"
            }
            if (i % 3 === 1) {
                card.type = "Event";
            } else if (i % 3 === 2) {
                card.type = "Lucky"
            } else { // i % 3 === 0
                card.type = "Misfortune"
            }
            if (i % 12 < 5) {
                card.xpos = 150 + 600 * Math.round(i / 12);
                card.ypos = 750 - 150 * (i % 6);
            } else if (i % 12 === 5) {
                card.xpos = 300 + 600 * Math.round(i / 12);
                card.ypos = 100;
                card.anglepos = 90;
            } else if (i % 12 < 11) {
                card.xpos = 600 * Math.round(i / 12) - 150;
                card.ypos = 150 + 150 * (i % 6);
                card.anglepos = 180;
            } else { // i % 12 === 11
                card.xpos = 600 * Math.round(i / 12);
                card.ypos = 800;
                card.anglepos = 90;
            }
            cardList.push(card);
        }
        return cardList;
    }

    // sets up the cards on the board
    setupBoard(cardList) {
        this.startCard = this.add.sprite(150, 750, 'cardStart');
        this.startCard.setScale(0.175);
        this.startCard.setOrigin(0.5);
        let cards = [this.startCard];
        for (let i = 1; i <= cardCount; i++) {
            this.card = this.add.sprite(cardList[i - 1].xpos, cardList[i - 1].ypos, 'card' + cardList[i - 1].age + cardList[i - 1].type);
            this.card.setAngle(cardList[i - 1].anglepos);
            this.card.setScale(0.175);
            this.card.setOrigin(0.5);
            cards.push(this.card);
        }
        this.goalCard = this.add.sprite(4950, 150, 'cardGoal');
        this.goalCard.setScale(0.175);
        this.goalCard.setOrigin(0.5);
        cards.push(this.goalCard);
        return cards;
    }

    // animations done to the card the player landed on
    landedCard(index) {
        let card = this.allCardsGroup.getAt(index);
        card.setX(800);
        card.setY(450);
        card.setScale(1);
        this.allCardsGroup.bringToTop(card);
    }

    hideDisplayCard() {
        this.allCardsGroup.last.destroy();
        this.displayingCard = false;
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