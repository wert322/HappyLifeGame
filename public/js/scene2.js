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

        // Text box
        this.textBoxArea = this.add.rectangle(0, 900, canvasWidth, canvasHeight - 900, "0xFF7AD9").setOrigin(0);
        this.textBox = this.add.text(canvasWidth / 2, 910, "", {font: "40px Roboto", wordWrap: {width: (canvasWidth * 0.8)}, useAdvancedWrap: true}).setOrigin(0.5,0);

        // If first player, show the your turn text
        if (userID === 0) {
            this.textBox.setText("Your turn! Press SPACE to roll the die.");
        }

        // Card icon display
        this.cardIcon = this.add.text(720, 450, "", {font: "500px fontAwesome", fill: '#000000'}).setOrigin(0.5);
        this.cardIcon.depth = 1;

        // Get roll info from other players in the room
        socket.on('updateOtherGameUsers', ({ playerID, dieValue }) => {
            if (this.displayingCard) {
                this.blankCard.destroy();
                this.cardIcon.setText("");
                this.displayLandedCard = false;
            }
            rollInfo.playerID = playerID;
            rollInfo.roll = dieValue;
            if (playerID === userID) {
                this.textBox.setText("You rolled a " + dieValue + "!");
            } else {
                this.textBox.setText(players[playerID].name + " rolled a " + dieValue + "!");
            }
        });

        // 
        socket.on('showRegularCard', ({cardDescription, iconCode}) => {
            console.log(iconCode); // ERROR: currently prints out undefined
            // iconCode = '\uf368 '; // temp testing
            this.simulateTurn(rollInfo.playerID, rollInfo.roll, cardDescription, iconCode);
            if (userID != rollInfo.playerID) {
                this.turn = (rollInfo.playerID + 1) % players.length;
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

        // Left and right movement scrolling
        if (this.keyboard.LEFT.isDown && this.allCardsContainer.x <= 0) {
            this.boardOffset += 10;
            this.allCardsContainer.x += 10;
        }
        if (this.keyboard.RIGHT.isDown && this.allCardsContainer.x >= -3700) {
            this.boardOffset -= 10;
            this.allCardsContainer.x -= 10;
        }

        // Press space on your turn to roll die and move forward
        if (this.keyboard.SPACE.isDown && (this.turn === userID) && !this.displayingCard) {
            this.turn = (userID + 1) % players.length;
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
    simulateTurn(playerID, dieValue, cardDescription, iconCode) {
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
        this.displayLandedCard(landedCardIndex, cardDescription, iconCode);
    }

    // displays the card at inputted index
    displayLandedCard(index, cardDescription, iconCode) {
        let card = this.allCardsContainer.getAt(index);
        this.allCardsContainer.bringToTop(card);
        this.animateLandedCard(card, cardDescription, iconCode);
    }

    // animation to move card to center of screen
    animateLandedCard(card, cardDescription, iconCode) {
        card.depth = 1;
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
            onCompleteParams: [self, cardDescription, iconCode]
        });
    }

    flipLandedCard2(tween, targets, self, cardDescription, iconCode) {
        self.displayingCard = true;
        self.allCardsContainer.last.destroy();
        self.blankCard = self.add.sprite(600 - self.boardOffset, 450, 'cardBlank').setOrigin(0.5);
        self.cardIcon.setText(iconCode);
        self.cardIcon.depth = 2;
        self.cardIcon.scaleX = 0;
        self.blankCard.scaleX = 0;
        self.tweens.add({
            targets: self.cardIcon,
            props: {
                scaleX: 1
            },
            duration: cardFlipTime / 2,
        });
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
        self.textBox.setText(cardDescription);
        self.blankCard.setInteractive();
        self.blankCard.on('pointerdown', function() {
            self.cardIcon.setText("");
            self.blankCard.destroy();
            if (userID === this.turn) {
                this.textBox.setText("Your turn! Press SPACE to roll the die.");
            } else {
                self.textBox.setText("");
            }
            self.displayingCard = false;
        });
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
        return Math.floor(Math.random() * 6 + 1);
    }
}