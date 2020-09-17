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
        // debug tools
        this.debugText = this.add.text(0, 0, "", {font: "20px Roboto"}).setOrigin(0);
        this.debugText.visible = debugMode;

        // Set up cards
        this.cardList = this.setupCards();
        let cards = this.setupBoard();
        this.allCardsContainer = this.add.container(0, 0, cards);

        // Keyboard inputs
        this.keyboard = this.input.keyboard.addKeys("LEFT,RIGHT");

        // Game variables
        this.boardOffset = 0;
        this.turn = 0; // whose turn it is (based off user ID)
        this.displayingCard = false; // currently displaying a card on the screen or not

        // Add user piece to board in a player container
        this.allPlayersContainer = this.add.container(0, 0);
        for (let i = 0; i < players.length; i++) {
            let playerPiece = this.add.rectangle(this.cardList[0].xpos, this.cardList[0].ypos, 50, 50, players[i].playerColor);
            this.allPlayersContainer.add(playerPiece);
        }

        // Game side display
        this.sideInfo = this.add.rectangle(canvasWidth * 0.875, 0, canvasWidth / 4, 900, "0xFFFFFF").setOrigin(0.5, 0);
        this.allPlayerInfoText = this.add.container(0, 0);
        for (let i = 0; i < players.length; i++) {
            let playerInfoText = this.add.text(canvasWidth * 0.75 + 50, 10 + 50 * i, players[i].name, {font: "30px Roboto", color: "0x000000"}).setOrigin(0);
            this.add.rectangle(canvasWidth * 0.75 + 10, 10 + 50 * i, 30, 30, players[i].playerColor).setOrigin(0);
            this.allPlayerInfoText.add(playerInfoText);
        }

        // Text box. Note that 4 lines is the max currently
        this.textBoxArea = this.add.rectangle(0, 900, canvasWidth, canvasHeight - 900, "0xFF7AD9").setOrigin(0);
        this.textBox = this.add.text(canvasWidth / 2, 910, "", {font: "40px Roboto", wordWrap: {width: (canvasWidth * 0.8)}, useAdvancedWrap: true}).setOrigin(0.5,0);

        this.rollButton = this.add.rectangle(canvasWidth / 2, 970, canvasWidth / 3, 90, "0xFFBFEA").setOrigin(0.5, 0);
        this.rollButton.visible = false;
        this.rollButtonText = this.add.text(canvasWidth / 2, 980, "Roll", {font: "70px Roboto"}).setOrigin(0.5, 0);
        this.rollButtonText.visible = false;
        this.rollButton.on('pointerdown', this.rollButtonPressed, this)

        // If first player, show the your turn text
        if (userID === 0) {
            this.textBox.setText("Your turn! Press the button to roll the die.");
            this.rollButton.visible = true;
            this.rollButtonText.visible = true;
            this.rollButton.setInteractive();
        }

        // Landed card variables
        // cardText  : the text displayed on the card
        // cardIcon  : the icon displayed on the card, currently not working
        // blankCard : the blank card used on card flip
        this.cardText = this.add.text(0, 450, "", {font: "50px Roboto", fill: '#000000', wordWrap: {width: 575}}).setOrigin(0.5);
        this.cardText.depth = 2;
        // this.cardIcon = this.add.text(720, 450, "", {font: "500px fontAwesome", fill: '#000000'}).setOrigin(0.5);
        // this.cardIcon.depth = 1;
        this.blankCard = this.add.sprite(0, 450, 'cardBlank').setOrigin(0.5);
        this.blankCard.on('pointerdown', this.blankCardPressed, this);
        this.blankCard.visible = false;

        // Get roll info from other players in the room
        socket.on('updateOtherGameUsers', ({ playerID, dieValue }) => {
            if (this.displayingCard) {
                this.blankCard.sprite.enable;
                this.cardIcon.setText("");
                this.displayLandedCard = false;
            }
            rollInfo.playerID = playerID;
            rollInfo.roll = dieValue;
            rollInfo.type = "regular";
            if (playerID === userID) {
                this.textBox.setText("You rolled a " + dieValue + "!");
            } else {
                this.textBox.setText(players[playerID].name + " rolled a " + dieValue + "!");
            }
        });

        // If the landed card was a regular card, run this
        socket.on('showRegularCard', ({cardDescription, iconCode}) => {
            // iconCode = '\uf368 '; // temp testing
            this.simulateTurn(rollInfo.playerID, rollInfo.roll, cardDescription, iconCode);
            this.turn = (rollInfo.playerID + 1) % players.length;
        });

        // If the landed card was a two choice event, run this
        socket.on('twoChoiceEvent', ({text1, choice1, text2, choice2}) => {
            rollInfo.type = "twoChoice";
            this.twoChoice(text1, choice1, text2, choice2);
        });
    }

    update() {
        // Debugging variables
        this.debugText.setText("Turn: " + this.turn + "\nPlayer #: " + players.length);

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

        // Left and right movement scrolling
        if (this.keyboard.LEFT.isDown && this.allCardsContainer.x <= 0) {
            this.boardOffset += 10;
            this.allCardsContainer.x += 10;
            for (let i = 0; i < players.length; i++) {
                this.allPlayersContainer.getAt(i).x += 10;
            }
        }
        if (this.keyboard.RIGHT.isDown && this.allCardsContainer.x >= -3700) {
            this.boardOffset -= 10;
            this.allCardsContainer.x -= 10;
            for (let i = 0; i < players.length; i++) {
                this.allPlayersContainer.getAt(i).x -= 10;
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
                card.age = "Old";
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
    simulateTurn(playerID, dieValue, cardDescription, iconCode) {
        var newPlayerLocation = this.getLandedCardLocation(players[playerID].location, dieValue);
        this.cardList[newPlayerLocation].landed = true;
        var landedCardIndex = this.getLandedCardIndex(newPlayerLocation);
        var playerPiece = this.allPlayersContainer.getAt(playerID);
        this.moveByOne("", "", this, playerPiece, playerID, newPlayerLocation, landedCardIndex, cardDescription, iconCode);
    }

    // moves the player up by one card
    moveByOne(tween, targets, self, playerPiece, playerID, newPlayerLocation, landedCardIndex, cardDescription, iconCode) {
        if (players[playerID].location === newPlayerLocation) {
            self.displayLandedCard(self, landedCardIndex, cardDescription, iconCode);
        } else {
            players[playerID].location++;
            self.tweens.add({
                targets: playerPiece,
                props: {
                    x: self.cardList[players[playerID].location].xpos + self.boardOffset,
                    y: self.cardList[players[playerID].location].ypos
                },
                duration: moveForwardOneCardTime,
                onComplete: self.moveByOne,
                onCompleteParams: [self, playerPiece, playerID, newPlayerLocation, landedCardIndex, cardDescription, iconCode]
            });
        }
    }

    // displays the card at inputted index
    displayLandedCard(self, index, cardDescription, iconCode) {
        let card = self.allCardsContainer.getAt(index);
        self.allCardsContainer.bringToTop(card);
        self.animateLandedCard(self, card, cardDescription, iconCode);
    }

    // animation to move card to center of screen
    animateLandedCard(self, card, cardDescription, iconCode) {
        card.depth = 1;
        self.tweens.add({
            targets: card,
            props: {
                x: 600 - self.boardOffset,
                y: 450,
                rotation: 0,
                scaleX: 1,
                scaleY: 1
            },
            duration: cardMoveToCenterTime,
            onComplete: self.flipLandedCard,
            onCompleteParams: [self, card, cardDescription, iconCode]
        });
    }

    flipLandedCard(tween, targets, self, card, cardDescription, iconCode) {
        self.tweens.add({
            targets: card,
            props: {
                scaleX: 0
            },
            delay: 250,
            duration: cardFlipTime / 2,
            onComplete: self.flipLandedCard2,
            onCompleteParams: [self, card, cardDescription, iconCode]
        });
    }

    flipLandedCard2(tween, targets, self, card, cardDescription, iconCode) {
        card.destroy();
        // card text
        self.cardText.x = 600 - self.boardOffset
        self.cardText.setText(cardDescription);
        self.cardText.scaleX = 0;
        self.tweens.add({
            targets: self.cardText,
            props: {
                scaleX: 1
            },
            duration: cardFlipTime / 2,
        });
        // card icon
        // self.cardIcon.setText(iconCode);
        // self.cardIcon.depth = 2;
        // self.cardIcon.scaleX = 0;
        // self.tweens.add({
        //     targets: self.cardIcon,
        //     props: {
        //         scaleX: 1
        //     },
        //     duration: cardFlipTime / 2,
        // });
        // blank card
        self.blankCard.scaleX = 0;
        self.blankCard.visible = true;
        self.blankCard.x = 600 - self.boardOffset;
        self.tweens.add({
            targets: self.blankCard,
            props: {
                scaleX: 1
            },
            duration: cardFlipTime / 2,
            onComplete: self.cardAnimationEnd,
            onCompleteParams: [self, cardDescription]
        });
    }

    cardAnimationEnd(tween, targets, self, cardDescription) {
        self.displayingCard = true;
        if (rollInfo.type === "regular") {
            self.blankCard.setInteractive();
        }
    }

    // returns the container index of the landed card in reference to the remaining cards
    getLandedCardIndex(cardLocation) {
        let counter = 1;
        for (let i = 1; i < cardLocation; i++) {
            if (!this.cardList[i].landed) {
                counter++;
            }
        }
        return counter;
    }

    // returns the location of the landed card in reference to all the cards
    getLandedCardLocation(location, dieRoll) {
        while (dieRoll > 0) {
            if (!this.cardList[location + 1].landed) {
                dieRoll--;
            }
            location++;
        }
        return location;
    }

    // rolls a die and returns the value (1 to 6)
    rollDie() {
        return Math.floor(Math.random() * 6 + 1);
    }

    // blank card interactive code (on click, runs this)
    blankCardPressed() {
        this.cardText.setText("");
        // self.cardIcon.setText("");
        this.blankCard.disableInteractive();
        this.blankCard.visible = false;
        if (userID === this.turn) {
            this.textBox.setText("Your turn! Press the button to roll the die.");
            this.rollButton.visible = true;
            this.rollButtonText.visible = true;
            this.rollButton.setInteractive();
        } else {
            this.textBox.setText("Waiting for " + players[this.turn].name + " to roll.");
        }
        this.displayingCard = false;
    }

    rollButtonPressed() {
        this.rollButtonText.visible = false;
        this.rollButton.visible = false;
        this.rollButton.disableInteractive();
        this.cardText.setText("");
        var dieValue = this.rollDie();
        if (players[userID].location + dieValue >= 100) {
            players[userID].location = 100;
            socket.emit('gameEnd', (true));
            this.scene.scene.start("endGame");
        } else { // game has not ended yet, so run a turn
            let location = this.getLandedCardLocation(players[userID].location, dieValue);
            let playerID = userID;
            let cardType = this.cardList[location].type;
            let cardAge = this.cardList[location].age;
            socket.emit('gameTurn', ({playerID, dieValue, cardType, cardAge}));
        }
    }

    twoChoice(text1, option1, text2, option2) {
        if (!this.displayingCard) {
            window.setTimeout(this.twoChoice, 1000, text1, option1, text2, option2);
        } else {
            this.textBox.setText("Two option card pulled (temp text)");

        }
    }
}