const { query } = require('express');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./users');

// ASYNC
// Takes the type of card and age zone, does the proper updates to the user's data, and emits the proper information to display the card
async function pullCard(cardtype, age, client, socket, io) {
    
    console.log('');

    if (cardtype === 'Misfortune') {
        cardtype = 'bad';
    } else if (cardtype === 'Lucky') {
        cardtype = 'good';
    } else {
        cardtype = 'event';
    }

    if (age === 'OldAge') {
        age ='Old';
    }

    console.log('Card type: '+ cardtype + '. Card age: ' + age + '. In gamefunctions.');
 
    let promise1 =  getPartner(socket, client, io);
    let promise2 =  getCardSet(socket, client, 'remainder');
    let promise3 =  getCardSet(socket, client,'eventadult');
    let promise4 =  getCardSet(socket, client, 'eventold');
    let promise5 = getTraits(client, socket.id);

    let partnerID = await promise1;
    let remainderDiscards = await promise2;
    let eventadultDiscards = await promise3;
    let eventoldDiscards = await promise4;
    let playerTraits = await promise5;

    console.log('Partner ID: ' + partnerID + ', Remainder Discards: ' + remainderDiscards+ ', Adult Discards: ' + eventadultDiscards + ', Old Discards: ' + eventoldDiscards);
    console.log('Start turn user traits: ' + playerTraits);

    let currentUser = getCurrentUser(socket.id);
    let room = currentUser.room;
    let cardDescription;
    let iconCode;

    if (cardtype === 'good') {
        const text = 'SELECT * FROM good WHERE age = $1 AND NOT (id = ANY($2)) ORDER BY RANDOM() LIMIT 1';
        const values = [age, remainderDiscards];
        try {
            const res = await client.query(text, values);
            let goodData = res.rows[0];
            console.log(goodData);

            cardDescription = goodData.description;
            iconCode = goodData.icon;
            io.to(room).emit('showRegularCard', {cardDescription, iconCode});

            if (goodData.traitcard === 2) {
                doubleTraits(socket, io, client);
            } else {
                if (goodData.mobility) {
                    goodMobility(goodData, socket, io, client);
                }
                if (goodData.traitcard === 1) {
                    giveTrait(goodData.trait, socket.id, io, client);
                    if (partnerID !== null) {
                        giveTrait(goodData.trait, partnerID, io, client);
                    }
                }
                if (goodData.money) {
                    moneyUpdate(goodData, 'good', socket, io, client);
                } 
            }
            discardCard(goodData, socket, client, 'remainder');
        } catch (err) {
            console.log(err.stack);
            console.log(query.text);
        }
    } else if (cardtype === 'bad') {
        const text = 'SELECT * FROM bad WHERE age = $1 AND NOT (id = ANY($2)) ORDER BY RANDOM() LIMIT 1';
        const values = [age, remainderDiscards];
        try {
            const res = await client.query(text, values);
            let badData = res.rows[0];
            console.log(badData);

            cardDescription = badData.description;
            iconCode = badData.icon;
            io.to(room).emit('showRegularCard', {cardDescription, iconCode});

            if (badData.id === 'BC1' || badData.id === 'BA5') {
                suddenDeath(badData, socket, client, io, socket.id);
            } else if (badData.id === 'BC5'){
                    kidnapping(badData, socket, client, io);
            } else {
                if (badData.traitcard) {
                    giveTrait(badData.trait, socket.id, io, client);
                    if (partnerID !== null) {
                        giveTrait(badData.trait, partnerID, io, client);
                    }
                }
                if (badData.loseturn) {
                    loseTurn(socket, client, io);
                }
                if (badData.money) {
                    moneyUpdate(badData,'bad', socket, io, client);
                } 
            }  
            discardCard(badData, socket, client, 'remainder');
        } catch (err) {
            console.log(err.stack);
            console.log(query.text);
        }
    } else {
        let marriedCount = await getMarriedCount(socket, client);
        console.log('Number of married users: ' + marriedCount);

        let totalCount = getRoomUsers(getCurrentUser(socket.id).room).length;
        console.log('Total room users: ' + totalCount);

        let combinedDiscards = remainderDiscards;

        if (partnerID === null) {
            combinedDiscards = combinedDiscards.concat(['EA1', 'EA2', 'EO1', 'EO2']);
            if (totalCount - marriedCount < 2) {
                combinedDiscards = combinedDiscards.concat(['EA3', 'EO3']);
            }
        } else {
            combinedDiscards = combinedDiscards.concat(['EA3', 'EO3']);
        }
        if (playerTraits.includes('T6')) {
            combinedDiscards = combinedDiscards.concat(['EA7']);
        }
        if (eventadultDiscards.length === 8) {
            eventadultDiscards = [];
        }
        if (eventoldDiscards.length === 8) {
            eventoldDiscards = [];
        }
        combinedDiscards = combinedDiscards.concat(eventadultDiscards).concat(eventoldDiscards);
        console.log('Combined discards: ' + combinedDiscards);

        const text = 'SELECT * FROM events WHERE age = $1 AND NOT (id = ANY($2)) ORDER BY RANDOM() LIMIT 1';
        const values = [age, combinedDiscards];
        try {
            const res = await client.query(text, values);
            let eventData = res.rows[0];
            standardEvent(eventData, socket, client, io, age);
        } catch (error) {
            console.log(error.stack);
        }
    }
}

// ASYNC
// For good cards that have traits = 2
async function doubleTraits(socket, io, client) {
    let result = Math.floor(Math.random() * 6 + 1);
    
    let currentUser = getCurrentUser(socket.id);
    let partnerID = await getPartner(socket, client, io);
    let room = currentUser.room;
    
    let cardChoice;
    let resultPhrase;
    
    if (result < 4) {
        cardChoice = 'T3';
        resultPhrase = 'You rolled a ' + result + ', giving you honmmei chocos and the romantic trait as a result!'
    } else {
        cardChoice = 'T4';
        resultPhrase = 'You rolled a ' + result + ', giving you giri chocos and the romantic trait as a result!'
    }

    io.to(room).emit('showRegularOutcome', {resultPhrase});
    giveTrait(cardChoice, socket.id, io, client);
    
    if (partnerID !== null) {
        giveTrait(cardChoice, partnerID, io, client);
    }
}

// ASYNC
// Used to give trait cards, used for all types
async function giveTrait(traitID, id, io, client) {
    let userTraits = await getTraits(client, id);
    let room = getCurrentUser(id).room;

    if (!userTraits.includes(traitID)) {
        console.log('Trait given: ' + traitID);
        userTraits.push(traitID);
        updateTraits(userTraits, client, id, traitID);
    } else {
        io.to(room).emit('traitOccupied', {description: 'You already have this trait.'});
    }
}

// ASYNC
// Updates the users db to hold the users new traits list. Also updates his coefficients. Does not do anything to the marriage card except add it to the array
async function updateTraits(userTraits, client, id, traitID) {
    let traitDetails = await getTraitDetails(client, traitID);
    let value = 1;
    let coefficient;
    
    const text = 'UPDATE users SET traits = $1 WHERE id = $2';
    const values = [userTraits, id];
    
    client
        .query(text, values)
        .catch (e => console.error(e.stack));

    if (traitDetails.receiving) {
        coefficient = await getCoefficient(client, 'receiving', id);
        value = traitDetails.receivingc * coefficient;
        updateCoefficient(client, 'receiving', id, value);
        value = 1;
    }
    if (traitDetails.giving) {
        coefficient = await getCoefficient(client, 'giving', id);
        value = traitDetails.givingc * coefficient;
        updateCoefficient(client, 'giving', id, value);
        value = 1;
    }
    if (traitDetails.earning) {
        coefficient = await getCoefficient(client, 'earning', id);
        value = traitDetails.earningc * coefficient;
        updateCoefficient(client, 'earning', id, value);
        value = 1;
    }
    if (traitDetails.penalty) {
        coefficient = await getCoefficient(client, 'penalty', id);
        value = traitDetails.penaltyc * coefficient;
        updateCoefficient(client, 'penalty', id, value);
        value = 1;
    }
    if (traitDetails.college) {
        coefficient = await getCoefficient(client, 'college', id);
        value = traitDetails.collegec * coefficient;
        updateCoefficient(client, 'college', id, value);
        value = 1;
    }
}

// ASYNC
// Pulls and returns the array of traits for the user
async function getTraits(client, id) {
    const text = 'SELECT traits FROM users WHERE id = $1 LIMIT 1';
    const values = [id];
    try {
        const res = await client.query(text, values);
        console.log('Given user traits: ' + res.rows[0].traits);
        let promise = new Promise((resolve, reject) => {
            resolve(res.rows[0].traits);
        });
        return promise;
    } catch (error) {
        console.log(error.stack);
    }
}

// ASYNC
// Returns as a keyed object, the row that contains the details of the specified trait
async function getTraitDetails(client, trait) {
    const text = 'SELECT * FROM traits WHERE id = $1 LIMIT 1';
    const values = [trait];
    try {
        const res = await client.query(text, values);
        let promise = new Promise((resolve, reject) => {
            resolve(res.rows[0]);
        });
        return promise;
    } catch (error) {
        console.log(error.stack);
    }
}

// ASYNC
// Used to update the money of cards, used for all types. Can take in good dice roll cards. Adds in the coefficient 
async function moneyUpdate(cardData, type, socket, io, client) {
    let room = getCurrentUser(socket.id).room;
    
    let coefficient;
    let value = cardData.value;
    console.log('Money update. Room: ' + room + '. Value: ' + value + '.');
    try {
        if (type === 'good') {
            coefficient = await getCoefficient(client, 'earning', socket.id);
            value *= coefficient;
            if (cardData.rolldice) {
                let result = Math.floor(Math.random() * 6 + 1);
                value *= result;
                let resultPhrase = 'You rolled a ' + result + ', and received ' + value + ' million yen as a result.';
                io.to(room).emit('showRegularOutcome', {resultPhrase});
            } 
            console.log('Earning Coefficient: ' + coefficient + ', Final value: ' + value);
            updateBalance(client, socket, socket.id, value, io, false);
        } else if (type === 'bad') {
            coefficient = await getCoefficient(client, 'penalty', socket.id);
            if (cardData.percent) {
                value = 1 - value;
                value *= coefficient;
                let balance = await getBalance(client, socket.id);
                value *= balance;
            } else {
                value *= coefficient;
            }
            value *= -1;
            console.log('Earning Coefficient: ' + coefficient + ', Final value: ' + value);
            updateBalance(client, socket, socket.id, value, io, false);
        } else { // Type: choice
            if (value < 0) {
                coefficient = await getCoefficient(client, 'penalty', socket.id);
            } else {
                coefficient = await getCoefficient(client, 'earning', socket.id);
            }
            console.log('PreC value: ' + value + ', Coefficient: ' + coefficient);
            value *= coefficient;
            console.log('PostC value: ' + value);
            console.log('Earning Coefficient: ' + coefficient + ', Final value: ' + value);
            updateBalance(client, socket, socket.id, value, io, false);
        } 
    } catch (err) {
        console.log(err.stack);
    }
}

// ASYNC
// Takes the player and the value of the sum to be added or subtracted, and updates the DB accordingly
async function updateBalance(client, socket, id, sumvalue, io, ignore) {
    try {
        let balance = await getBalance(client, id);
        console.log('Current balance: ' + balance + '. Value to be added: ' + sumvalue);
        let partnerID = await getPartner(socket, client, io);
        balance += sumvalue;
        balance = balance.toFixed(2);
        console.log('New balance: ' + balance);
        let text = 'UPDATE users SET balance = $1 WHERE id = $2';
        let values = [balance, id];
        client
            .query(text, values)
            .catch (e => console.error(e.stack));
        if (partnerID !== null && !ignore) {
            values = [balance, partnerID];
            client
                .query(text, values)
                .catch (e => console.error(e.stack));
    }
    } catch (error) {
        console.log(error.stack);
    }
}

// ASYNC
// Takes the player's id and returns their current balance
async function getBalance(client, id) {
    const text = 'SELECT balance FROM users WHERE id = $1 LIMIT 1';
    const values = [id];
    try {
        const res = await client.query(text, values);
        let promise = new Promise((resolve, reject) => {
            resolve(Number(res.rows[0].balance));
        });
        return promise;
    } catch (error) {
        console.log(error.stack);
    }
}

// ASYNC
// Gets the coefficient for the specific column from the specified user
async function getCoefficient(client, header, id) {

    const values = [id];
    const text = 'SELECT * FROM users WHERE id = $1 LIMIT 1';

    try {
        let value;
        const res = await client.query(text, values);
        if (header === 'receiving') {
            value = Number(res.rows[0].receiving);
        } else if (header === 'giving') {
            value = Number(res.rows[0].giving);
        } else if (header === 'earning') {
            value = Number(res.rows[0].earning);
        } else if (header === 'penalty') {
            value =  Number(res.rows[0].penalty);
        } else {
            value = Number(res.rows[0].college);
        }
        let promise = new Promise((resolve, reject) => {
            resolve(value);
        });
        return promise;
    } catch (error) {
        console.log(error.stack)
    }
}

// Updates the coefficient for the specific column for the specific user
function updateCoefficient(client, header, id, value) {
    if (header === 'receiving') {
        var text = 'UPDATE users SET receiving = $1 WHERE id = $2';
    } else if (header === 'giving') {
        var text = 'UPDATE users SET giving = $1 WHERE id = $2';
    } else if (header === 'earning') {
        var text = 'UPDATE users SET earning = $1 WHERE id = $2';
    } else if (header === 'penalty') {
        var text = 'UPDATE users SET penalty = $1 WHERE id = $2';
    } else {
        var text = 'UPDATE users SET college = $1 WHERE id = $2';
    }
    const values = [value, id];
    client
        .query(text, values)
        .catch(e => console.error(e.stack));
}

// ASYNC
// Used for good mobility cards, which add a few extra spaces to the next turn
async function goodMobility(goodData, socket, io, client) {
    let partnerID = await getPartner(socket, client, io);
    var squaresNumber = goodData.squares;
    socket.emit('addSpacesNext', {tempSquares});
    if (partnerID !== null) {
        socket.to(partnerID).emit('addSpacesNext', {squaresNumber});
    }
}

// ASYNC
// Takes the player and for either of the sudden death events (BC1 and BC5), rolls the dice and accordingly penalizes the player or kills them
async function suddenDeath(cardData, socket, client, io, id) {
    let partnerID = await getPartner(socket, client, io);
    let room = getCurrentUser(id).room;

    let result = Math.floor(Math.random() * 6 + 1) * Math.floor(Math.random() * 6 + 1);
    let resultPhrase = 'You rolled a ' +  result;

    if (result === 1 || result === 36) {
        const text = 'UPDATE users SET alive = $1 WHERE id = $2';
        const values = [false, id];
        client
            .query(text, values)
            .catch(e => console.error(e.stack));
        resultPhrase = resultPhrase + ' and as a result, you have died. Better luck next time!';
        socket.emit('deathEvent', {filler: true});
        if (partnerID !== null) {
            values = [false, partnerID];
            client
                .query(text, values)
                .catch(e=> console.error(e.stack));
            socket.to(partnerID).emit('deathEvent', {filler: true});
        }
    } else {
        let value = cardData.value;
        let coefficient = await getCoefficient(client, 'penalty', id);
        value *= coefficient;
        resultPhrase = resultPhrase + '. You survive, but you pay ' + value + ' million yen in medical fees.';
        value *= -1;
        updateBalance(client, socket, id, value, io, false);
    }
    io.to(room).emit('showRegularOutcome', {resultPhrase});
}

// ASYNC
// Takes the player and for the kidnapping event (BC5), rolls the dice and accordingly penalizes the player or makes them lose a turn
async function kidnapping(badData, socket, client, io) {
    let room = getCurrentUser(socket.id).room;

    let result = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
    let resultPhrase = 'You rolled a ' + result;

    if (result < 5 || result > 9) {
        resultPhrase = resultPhrase + '. Unfortunately you are kidnapped and you lose your next turn.';
        loseTurn(socket, client, io);
    } else {
        let value = badData.value;
        let coefficient = await getCoefficient(client, 'penalty', socket.id);
        value *= coefficient;
        resultPhrase = resultPhrase + '. You pay a ransom of ' + value + ' million yen to be set free.';
        value *= -1;
        updateBalance(client, socket, socket.id, value, io, false);
    }
    io.to(room).emit('showRegularOutcome', {resultPhrase});
}

// ASYNC
// Emits event that the player should lose their next turn. Currently just emits hardcoded 1 turn, but can be changed to be dynamic
async function loseTurn(socket, client, io) {
    let partnerID = await getPartner(socket, client, io);
    socket.emit('loseNextTurn', {turns: 1});
    if (partnerID !== null) {
        socket.to(partnerID).emit('lostNextTurn', {turns: 1});
    }
}

// ASYNC
// Adds the passed in card ID to the matching set, so that it is essentially discarded
async function discardCard(tempRow, socket, client, setType) {
    try {
        let currentRoom = getCurrentUser(socket.id).room;
        var discards = await getCardSet(socket, client, setType);
        discards.push(tempRow.id);
        console.log('Card discarded: ' + tempRow.id);
        if (tempRow.age === 'Child') {
            var text = 'UPDATE cardsets SET remainder = $1 WHERE roomname = $2';
        } else if (tempRow.age === 'Adult') {
            var text = 'UPDATE cardsets SET eventadult = $1 WHERE roomname = $2';  
        } else {
            var text = 'UPDATE cardsets SET eventold = $1 WHERE roomname = $2';
        }
        const values = [discards, currentRoom];
        client
            .query(text, values)
            .catch(e => console.error(e.stack));
    } catch (error) {
        console.log(error.stack);
    }
    
}

// ASYNC
// Gets the current set of discarded cards in the specified room
async function getCardSet(socket, client, setType) {
    let room = getCurrentUser(socket.id).room;
    let text;
    let cardset;
    if (setType === 'eventadult') {
        text = 'SELECT eventadult FROM cardsets WHERE roomname = $1 LIMIT 1';
    } else if (setType === 'eventold') {
        text = 'SELECT eventold FROM cardsets WHERE roomname = $1 LIMIT 1';
    } else {
        text = 'SELECT remainder FROM cardsets WHERE roomname = $1 LIMIT 1';
    }
    const values = [room];
    try {
        let res = await client.query(text, values);
        if (setType === 'eventadult') {
            cardset = res.rows[0].eventadult;
        } else if (setType === 'eventold') {
            cardset = res.rows[0].eventold;
        } else {
            cardset = res.rows[0].remainder;
        }
        let promise = new Promise((resolve, reject) => {
            resolve(cardset);
        });
        return promise;
    } catch (error) {
        console.log(error);
    }
}

// ASYNC
//  Takes the specified event and obtains the user's response before then operating on it. Also takes into account special situations and passes the corresponding type to helper methods
async function standardEvent(eventData, socket, client, io, age) {
    let room = getCurrentUser(socket.id).room;
    let partnerID = await getPartner(socket, client, io);
    let setType;
    let choicesArray;
    let cardDescription = eventData.description;
    
    console.log('Card description: ' + cardDescription);
    console.log(eventData);
    
    io.to(room).emit('showRegularCard', {cardDescription});

    if (eventData.choice1text !== null && eventData.id !== 'EA6' && eventData.id !== 'EO5') {
        console.log(eventData.choice1text);
        console.log(eventData.choice1);
        console.log(eventData.choice2text);
        console.log(eventData.choice2);
        choicesArray = [eventData.choice1text, eventData.choice1, eventData.choice2text, eventData.choice2];
        console.log(choicesArray);
        socket.emit('twoChoiceEvent', {choicesArray});
        socket.once('twoChoiceResponse', ({choiceID}) => {
            console.log('Choice ID: ' + choiceID);
            choicesUpdate(socket, client, io, choiceID, 'standard', null);
        })
        if (age === 'Child') {  
            setType = 'remainder';
        } else if (age === 'Adult') {
            setType = 'eventadult';
        } else {
            setType = 'eventold';
        }
        discardCard(eventData, socket, client, setType);
    } else if (eventData.id === 'EA6' || eventData.id === 'EO5') {
        choicesArray = [eventData.choice1text, eventData.choice1, eventData.choice2text, eventData.choice2];
        socket.emit('investChoiceEvent', {choicesArray});
        socket.on('investChoiceResponse', ({choiceID, input}) => {
            if (choiceID === 'C28') {
                choicesUpdate(socket, client, io, choiceID, 'invest', input);
            } else {
                choicesUpdate(socket, client, io, choiceID, 'standard', null);
            }
        })
        if (age === 'Adult') {
            setType = 'eventadult';
        } else {
            setType = 'eventold';
        }
        discardCard(eventData, socket, client, setType);
    } else if (eventData.id === 'EA1' || eventData.id === 'EO1') { //Divorce   
        divorceCard(eventData, socket, client, io);
    } else if (eventData.id === 'EA2' || eventData.id === 'EO2') { //Children
        childrenCard(eventData.id, socket, client, io);
    } else if (eventData.id === 'EA3' || eventData.id === 'EO3') { //Married
        marriageCard(socket, client, io);
    } else if (eventData.id === 'EO6') {  //Sell house
        choicesUpdate(socket, client, io, 'C41', 'standard', null);
        discardCard(eventData, socket, client, 'eventold');
    } else if (eventData.id === 'EO7') { //Book club
        choicesUpdate(socket, client, io, 'C56', 'bookclub', null);
        discardCard(eventData, socket, client, 'eventold');
    } else if (eventData.id === 'EO10') { //Elected as mayor
        choicesUpdate(socket, client, io, 'C48', 'standard', null);
        discardCard(eventData, socket, client, 'eventold');
    } else { //Become guardian of child
        updateChildren(socket.id, client, 1);
        if (partnerID !== null) {
            updateChildren(partnerID, client, 1);
        }
        choicesUpdate(socket, client, io, 'C49', 'standard', null);
        discardCard(eventData, socket, client, 'eventold');
    }   

}

// ASYNC
// Takes in the given choice by ID and operates it based on the specific type
async function choicesUpdate(socket, client, io, choiceID, choiceType, input) {
    let user = getCurrentUser(socket.id);
    let roomUsers = getRoomUsers(user.room);
    let promise1 = await getTraits(client, socket.id);
    let promise2 = await getChoiceDetails(client, choiceID);
    let promise3 = await getPartner(socket, client, io);

    let userTraits = promise1;
    let choice = promise2;
    let partnerID = promise3;

    console.log('Choices User Traits: ' + userTraits);
    console.log('Choices Choice Details: ' + choice.id + ', ' + choice.description);
    console.log('Choices Partner ID: ' + partnerID);

    let choiceDescription = choice.description;
    let userC;
    let partnerC;
    let thirdC;

    if (choiceType === 'standard') {
        if (choice.factoringid !== null && userTraits.includes(choice.factoringid)) {
            choiceID = choice.redirectid;
            choice = await getChoiceDetails(client, choiceID);
        }
        if (!choice.effectless) {
            if (choiceID === 'C41') {
                let result = Math.floor(Math.random() * 6 + 1);
                choice.value *= result;
            } 
            if (choice.money) {
                console.log('Choices Update value: ' + choice.value);
                moneyUpdate(choice, 'choice', socket, io, client);
            }
            if (choice.turnchange) {
                loseTurn(socket, client, io);
            }
            if (choice.hastrait) {
                giveTrait(choice.trait, socket.id, io, client);
                if (partnerID !== null) {
                    giveTrait(choice.trait, partnerID, io, client);
                }
            }
        }
    } else if (choiceType === 'invest') {
        let result = Math.floor(Math.random() * 6 + 1);
        let value = input * result;
        if (result % 2 === 1) {
            value *= -1;
        }
        updateBalance(client, socket, socket.id, value, io, false);
        choiceDescription = 'You rolled a ' + result + '. The result of your investment was a change of ' + value + ' million yen.';
    } else if (choiceType === 'divorce') {
        updateMarriage(socket.id, client, io, null);
        updateMarriage(partnerID, client, io, null);
        userC = await getCoefficient(client, 'receiving', socket.id);
        partnerC = await getCoefficient(client, 'giving', partnerID);
        if (choiceID === 'C23') {
            userC *= 10;
            partnerC *= -10;
            updateBalance(client, socket, socket.id, userC, io, false);
            updateBalance(client, socket, partnerID, partnerC, io, true);
        } else {
            userC *= 20;
            partnerC *= -20;
            let childrenCount = await getChildren(partnerID, client);
            userC *= childrenCount;
            partnerC *= childrenCount;
            updateBalance(client, socket, socket.id, userC, io, false);
            updateBalance(client, socket, partnerID, partnerC, io, true);
        }
        // Emit event probably
    } else if (choiceType === 'marriage') {
        userC = await getCoefficient(client, 'receiving', socket.id) * 0.05;
        partnerC = await getCoefficient(client, 'receiving', partnerID) * 0.05;

        await Promise.all(roomUsers.map(async (element) => {
            try {
                if (element.id !== socket.id && element.id !== input) {
                    thirdC = await getCoefficient(client, 'giving', element.id) * -0.05;
                    updateBalance(client, socket, socket.id, userC, io, false);
                    updateBalance(client, socket, input, partnerC, io, true);
                    updateBalance(client, socket, element.id, thirdC, io, true);
                }
            } catch (error) {
                console.log(error.stack);
            }
        }));

    } else if (choiceType === 'children') {
        updateChildren(socket.id, client, input);
        updateChildren(partnerId, client, input);
        userC = await getCoefficient(client, 'receiving', socket.id) * 0.1 * input;
        partnerC = await getCoefficient(client, 'receiving', socket) * 0.1 * input;

        await Promise.all(roomUsers.map(async (element) => {
            try {
                if (element.id !== socket.id && element.id !== partnerID) {
                    thirdC = await getCoefficient(client, 'giving', element.id) * -0.1;
                    updateBalance(client, socket, socket.id, userC, io, false);
                    updateBalance(client, socket, partnerID, partnerC, io, true);
                    updateBalance(client, socket, element.id, thirdC, io, true);
                }
            } catch (error) {
                console.log(error.stack);
            }
        }));
    }  else { //choiceType = 'bookclub'
        if (userTraits.includes('T4') && userTraits.includes('T12')) {
            choice.value = 10;
        } else if (userTraits.includes('T4')) {
            choice.value = 20;
        } else if (userTraits.includes('T12')) {
            choice.value = 0;
        } else {
            choice.value = 10;
        }
        moneyUpdate(choice ,'choice', socket, io, client);
    }
    io.to(user.room).emit('showRegularOutcome', choiceDescription);
}

// ASYNC
// Takes the ID of the choice and returns the corresponding row as an object
async function getChoiceDetails(client, choiceID) {
    const text = 'SELECT * FROM eventchoices WHERE id = $1';
    const values = [choiceID];
    try {
        const res = await client.query(text, values);
        let promise = new Promise((resolve, reject) => {
            resolve(res.rows[0]);
        });
        return promise;
    } catch (error) {
        console.log(error.stack);
    }
}

// Handles divorce event cards. Top of the stack
function divorceCard(tempRow, socket, client, io) {
    const text = 'SELECT married FROM users WHERE id = $1';
    const values = [socket.id];
    client
        .query(text, values)
        .then (res => {
            let tempMarriage = res.row[0];
            if (tempMarriage.married !== null) {
                if (tempRow.id === 'EA1') {
                    choicesUpdate(socket, client, io, 'C23', 'divorce', null);
                } else {
                    choicesUpdate(socket, client, io, 'C40', 'divorce', null);
                }
            } 
        })
        .catch (e => console.error(e.stack));;
}

// Takes the ID of a player and updates their married status
function updateMarriage(id, client, io, input) {
    const text = 'UPDATE users SET married = $1 WHERE id = $2';
    const values = [input, id];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
}

// ASYNC
// Takes the current user and returns the ID of their marriage partner. Null if there is no partner (unmarried)
async function getPartner(socket, client, io) {
    let playerID = socket.id;
    const text = 'SELECT married FROM users WHERE id = $1';
    const values = [playerID];
    try {
        const res = await client.query(text, values);
        let promise = new Promise((resolve, reject) => {
            resolve(res.rows[0].married);
        });
        return promise;
    } catch (error) {
        console.log(error.stack);
    }
}

// ASYNC
// Handles the marriage event. Handles the checking of if they have the distrust trait and if they do, it prevents marriage while also removing those trait cards from their arrays
async function marriageCard(socket, client, io) {
    socket.emit('getPartnerEvent', {filler: true});
    socket.on('getPartnerResponse', async ({partnerName}) => {

        let currentRoom = getCurrentUser(socket.id).room;
        var pID = await getPartnerID(currentRoom, client, partnerName);
        var userTraits = await getTraits(client, socket.id);
        var partnerTraits = await getTraits(client, pID);
   
        if (!userTraits.includes('T2') || !partnerTraits.includes('T2')) {
            updateMarriage(pID, client, io, socket.id);
            updateMarriage(socket.id, client, io, pID);
            choicesUpdate(socket, client, io, 'C25', 'marriage', pID);
        } else {
            let index;
            if (userTraits.includes('T2')) {
                index = userTraits.indexOf('T2');
                userTraits.splice(index, 1);
                updateTraits(userTraits, client, socket.id, 'T2');
            }
            if (partnerTraits.includes('T2')) {
                index = partnerTraits.indexOf('T2');
                partnerTraits.splice(index, 1);
                updateTraits(partnerTraits, client, pID, 'T2');
            }
            choicesUpdate(socket, client, io, 'C50', 'standard', null);
        }
    });
}

// ASYNC
// Returns the id of the partner
async function getPartnerID(currentRoom, client, partnerName) {
    const text = 'SELECT id FROM users WHERE room = $1 AND username = $2';
    const values = [currentRoom, partnerName];
    console.log('getPartnerID: ' + currentRoom + ', ' + partnerName);
    try {
        const res = await client.query(text, values);
        let promise = new Promise((resolve, reject) => {
            console.log(res.rows[0]);
            resolve(res.rows[0].id);
            console.log('Partner ID: ' + res.rows[0].id);
        })
        return promise;
    } catch (error) {
        console.log(error.stack);
    }
}
// ASYNC
// Returns the number of married people in a room. Decides if marriage cards can still be landed on
async function getMarriedCount(socket, client) {
    let currentRoom = getCurrentUser(socket.id).room;
    const text = 'SELECT COUNT(*) FROM users WHERE room = $1 AND married IS NOT NULL';
    const values = [currentRoom];
    try {
        const res = await client.query(text, values);
        let promise = new Promise((resolve, reject) => {
            resolve(res.rows[0].count);
        });
        return promise;
    } catch (error) {
        console.log(error.stack);
    }
}

//  Handles the children event. Rolls the dice and passes on the sum that determines number 
function childrenCard(eventID, socket, client, io) {
    let result = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
    let numberChildren;
    let choiceID;
    if (eventID === 'EA2') {
        if (result === 2 || result === 12) {
            numberChildren = 3;
        } else if (result === 3 || result === 4 || result === 10 || result === 11) {
            numberChildren = 2;
        } else {
            numberChildren = 1;
        }
        choiceID = 'C24';
    } else {
        if (result === 2 || result === 12) {
            numberChildren = 2;
        } else {
            numberChildren = 1;
        }
        choiceID = 'C55';
    }
    choicesUpdate(socket, client, io, choiceID, 'children', numberChildren);
}

// Updates the actual DB of the given player (ID) and with the number of new
async function updateChildren(id, client, children) {
    let currentChildren = await getChildren(id, client);
    children += currentChildren;
    const text = 'UPDATE users SET children = $1 WHERE id = $2';
    const values = [children, children];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
}

// ASYNC
// Gets the number of children for the given player (ID)
async function getChildren(id, client) {
    const text = 'SELECT children FROM users WHERE id = $1';
    const values = [id];
    try {
        const res = await client.query(text, values);
        let promise = new Promise((resolve, reject) => {
            resolve(res.rows[0].children);
        });
        return promise;
    } catch (error) {
        console.log(error.stack);
    }
}

// ASYNC (not in use currently)
// Gets the living status of the given player (ID)
async function getAlive(id, client) {
    const text = 'SELECT * FROM users WHERE id = $1';
    const values = [id];
    try {
        const res = await client.query(text, values);
        let promise = new Promise((resolve, reject) => {
            resolve(res.rows[0].alive);
        });
        return promise;
    } catch (error) {
        console.log(error.stack);
    }
}

// Creates the array that holds the pulled cards for each room
function createCardSet(room, client) {
    const text = 'INSERT INTO cardsets(roomname, eventadult, eventold, remainder) VALUES($1,$2,$3,$4)';
    const values = [room, [], [], []];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
}

// Deletes the array that holds the pulled cards for each room when they are emptied
function deleteCardSet(room, client) {
    const text = 'DELETE FROM cardsets WHERE roomname = $1';
    const values = [room];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
}

// Adds the user to the users table
function addUser(socket, client) {
    let tempUser = getCurrentUser(socket.id);
    const text = 'INSERT INTO users(id, balance, children, traits, married, room, receiving, giving, earning, penalty, college, alive, username) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)';
    const values = [socket.id, 10, 0, [], null, tempUser.room, 1, 1, 1, 1, 1, true, tempUser.username];
    client
        .query(text,values)
        .catch (e => console.error(e.stack));
}

// Removes the user from the users table when they disconnect
function removeUser(socket, client) {
    const text = 'DELETE FROM users WHERE id = $1';
    const values = [socket.id];
    client
        .query(text,values)
        .catch (e => console.error(e.stack));
}

// Enacts the college event upon exiting child zone
function college(client, socket, io) {
    let collegeText = 'You have arrived at adulthood. Would you like to pursue a college education for 10 million yen and a lost turn? You are allowed to go into debt.'
    socket.emit('collegeResponse', {collegeText});
    socket.on('collegeChoice', ({choice}) => { //Ideally choice is a boolean
        if (choice) {
            choicesUpdate(socket, client, io, 'C30', 'standard', null);
        } else {
            // Maybe event an event saying they move on
        }
    });
}

// Tabulates the players at the end based on living status and balance to help determine a winner
function tabulatePlayers(client, socket, io) {
    let room = getCurrentUser(socket.id).room;
    const text = 'SELECT username, (20*children+balance) AS totalBalance FROM users WHERE room= $1 ORDER BY alive DESC, totalBalance DESC;';
    const values = [room];
    let usernames = [];
    let balances = [];
    client
        .query(text, values)
        .then (res => {
            const data = res.rows;
            data.forEach (row => {
                usernames.push(row.username);
                balances.push(row.totalBalance);
            })
            io.to(room).emit('finalTabulation', {usernames, balances});
        })
        .catch (e => console.error(e.stack));
}

// Emits the balance of all players
function allBalances(client, socket, io) {
    let room = getCurrentUser(socket.id).room;
    let usernames = [];
    let balances = [];
    const text = 'SELECT balance, username FROM users WHERE room = $1';
    const values = [room];
    client
        .query(text, values)
        .then (res => {
            const data = res.rows;
            data.forEach (row => {
                usernames.push(row.username);
                balances.push(row.balance);
            })
            io.to(room).emit('balanceUpdate', {usernames, balances});
        })
        .catch (e => console.error(e.stack));
}

// Emits the number of children of all players
function allChildren(client, socket, io) {
    let room = getCurrentUser(socket.id).room;
    let usernames = [];
    let children = [];
    const text = 'SELECT children, username FROM users WHERE room = $1';
    const values = [room];
    client
        .query(text, values)
        .then (res => {
            const data = res.rows;
            data.forEach (row => {
                usernames.push(row.username);
                children.push(row.children);
            })
            io.to(room).emit('childrenUpdate', {usernames, children});
        })
        .catch (e => console.error(e.stack));
}

// Emits the username of each players marriage partner
function allMarriage(client, socket, io) {
    let room = getCurrentUser(socket.id).room;
    let usernames = [];
    let partners = [];
    let partnerUsername;
    const text = 'SELECT married, username FROM users WHERE room = $1';
    const values = [room];
    client
        .query(text, values)
        .then (res => {
            const data = res.rows;
            data.forEach (row => {
                partnerUsername = getCurrentUser(married).username;
                usernames.push(row.username);
                partners.push(partnerUsername);
            })
            io.to(room).emit('marriageUpdate', {usernames, partners});
        })
        .catch (e => console.error(e.stack));
}

// Returns traits of all players
function allTraits(client, socket, io) {
    let room = getCurrentUser(socket.id).room;
    let traitData;
    let userTraits;
    let usernames = [];
    let traits = [];
    let tempTraits = [];
    let traitDetails = [];
    const text = 'SELECT username, traits FROM users WHERE room = $1';
    const values = [room];
    client
        .query(text, values)
        .then (res => {
            const data = res.rows;
            data.forEach (row => {
                tempTraits = [];
                usernames.push(row.username);
                userTraits = row.traits;
                userTraits.forEach(element => {
                    traitDetails = [];
                    traitData = getTraitDetails(client, element);
                    traitDetails.push(traitData.name);
                    traitDetails.push(traitData.description);
                    tempTraits.push(traitDetails);
                })
                traits.push(tempTraits);
            })
            io.to(room).emit('traitsUpdate', {usernames, traits});
        })
        .catch (e => console.error(e.stack));
}

module.exports = {pullCard, createCardSet, deleteCardSet, addUser, removeUser, college, tabulatePlayers, allBalances, allChildren, allMarriage, allTraits};