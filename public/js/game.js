/* rolls a die and returns the value (1 to 6) */
function rollDie() {
    return Math.floor(Math.random() * 6 + 1);
}

// rolls two die and returns the sum, value(1 to 12)
function rollTwoDie() {
    return rollDie() + rollDie();
}

var card01 = {age:"child",type:"event"};
var card02 = {age:"child",type:"event"};
var card03 = {age:"child",type:"event"};
var card04 = {age:"child",type:"event"};
var card05 = {age:"child",type:"event"};
var card06 = {age:"child",type:"event"};
var card07 = {age:"child",type:"event"};
var card08 = {age:"child",type:"bad"};
var card09 = {age:"child",type:"bad"};
var card10 = {age:"child",type:"bad"};

var card11 = {age:"child",type:"bad"};
var card12 = {age:"child",type:"bad"};
var card13 = {age:"child",type:"bad"};
var card14 = {age:"child",type:"good"};
var card15 = {age:"child",type:"good"};
var card16 = {age:"child",type:"good"};
var card17 = {age:"child",type:"good"};
var card18 = {age:"child",type:"good"};
var card19 = {age:"child",type:"good"};
var card20 = {age:"child",type:"good"};

var card21 = {age:"adult",type:"event"};
var card22 = {age:"adult",type:"event"};
var card23 = {age:"adult",type:"event"};
var card24 = {age:"adult",type:"event"};
var card25 = {age:"adult",type:"event"};
var card26 = {age:"adult",type:"event"};
var card27 = {age:"adult",type:"event"};
var card28 = {age:"adult",type:"bad"};
var card29 = {age:"adult",type:"bad"};
var card30 = {age:"adult",type:"bad"};

var card31 = {age:"adult",type:"bad"};
var card32 = {age:"adult",type:"bad"};
var card33 = {age:"adult",type:"bad"};
var card34 = {age:"adult",type:"good"};
var card35 = {age:"adult",type:"good"};
var card36 = {age:"adult",type:"good"};
var card37 = {age:"adult",type:"good"};
var card38 = {age:"adult",type:"good"};
var card39 = {age:"adult",type:"good"};
var card40 = {age:"adult",type:"good"};

var card41 = {age:"old",type:"event"};
var card42 = {age:"old",type:"event"};
var card43 = {age:"old",type:"event"};
var card44 = {age:"old",type:"event"};
var card45 = {age:"old",type:"event"};
var card46 = {age:"old",type:"event"};
var card47 = {age:"old",type:"event"};
var card48 = {age:"old",type:"bad"};
var card49 = {age:"old",type:"bad"};
var card50 = {age:"old",type:"bad"};

var card51 = {age:"old",type:"bad"};
var card52 = {age:"old",type:"bad"};
var card53 = {age:"old",type:"bad"};
var card54 = {age:"old",type:"good"};
var card55 = {age:"old",type:"good"};
var card56 = {age:"old",type:"good"};
var card57 = {age:"old",type:"good"};
var card58 = {age:"old",type:"good"};
var card59 = {age:"old",type:"good"};
var card60 = {age:"old",type:"good"};

var cards = [
    card01, card02, card03, card04, card05, card06, card07, card08, card09, card10,
    card11, card12, card13, card14, card15, card16, card17, card18, card19, card20,
    card21, card22, card23, card24, card25, card26, card27, card28, card29, card30,
    card31, card32, card33, card34, card35, card36, card37, card38, card39, card40,
    card41, card42, card43, card44, card45, card46, card47, card48, card49, card50,
    card51, card52, card53, card54, card55, card56, card57, card58, card59, card60
]

