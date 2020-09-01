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
        this.load.image('cardBlank', 'images/blank_card.png');
    }
    
    create() {
        // Set up cards
        this.cardList = this.setupCards();
        let cards = this.setupBoard();
        this.allCardsContainer = this.add.container(0, 0, cards);

        // Keyboard inputs
        this.keyboard = this.input.keyboard.addKeys("LEFT,RIGHT,SPACE");

        // Game variables
        this.boardOffset = 0;
        this.turn = 0; // whose turn it is (based off user ID)
        this.displayingCard = false; // currently displaying a card on the screen or not

        // Add user piece to board in a player container
        this.allPlayersContainer = this.add.container(0, 0);
        for (let i = 0; i < players.length; i++) {
            let playerPiece = this.add.rectangle(0, 0, 50, 50, players[i].playerColor);
            this.allPlayersContainer.add(playerPiece);
        }

        // Game side display
        this.sideInfo = this.add.rectangle(1400, 450, 400, 900, "0xFFFFFF");
        this.allPlayerInfoText = this.add.container(0, 0);
        for (let i = 0; i < players.length; i++) {
            let playerInfoText = this.add.text(1250, 10 + 50 * i, players[i].name, {font: "30px arial", color: "0x000000"}).setOrigin(0);
            this.add.rectangle(1210, 10 + 50 * i, 30, 30, players[i].playerColor).setOrigin(0);
            this.allPlayerInfoText.add(playerInfoText);
        }

        // Game text display
        this.yourTurnText = this.add.text(config.scale.width/2, 900, "Your turn! Press SPACE to roll the die.", {font: "40px arial"}).setOrigin(0.5,1);
        this.dieRollResult = this.add.text(config.scale.width/2, 900, "", {font: "40px arial"}).setOrigin(0.5,1);

        // Get roll info from other players in the room
        socket.on('updateOtherGameUsers', ({ playerID, dieValue }) => {
            if (playerID != userID) {
                this.simulateTurn(playerID, dieValue);
            }
        });
    }

    update() {
        // Update all player locations
        for (let i = 0; i < players.length; i++) {
            this.allPlayersContainer.getAt(i).setPosition(this.cardList[players[i].location].xpos + this.boardOffset, this.cardList[players[i].location].ypos);
        }

        // Update all player balances
        socket.on('balanceUpdate', ({usernames, balances}) => {
            for (let i = 0; i < players.length; i++) {
                let user = players[i];
                user.balance = balances[usernames.indexOf(user.username)];
            }
        });

        // Update all player children count
        socket.on('childrenUpdate', ({usernames, children}) => {
            for (let i = 0; i < players.length; i++) {
                let user = players[i];
                user.childrenCount = children[usernames.indexOf(user.username)];
            }
        });

        // Update all player marital statuses
        socket.on('marriageUpdate', ({usernames, partners}) => {
            for (let i = 0; i < players.length; i++) {
                let user = players[i];
                if (partners[usernames.indexOf(user.username)] != null) {
                    user.married = partners[usernames.indexOf(user.username)];
                }
            }
        });

        // If it is your turn, show the text saying to roll a die
        this.yourTurnText.visible = (userID === this.turn);

        // Left and right movement scrolling
        if (this.keyboard.LEFT.isDown && this.allCardsContainer.x <= 0) {
            this.boardOffset += 10;
            this.allCardsContainer.x += 10;
        }
        if (this.keyboard.RIGHT.isDown && this.allCardsContainer.x >= -3900) {
            this.boardOffset -= 10;
            this.allCardsContainer.x -= 10;
        }

        // Press space on your turn to roll die and move forward
        if (this.keyboard.SPACE.isDown && (this.turn === userID)) {
            var dieValue = this.rollDie();
            if (players[userID].location + dieValue >= 100) {
                players[userID].location = 100;
                socket.emit('gameEnd', (true));
            } else { // game has not ended yet, so run a turn
                let index = this.getLandedCardIndex(players[userID].location + dieValue);
                let playerID = userID;
                let cardType = this.cardList[index].type;
                let cardAge = this.cardList[index].age;
                socket.emit('gameTurn', ({playerID, dieValue, cardType, cardAge}));
                this.simulateTurn(userID, dieValue);
            }
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

    // acts out a turn given inputted player and roll amount
    simulateTurn(playerID, dieValue) {
        let counter = dieValue;
        while (counter > 0) {
            if (!this.cardList[players[playerID].location + 1].landed) {
                counter--;
            }
            players[playerID].location++;
        }
        var newPlayerLocation = players[playerID].location;
        this.cardList[newPlayerLocation].landed = true;
        var landedCardIndex = this.getLandedCardIndex(newPlayerLocation);
        //this.moveUserPiece(playerID, dieValue, newPlayerLocation);
        this.displayLandedCard(landedCardIndex);
        this.turn = (playerID + 1) % players.length;
    }

    // displays the card at inputted index
    displayLandedCard(index) {
        let card = this.allCardsContainer.getAt(index);
        this.allCardsContainer.bringToTop(card);
        this.displayingCard = true;
        this.animateLandedCard(card);
        // card.setX(800 - this.boardOffset);
        // card.setY(450);
        // card.setScale(1);
        // card.setAngle(0);
        //this.hideDisplayCardEvent = this.time.addEvent({ delay: 3000, callback: this.hideDisplayCard, callbackScope: this });
    }

    // animation to move card to center of screen
    animateLandedCard(card) {
        var self = this;
        this.tweens.add({
            targets: card,
            props: {
                x: 600 - this.boardOffset,
                y: 450,
                rotation: 0,
                scaleX: 1,
                scaleY: 1
            },
            duration: cardMoveToCenterTime,
            yoyo: false,
            repeat: 0,
            onComplete: this.flipLandedCard,
            onCompleteParams: [self, card]
        });
    }

    flipLandedCard(tween, targets, self, card) {
        self.tweens.add({
            targets: card,
            props: {
                scaleX: 0
            },
            delay: 250,
            duration: cardFlipTime / 2,
            yoyo: false,
            repeat: 0,
            onComplete: self.flipLandedCard2,
            onCompleteParams: [self]
        });
    }

    flipLandedCard2(tween, targets, self) {
        self.allCardsContainer.last.destroy();
        self.goalCard = self.add.sprite(600 - self.boardOffset, 450, 'cardBlank').setOrigin(0.5);
        self.goalCard.scaleX = 0;
        self.tweens.add({
            targets: self.goalCard,
            props: {
                scaleX: 1
            },
            duration: cardFlipTime / 2,
            yoyo: false,
            repeat: 0,
            onComplete: self.cardAnimationEnd,
            onCompleteParams: self
        });
    }

    cardAnimationEnd(tween, targets, self) {
        self.goalCard.setInteractive();
        self.goalCard.on('pointerdown', function() {
            self.goalCard.destroy();
            self.displayingCard = false;
        });
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
            if (!this.cardList[i].landed) {
                counter++;
            }
        }
        return counter;
    }

    // rolls a die and returns the value (1 to 6)
    rollDie() {
        let result = Math.floor(Math.random() * 6 + 1);
        this.dieRollResult.setText("You rolled a " + result);
        this.dieRollResult.visible = true;
        this.time.addEvent({ delay: 1000, callback: this.hideDieRollResult, callbackScope: this });
        return result;
    }

    // hides the die roll result text
    hideDieRollResult() {
        this.dieRollResult.visible = false;
    }
}