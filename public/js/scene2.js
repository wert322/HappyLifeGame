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
        this.add.sprite(150, 100, 'cardChildEvent');
    }
    
}