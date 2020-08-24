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
        this.cards = this.setupBoard(cardList);
        this.allCardsGroup = this.add.container(0, 0, this.cards);

        // Keyboard inputs
        this.keyboard = this.input.keyboard.addKeys("LEFT,RIGHT,UP,DOWN,SPACE,T,Y");

        // Game variables
        this.landedCardNumber = 0; // what card was landed on based on original fixed position
        this.landedCardIndex = 0; // what card was landed on based on container index
        this.turn = false; // whose turn it is
        this.displayingCard = false; // currently displaying a card on the screen or not

        // Game text display
        this.turnDisplay = this.add.text(100, 10, "false", {font: "60px arial"});
        this.landedCardNumberDisplay = this.add.text(10, 10, "0", {font: "60px arial"});
        this.yourTurnText = this.add.text(config.scale.width/2, 900, "Your turn! Press SPACE to roll the die.", {font: "40px arial"}).setOrigin(0.5,1);
        this.dieRollResult = this.add.text(config.scale.width/2, 900, "", {font: "40px arial"}).setOrigin(0.5,1);
    }

    update() {
        this.yourTurnText.visible = this.turn;
        this.turnDisplay.setText(this.turn.toString());
        this.landedCardNumberDisplay.setText("" + this.landedCardNumber);
        if (this.keyboard.LEFT.isDown && this.allCardsGroup.x <= 0) {
            this.allCardsGroup.x += 10;
        }
        if (this.keyboard.RIGHT.isDown && this.allCardsGroup.x >= -3500) {
            this.allCardsGroup.x -= 10;
        }
        if (this.keyboard.UP.isDown && this.landedCardNumber < cardCount + 2 && !this.turn) {
            this.landedCardNumber++;
        }
        if (this.keyboard.DOWN.isDown && this.landedCardNumber > 0 && !this.turn) {
            this.landedCardNumber--;
        }
        if (this.keyboard.T.isDown) {
            this.turn = true;
        }
        if (this.keyboard.SPACE.isDown && this.turn) {
            this.turn = false;
            var dieValue = this.rollDie();
            this.landedCardNumber += dieValue;
            this.landedCardIndex = this.getLandedCardIndex();
            this.cards[this.landedCardNumber].landed = true;
            this.displayLandedCard();
            this.hideDisplayCardEvent = this.time.addEvent({ delay: 3000, callback: this.hideDisplayCard, callbackScope: this });
        }
    }
    
    // sets up the card orderings and returns an array of cards
    setupCards() {
        let cardList = [];
        for (let i = 1; i <= cardCount; i++) {
            let card = {age:"", type:"", landed: false, xpos: 0, ypos: 0, anglepos: 0};
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
        let allCards = [this.startCard];
        for (let i = 1; i <= cardCount; i++) {
            this.card = this.add.sprite(cardList[i - 1].xpos, cardList[i - 1].ypos, 'card' + cardList[i - 1].age + cardList[i - 1].type);
            this.card.setAngle(cardList[i - 1].anglepos);
            this.card.setScale(0.175);
            this.card.setOrigin(0.5);
            allCards.push(this.card);
        }
        this.goalCard = this.add.sprite(4950, 150, 'cardGoal');
        this.goalCard.setScale(0.175);
        this.goalCard.setOrigin(0.5);
        allCards.push(this.goalCard);
        return allCards;
    }

    // displays the card the player landed on
    displayLandedCard() {
        let card = this.allCardsGroup.getAt(this.landedCardIndex);
        card.setX(800);
        card.setY(450);
        card.setScale(1);
        card.setAngle(0);
        this.allCardsGroup.bringToTop(card);
        this.displayingCard = true;
    }

    // hides the card the player landed on
    hideDisplayCard() {
        this.allCardsGroup.last.destroy();
        this.displayingCard = false;
    }

    // returns the container index of the landed card
    getLandedCardIndex() {
        let counter = 1;
        for (let i = 1; i < this.landedCardNumber; i++) {
            if (!this.cards[i].landed) {
                counter++;
            }
        }
        return counter;
    }

    // rolls a die and returns the value (1 to 6)
    rollDie() {
        let result = Math.floor(Math.random() * 6 + 1);
        this.dieRollResult.setText("Your rolled a " + result);
        this.dieRollResult.visible = true;
        this.time.addEvent({ delay: 1000, callback: this.hideDieRollResult, callbackScope: this });
        return result;
    }

    // hides the die roll result text
    hideDieRollResult() {
        this.dieRollResult.visible = false;
    }
}