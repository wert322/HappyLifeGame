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
        this.cardList = this.setupCards();
        this.cards = this.setupBoard();
        this.allCardsContainer = this.add.container(0, 0, this.cards);

        // Keyboard inputs
        this.keyboard = this.input.keyboard.addKeys("LEFT,RIGHT,UP,DOWN,SPACE,T,Y");

        // Game variables
        this.landedCardIndex = 0; // what card was landed on based on container index
        this.boardOffset = 0;
        this.turn = 0; // whose turn it is (based off user ID)
        this.displayingCard = false; // currently displaying a card on the screen or not

        // Game side display
        this.sideInfo = this.add.rectangle(1400, 450, 400, 900, "0xFFFFFF");

        // Game text display
        this.turnDisplay = this.add.text(100, 10, "false", {font: "60px arial"}); // temporary
        this.userPieceCardLocationDisplay = this.add.text(10, 10, "0", {font: "60px arial"}); // temporary
        this.yourTurnText = this.add.text(config.scale.width/2, 900, "Your turn! Press SPACE to roll the die.", {font: "40px arial"}).setOrigin(0.5,1);
        this.dieRollResult = this.add.text(config.scale.width/2, 900, "", {font: "40px arial"}).setOrigin(0.5,1);

        // Add user piece to board in a player container
        this.allPlayersContainer = this.add.container(0, 0);
        this.allPlayerInfoText = this.add.container(0, 0);
        for (let i = 0; i < players.length; i++) {
            let playerPiece = this.add.rectangle(0, 0, 50, 50, players[i].playerColor);

            let playerInfoText = this.add.text(1250, 10 + 50 * i, players[i].name, {font: "30px arial", color: "0xFFF"}).setOrigin(0);
            this.add.rectangle(1210, 10 + 50 * i, 30, 30, players[i].playerColor).setOrigin(0);
            this.allPlayersContainer.add(playerPiece);
            this.allPlayerInfoText.add(playerInfoText);
        }
    }

    update() {
        // update all player locations
        for (let i = 0; i < players.length; i++) {
            let player = this.allPlayersContainer.getAt(i);
            player.setPosition(this.cardList[players[i].location].xpos + this.boardOffset, this.cardList[players[i].location].ypos);
        }

        // if it is your turn, show the text saying to roll a die
        this.yourTurnText.visible = (userID === this.turn);

        // temp setting to show who's turn it is and what card you're currently on
        this.turnDisplay.setText(this.turn);
        this.userPieceCardLocationDisplay.setText("" + players[userID].location);

        // left and right movement scrolling
        if (this.keyboard.LEFT.isDown && this.allCardsContainer.x <= 0) {
            this.boardOffset += 10;
            this.allCardsContainer.x += 10;
        }
        if (this.keyboard.RIGHT.isDown && this.allCardsContainer.x >= -3900) {
            this.boardOffset -= 10;
            this.allCardsContainer.x -= 10;
        }

        // temporary setting to your turn by pressing T, DELETE AFTER
        if (this.keyboard.T.isDown) {
            this.turn = userID;
        }

        // Press space on your turn to roll die and move forward
        if (this.keyboard.SPACE.isDown && (this.turn === userID)) {
            this.turn += 1;
            var dieValue = this.rollDie();
            if (players[userID].location + dieValue >= 100) { // ADD END OF GAME EMIT HERE
                players[userID].location = 100;
            } else {
                players[userID].location += dieValue;
            }
            this.landedCardIndex = this.getLandedCardIndex(players[userID].location);
            this.cards[players[userID].location].landed = true;
            //this.moveUserPiece(this.userPiece, dieValue, players[userID].location);
            this.displayLandedCard(this.landedCardIndex);
            this.hideDisplayCardEvent = this.time.addEvent({ delay: 3000, callback: this.hideDisplayCard, callbackScope: this });
        }
    }
    
    // sets up the card orderings and returns an array of cards
    setupCards() {
        let cardList = [{age:"Child", type:"Start", landed: true, xpos: 150, ypos: 750, anglepos: 0}];
        for (let i = 1; i <= cardCount; i++) {
            let card = {age:"", type:"", landed: false, xpos: 0, ypos: 0, anglepos: 0};
            if (i <= 33) {
                card.age = "Child";
            } else if (i <= 66) {
                card.age = "Adult";
            } else {
                card.age = "OldAge";
            }
            if (i % 3 === 1) {
                card.type = "Event";
            } else if (i % 3 === 2) {
                card.type = "Lucky";
            } else { // i % 3 === 0
                card.type = "Misfortune";
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
        cardList.push({age:"OldAge", type:"Goal", landed: true, xpos: 4950, ypos: 150, anglepos: 0});
        return cardList;
    }

    // sets up the cards on the board
    setupBoard() {
        this.startCard = this.add.sprite(150, 750, 'cardStart');
        this.startCard.setScale(0.175);
        this.startCard.setOrigin(0.5);
        let allCards = [this.startCard];
        for (let i = 1; i <= cardCount; i++) {
            this.card = this.add.sprite(this.cardList[i].xpos, this.cardList[i].ypos, 'card' + this.cardList[i].age + this.cardList[i].type);
            this.card.setAngle(this.cardList[i].anglepos);
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

    // displays the card at inputted index
    displayLandedCard(index) {
        let card = this.allCardsContainer.getAt(index);
        card.setX(800 + this.boardOffset);
        card.setY(450);
        card.setScale(1);
        card.setAngle(0);
        this.allCardsContainer.bringToTop(card);
        this.displayingCard = true;
    }

    // hides the card the player landed on
    hideDisplayCard() {
        this.allCardsContainer.last.destroy();
        this.displayingCard = false;
    }

    // returns the container index of the landed card
    getLandedCardIndex(cardLocation) {
        let counter = 1;
        for (let i = 1; i < cardLocation; i++) {
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