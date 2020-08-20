class scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    preload() {
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
        var cardList = this.setupCards();
        this.setupBoard(cardList);
    }

    update() {
    }
    
    // sets up the card orderings and returns an array of cards
    setupCards() {
        let cardList = [];
        for (let i = 0; i < cardCount; i++) {
            let card = {age:"", type:"", special:""};
            if (i < 33) {   
                card.age = "Child";
            } else if (i < 66) {
                card.age = "Adult"
            } else {
                card.age = "OldAge"
            }
            if (i % 3 === 0) {
                card.type = "Event";
            } else if (i % 3 === 1) {
                card.type = "Lucky"
            } else {
                card.type = "Misfortune"
            }
            cardList.push(card);
        }
        return cardList;
    }

    // sets up the cards on the board 0:(150,750) 1:(150,600) 2:(150,450) 3:(150,300) 4:(150,150)
    setupBoard(cardList) {
        let allCards = this.add.group();
        this.startCard = this.add.sprite(150, 750, 'cardStart');
        this.startCard.setScale(0.175);
        for (let i = 1; i <= cardCount; i++) {
            let cardVersion = 'card' + cardList[i - 1].age + cardList[i - 1].type;
            if (i % 12 < 5) {
                this.card = this.add.sprite(150 + 600 * Math.round(i / 12), 750 - 150 * (i % 6), cardVersion);
                this.card.setScale(0.175);
            } else if (i % 12 === 5) {
                this.card = this.add.sprite(300 + 600 * Math.round(i / 12), 100, cardVersion);
                this.card.setScale(0.175);
                this.card.setAngle(90);
            } else if (i % 12 < 11) {
                this.card = this.add.sprite(600 * Math.round(i / 12) - 150, 150 + 150 * (i % 6), cardVersion);
                this.card.setScale(0.175);
                this.card.setAngle(180);
            } else {// i % 12 === 11
                this.card = this.add.sprite(600 * Math.round(i / 12), 800, cardVersion);
                this.card.setScale(0.175);
                this.card.setAngle(90);
            }
        }
        this.startGoal = this.add.sprite(4950, 150, 'cardGoal');
        this.startGoal.setScale(0.175);
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