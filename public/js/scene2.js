class scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    preload() {
        // draw all the cards used
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
        this.debugText = this.add.text(0, 0, "", {fontSize: "20px", fontFamily: "Roboto"}).setOrigin(0);
        this.debugText.visible = debugMode;

        // set up cards
        this.cardList = this.setupCards();
        let cards = this.setupBoard();
        this.allCardsContainer = this.add.container(0, 0, cards);

        // keyboard inputs
        this.keyboard = this.input.keyboard.addKeys("LEFT,RIGHT");

        // game variables
        this.boardOffset = 0;
        this.turn = 0; // whose turn it is (based off user ID)
        this.displayingCard = false; // currently displaying a card on the screen or not

        // add user piece to board in a player container
        this.allPlayersContainer = this.add.container(0, 0);
        for (let i = 0; i < players.length; i++) {
            let playerPiece = this.add.rectangle(this.cardList[0].xpos, this.cardList[0].ypos, 50, 50, players[i].playerColor);
            this.allPlayersContainer.add(playerPiece);
        }

        // game side display
        this.sideInfo = this.add.rectangle(canvasWidth * 0.875, 0, canvasWidth / 4, 900, "0xFFE3F6").setOrigin(0.5, 0);
        this.allPlayerInfoText = this.add.container(0, 0);
        for (let i = 0; i < players.length; i++) {
            let playerInfoText = this.add.text(canvasWidth * 0.75 + 10, 10 + 150 * i, this.formatPlayerText(i), {fontSize: "30px", fontFamily: "Roboto", color: "0x000000"}).setOrigin(0);
            this.add.rectangle(canvasWidth * 0.75 + 10, 10 + 150 * i, 30, 30, players[i].playerColor).setOrigin(0);
            this.allPlayerInfoText.add(playerInfoText);
        }

        // text box (note that 4 lines is the max currently)
        this.textBoxArea = this.add.rectangle(0, 900, canvasWidth, canvasHeight - 900, "0xFF7AD9").setOrigin(0);
        this.textBox = this.add.text(canvasWidth / 2, 910, "", {fontSize: "40px", fontFamily: "Roboto", wordWrap: {width: (canvasWidth * 0.8)}, useAdvancedWrap: true}).setOrigin(0.5,0);

        // roll Button
        this.rollButton = this.add.rectangle(canvasWidth / 2, 970, canvasWidth / 3, 90, "0xFFBFEA").setOrigin(0.5, 0);
        this.rollButton.visible = false;
        this.rollButtonText = this.add.text(canvasWidth / 2, 980, "Roll", {fontSize: "70px", fontFamily: "Roboto"}).setOrigin(0.5, 0);
        this.rollButtonText.visible = false;
        this.rollButton.on('pointerdown', this.rollButtonPressed, this);

        // if first player, show the your turn text
        if (userID === 0) {
            this.textBox.setText("Your turn! Press the button to roll the die.");
            this.rollButton.visible = true;
            this.rollButtonText.visible = true;
            this.rollButton.setInteractive();
        }

        // landed card variables
        // cardText  : the text displayed on the card
        // cardIcon  : the icon displayed on the card, currently not working
        // blankCard : the blank card used on card flip
        this.cardText = this.add.text(0, 450, "", {fontSize: "50px", fontFamily: "Roboto", fill: '#000000', wordWrap: {width: 575}}).setOrigin(0.5);
        this.cardText.depth = 2;
        // this.cardIcon = this.add.text(720, 450, "", {fontSize: "500px", fontFamily: "fontAwesome", fill: '#000000'}).setOrigin(0.5);
        // this.cardIcon.depth = 1;
        this.blankCard = this.add.sprite(0, 450, 'cardBlank').setOrigin(0.5);
        this.blankCard.on('pointerdown', this.setupNextTurn, this);
        this.blankCard.visible = false;

        // two choice option variables
        this.option1Button = this.add.rectangle(20, 920, 930, 140, "0xFF9FE0").setOrigin(0);
        this.option1ButtonText = this.add.text(485, 930, "", {fontSize: "40px", fontFamily: "Roboto", wordWrap: {width: 910}, useAdvancedWrap: true}).setOrigin(0.5, 0);
        this.option2Button = this.add.rectangle(970, 920, 930, 140, "0xFF9FE0").setOrigin(0);
        this.option2ButtonText = this.add.text(1435, 930, "", {fontSize: "40px", fontFamily: "Roboto", wordWrap: {width: 910}, useAdvancedWrap: true}).setOrigin(0.5, 0);
        this.option1Button.visible = false;
        this.option1ButtonText.visible = false;
        this.option2Button.visible = false;
        this.option2ButtonText.visible = false;
        this.option1Button.on('pointerdown', this.option1ButtonPressed, this);
        this.option2Button.on('pointerdown', this.option2ButtonPressed, this);

        // update all player balances
        socket.on('balanceUpdate', ({usernames, balances}) => {
            for (let i = 0; i < players.length; i++) {
                let user = players[i];
                user.balance = Number(balances[usernames.indexOf(user.name)]);
            }
        });

        // update all player children count
        socket.on('childrenUpdate', ({usernames, children}) => {
            for (let i = 0; i < players.length; i++) {
                let user = players[i];
                user.childrenCount = Number(children[usernames.indexOf(user.name)]);
            }
        });

        // update all player marital statuses
        socket.on('marriageUpdate', ({usernames, partners}) => {
            for (let i = 0; i < players.length; i++) {
                let user = players[i];
                if (partners[usernames.indexOf(user.name)] != null) {
                    user.married = partners[usernames.indexOf(user.name)];
                }
            }
        });

        // get roll info from other players in the room
        socket.on('updateOtherGameUsers', ({ playerID, dieValue }) => {
            if (this.displayingCard) {
                this.setupNextTurn();
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

        // if the landed card was a regular card, simulate the turn
        socket.on('showRegularCard', ({cardDescription, iconCode}) => {
            // iconCode = '\uf368 '; // temp testing
            this.simulateTurn(rollInfo.playerID, rollInfo.roll, cardDescription, iconCode);
        });

        // if the landed card was a two choice event, set rollInfo to two choice and get all required info stored
        socket.on('twoChoiceEvent', ({choicesArray}) => {
            rollInfo.type = "twoChoice";
            if (userID === this.turn) {
                rollInfo.optionIDs = [choicesArray[1], choicesArray[3]];
                this.option1ButtonText.setText(choicesArray[0]);
                this.option2ButtonText.setText(choicesArray[2]);
            }
        });

        // for non-regular card outcome text, reformat the string for everyone and show in text box
        socket.on('showRegularOutcome', (resultText) => {
            var playerName = players[this.turn].name;
            var marriedName = players[this.turn].married;
            resultText = resultText.replace(/your/gi, playerName + "'s").replace(/you/gi, playerName);
            if (marriedName !== "") {
                resultText = resultText.replace(/partnername/g, marriedName);
            }
            this.textBox.setText(resultText);
            this.blankCard.setInteractive();
        });

        socket.on('endGame', (filler) => {
            this.scene.scene.start("endGame");
        });
    }

    update() {
        // debugging variables
        this.debugText.setText("Turn: " + this.turn + "\nRoll Type: " + rollInfo.type
            + "\nDisplaying card: " + this.displayingCard);

        // update sidebar info
        for (let i = 0; i < players.length; i++) {
            this.allPlayerInfoText.getAt(i).setText(this.formatPlayerText(i));
        }

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

    // flips the landed card to halfway
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

    // flips the landed card all the way, along with text
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

    // finishes up the card flip animation and sets up the user for an emit depending if it is a standard card or not
    cardAnimationEnd(tween, targets, self, cardDescription) {
        self.displayingCard = true;
        if (rollInfo.type === "regular") {
            self.blankCard.setInteractive();
        } else if (rollInfo.type === "twoChoice" && userID === self.turn) {
            self.twoChoice(self);
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

    // sets up the next turn (hides blank card, increments turn, displays roll text)
    setupNextTurn() {
        this.cardText.setText("");
        // self.cardIcon.setText("");
        this.blankCard.disableInteractive();
        this.blankCard.visible = false;
        this.displayingCard = false;
        this.turn = (rollInfo.playerID + 1) % players.length;
        if (userID === this.turn) {
            this.textBox.setText("Your turn! Press the button to roll the die.");
            this.rollButton.visible = true;
            this.rollButtonText.visible = true;
            this.rollButton.setInteractive();
        } else {
            this.textBox.setText("Waiting for " + players[this.turn].name + " to roll...");
        }
    }

    // format player text for side text info
    formatPlayerText(index) {
        let text = "     " + players[index].name + "\nBalance: ";
        let balance = "";
        if (players[index].balance >= 0) {
            balance = ("000000" + players[index].balance).slice(-6);
        } else {
            balance = "-" + ("000000" + players[index].balance * -1).slice(-5);
        }
        text += balance + " Million 円\nTraits: ";
        for (let i = 0; i < players[index].traits.length; i++) {
            text += players[index].traits[i];
            if (i < players[index].traits.length - 1) {
                text += ', ';
            }
        }
        if (players[index].married !== "") {
            text += "\nMarried to: " + players[index].married + "   Children: " + players[index].childrenCount;
        }
        return text;
    }

    // when roll button is pressed, hide it, get roll value, and send the info to everyone
    rollButtonPressed() {
        this.rollButtonText.visible = false;
        this.rollButton.visible = false;
        this.rollButton.disableInteractive();
        this.cardText.setText("");
        var dieValue = this.rollDie();
        if (players[userID].location + dieValue >= 100) {
            players[userID].location = 100;
            socket.emit('gameEnd', (true));
        } else { // game has not ended yet, so run a turn
            let location = this.getLandedCardLocation(players[userID].location, dieValue);
            let playerID = userID;
            let cardType = this.cardList[location].type;
            let cardAge = this.cardList[location].age;
            socket.emit('gameTurn', ({playerID, dieValue, cardType, cardAge}));
        }
    }

    // if two choice card was landed, set up the screen with the options
    twoChoice(self) {
        self.textBox.setText("");
        self.option1Button.visible = true;
        self.option1ButtonText.visible = true;
        self.option1Button.setInteractive();
        self.option2Button.visible = true;
        self.option2ButtonText.visible = true;
        self.option2Button.setInteractive();
    }

    // if option 1 was pressed send that to the server and fix the screen
    option1ButtonPressed() {
        this.hide2OptionButtons();
        socket.emit('twoChoiceResponse', {choiceID:rollInfo.optionIDs[0]});
    }

    // if option 2 was pressed send that to the server and fix the screen
    option2ButtonPressed() {
        this.hide2OptionButtons();
        socket.emit('twoChoiceResponse', {choiceID:rollInfo.optionIDs[1]});
    }

    // after two choice option is picked, clean up the screen by hiding two buttons
    hide2OptionButtons() {
        this.option1Button.visible = false;
        this.option1ButtonText.visible = false;
        this.option2Button.visible = false;
        this.option2ButtonText.visible = false;
        this.option1Button.disableInteractive();
        this.option2Button.disableInteractive();
    }
}