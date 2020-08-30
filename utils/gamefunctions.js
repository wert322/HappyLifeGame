const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./users');
const { restart } = require('nodemon');
const { text } = require('express');
const e = require('express');

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
    const values = [socket.id, 0, 0, [], null, tempUser.room, 1, 1, 1, 1, 1, true, tempUser.username];
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

// Takes the type of card and age zone, does the proper updates to the user's data, and emits the proper information to display the card
function pullCard(cardtype, age, client, socket, io) {
    if (cardtype === 'good') {
        let tempArray = getCardSet(socket, client, 'remainder');
        const text = 'SELECT * FROM good WHERE age = $1 AND NOT (id = ANY($2)) ORDER BY RANDOM() LIMIT 1';
        const values = [age, tempArray];
        client.query(text, values, (err, res) => {
            if (err) {
                console.log(err);
            } else {
                var tempRow = res.rows[0];
                if (tempRow.traitcard === 2) {
                    doubleTraits(tempRow, socket, io, client);
                } else {
                    if (tempRow.mobility) {
                        goodMobility(tempRow, socket, io);
                    }
                    if (tempRow.traitcard === 1) {
                        giveTrait(tempRow, socket, io, client);
                    }
                    if (tempRow.money) {
                        moneyUpdate(tempRow,'good', socket, io, client);
                    } else {
                        let tempDescription = tempRow.description;
                        let tempIcon = tempRow.icon;
                        let tempUser = getCurrentUser(socket.id);
                        let tempUsername = tempUser.username;
                        io.to(tempUser.room).emit('showRegularGB', {tempDescription, tempIcon, tempUsername});
                    }
                }
                discardCard(tempRow, socket, client, 'remainder');
            }
        })
    } else if (cardtype === 'bad') {
        let tempArray = getCardSet(socket, client, 'remainder');
        const text = 'SELECT * FROM bad WHERE age = $1 AND NOT (id = ANY($2)) ORDER BY RANDOM() LIMIT 1';
        const values = [age, tempArray];
        client.query(text, values, (err, res) => {
            if (err) {
                console.log(err);
            } else {
                var tempRow = res.rows[0];
                if (tempRow.id === 'BC1' || tempRow.id === 'BA5') {
                    suddenDeath(tempRow, socket, client, io);
                } else if (tempRow.id === 'BC5'){
                    kidnapping(tempRow, socket, client, io);
                } else {
                    if (tempRow.traitcard) {
                        giveTrait(tempRow, socket, io, client);
                    }
                    if (tempRow.loseturn) {
                        loseTurn(socket, io, client);
                    }
                    if (tempRow.money) {
                        moneyUpdate(tempRow,'bad', socket, io, client);
                    } else {
                        let tempDescription = tempRow.description;
                        let tempIcon = tempRow.icon;
                        let tempUser = getCurrentUser(socket.id);
                        let tempUsername = tempUser.username;
                        io.to(tempUser.room).emit('showRegularGB', {tempDescription, tempIcon, tempUsername});
                    }
                }
                discardCard(tempRow, socket, client, 'remainder');
            }
        });
    } else {
        let marriedStatus = getPartner(socket, client, io);
        let marriedCount = getMarriedCount(socket, client);
        let totalCount = getRoomUsers(getCurrentUser(socket.id).room).length;
        let tempArray1 = getCardSet(socket, client, 'remainder');
        let tempArray2 = getCardSet(socket, client,'eventadult');
        let tempArray3 = getCardSet(socket, client, 'eventold');
        let tempArray = tempArray1;
        if (marriedStatus == null && totalCount - marriedCount > 1) {
            tempArray.concat(['EA1', 'EA2', 'EO1', 'EO2']);
        } else {
            tempArray.concat(['EA3', 'EO3']);
        }
        if (tempArray2.length === 8) {
            tempArray2 = [];
        }
        if (tempArray3.length === 8) {
            tempArray3 = [];
        }
        tempArray = tempArray.concat(tempArray2).concat(tempArray3);
        const text = 'SELECT * FROM events WHERE age = $1 AND NOT (id = ANY($2)) ORDER BY RANDOM() LIMIT 1';
        const values = [age, tempArray];
        client.query(text, values, (err, res) => {
            if (err) {
                console.log(err);
            } else {
                var tempRow = res.rows[0];
                standardEvent(tempRow, socket, client, io, age);
            }
        });
    }
}

// For good cards that have traits = 2
function doubleTraits(tempRow, socket, io, client) {
    let result = Math.floor(Math.random() * 6 + 1);
    let cardChoice;
    var tempArray = getTraits(client, socket.id);
    var changePhrase;
    if (result < 4) {
        cardChoice = 'T3';
        tempArray.push('T3');
        changePhrase = 'You rolled a ' + result + ', giving you honmmei chocos and the romantic trait as a result!'
    } else {
        cardChoice = 'T4';
        tempArray.push('T4');
        changePhrase = 'You rolled a ' + result + ', giving you giri chocos and the romantic trait as a result!'
    }
    updateTraits(tempArray, client, socket.id, cardChoice);
    var tempUser = getCurrentUser(socket.id);
    var tempDescription = tempRow.description;
    var tempIcon = tempRow.icon;
    let tempUsername = tempUser.username;
    io.to(tempUser.room).emit('showModifiedGB', {tempDescription, tempIcon, changePhrase, tempUsername});
}

// Used to give trait cards, used for all types
function giveTrait(tempRow, socket, io, client) {
    let tempArray = getTraits(client, socket.id);
    let traitID = tempRow.trait;
    if (!tempTraits.includes(traitID)) {
        tempArray.push(tempID);
        updateTraits(tempArray, client, socket.id, traitID);
        // Maybe emit event to indicate that the db has been updated 
    } else {
        // Maybe emit a custom event for when they already have the trait card: TBD, confer with Brandon
    }
}

// Used to update the money of cards, used for all types. Can take in good dice roll cards. Adds in the coefficient 
function moneyUpdate(tempRow, type, socket, io, client) {
    var tempDescription = tempRow.description;
    var tempIcon = tempRow.icon;
    var tempUser = getCurrentUser(socket.id);
    var tempCoefficient;
    var tempValue = tempRow.value;
    let tempUsername = tempUser.username;
    if (type === 'good') {
        tempCoefficient = getCoefficient(client, 'earning', socket.id);
        tempValue *= tempCoefficient;
        if (tempRow.rolldice) {
            let result = Math.floor(Math.random() * 6 + 1);
            tempValue *= result;
            var changePhrase = 'You rolled a ' + result + ', and received ' + tempValue + ' million yen as a result.';
            io.to(tempUser.room).emit('showModifiedGB', {tempDescription, tempIcon, changePhrase, tempUsername});
        } else {
            io.to(tempUser.room).emit('showRegularGB', {tempDescription, tempIcon, tempUsername});
        }
        updateBalance(client, socket, socket.id, tempValue, io);
    } else if (type === 'bad') {
        tempCoefficient = getCoefficient(client, 'penalty', socket.id);
        if (tempRow.percent) {
            tempValue = 1 - tempValue;
            tempValue *= tempCoefficient;
            let tempBalance = getBalance(client, socket.id);
            tempValue *= tempBalance;
        } else {
            tempValue *= tempCoefficient;
        }
        tempValue *= -1;
        updateBalance(client, socket, socket.id, tempValue, io);
        io.to(tempUser.room).emit('showRegularGB', {tempDescription, tempIcon, tempUsername});
    } else if (type === 'choice') {
        if (value < 0) {
            tempCoefficient = getCoefficient(client, 'penalty', socket.id);
        } else {
            tempCoefficient = getCoefficient(client, 'earning', socket.id);
        }
        tempValue *= tempCoefficient;
        updateBalance(client, socket, socket.id, tempValue, io);
        // For events: MORE COMPLEX
    } 
    // FOR NON STANDARD CHOICES
}

// Used for good mobility cards, which add a few extra spaces to the next turn
function goodMobility(tempRow, socket, io) {
    var tempSquares = tempRow.squares;
    socket.emit('addSpacesNext', {tempSquares});
}

// Takes the player and the value of the sum to be added or subtracted, and updates the DB accordingly
function updateBalance(client, socket, id, sumvalue, io) {
    let tempID = id;
    let tempBalance = getBalance(client, tempID);
    tempBalance += sumvalue;
    const text = 'UPDATE users SET balance = $1 WHERE id = $2';
    const value = [tempBalance, tempID];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
    // Possibly emit an event
}

// Takes the player's id and returns their current balance
function getBalance(client, id) {
    const text = 'SELECT balance FROM users WHERE id = $1 LIMIT 1';
    const values = [id];
    client
        .query(text, values)
        .then(res => {
            return res.rows[0].balance;
        })
        .catch (e => console.error(e.stack));
}

// Pulls and returns the array of traits for the user
function getTraits(client, id) {
    const text = 'SELECT traits FROM users WHERE id = $1 LIMIT 1';
    const values = [id];
    client
        .query(text, values)
        .then(res => {
            return res.rows[0].id;
        })
        .catch (e => console.error(e.stack));
}

// Returns as a keyed object, the row that contains the details of the specified trait
function getTraitDetails(client, trait) {
    const text = 'SELECT * FROM traits WHERE id = $1 LIMIT 1';
    const values = [trait];
    client
        .query(text, values)
        .then(res => {
            return res.rows[0];
        })
        .catch (e => console.error(e.stack));
}

// Gets the coefficient for the specific column from the specified user
function getCoefficient(client, header, id) {
    const text = 'SELECT $1 FROM users WHERE id = $2 LIMIT 1';
    const values = [header, id];
    client
        .query(text, values)
        .then(res => {
            return res.rows[0].header;
        })
        .catch(e => console.error(e.stack));
}

// Updates the coefficient for the specific column for the specific user
function updateCoefficient(client, header, id, value) {
    const text = 'UPDATE users SET $1 = $2 WHERE id = $3';
    const values = [header, value, id];
    client
        .query(text, values)
        .catch(e => console.error(e.stack));
}

// Updates the users db to hold the users new traits list. Also updates his coefficients. Does not do anything to the marriage card except add it to the array
function updateTraits(tempArray, client, id, trait) {
    const text = 'UPDATE users SET traits = $1 WHERE id = $2';
    const values = [tempArray, id];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
    var tempRow = getTraitDetails(client, trait);
    var tempValue = 1;
    if (tempRow.receiving) {
        tempValue = tempRow.receivingc * getCoefficient(client,'receiving', id);
        updateCoefficient(client,'receiving',id,tempValue);
        tempValue = 1;
    }
    if (tempRow.giving) {
        tempValue = tempRow.givingc * getCoefficient(client,'giving', id);
        updateCoefficient(client,'giving',id,tempValue);
        tempValue = 1;
    }
    if (tempRow.earning) {
        tempValue = tempRow.earningc * getCoefficient(client,'earning', id);
        updateCoefficient(client,'earning',id,tempValue);
        tempValue = 1;
    }
    if (tempRow.penalty) {
        tempValue = tempRow.penaltyc * getCoefficient(client,'penalty', id);
        updateCoefficient(client,'penalty',id,tempValue);
        tempValue = 1;
    }
    if (tempRow.college) {
        tempValue = tempRow.collegec * getCoefficient(client,'college', id);
        updateCoefficient(client,'college',id,tempValue);
        tempValue = 1;
    }
}

// Takes the player and for either of the sudden death events (BC1 and BC5), rolls the dice and accordingly penalizes the player or kills them
function suddenDeath(tempRow, socket, client, io) {
    var tempDescription = tempRow.description;
    var tempIcon = tempRow.icon;
    var tempUser = getCurrentUser(socket.id);
    let tempUsername = tempUser.username;
    var result = Math.floor(Math.random() * 6 + 1);
    var result2 = Math.floor(Math.random() * 6 + 1);
    result *= result2;
    var customPhrase = 'You rolled a ' + result2;
    if (result === 1 || result === 36) {
        const text = 'UPDATE users SET alive = $1 WHERE id = $2';
        const values = [false, socket.id];
        client
            .query(text, values)
            .catch(e => console.error(e.stack));
        customPhrase = customPhrase + ' and as a result, you have died. Better luck next time!';
    } else {
        var tempValue = tempRow.value;
        var tempCoefficient = getCoefficient(client, 'penalty', socket.id);
        tempValue *= tempCoefficient;
        customPhrase = customPhrase + '. You survive, but you pay ' + tempValue + ' million yen in medical fees.';
        tempValue *= -1;
        updateBalance(client, socket, socket.id, tempValue, io);
    }
    io.to(tempUser.room).emit('showModifiedGB', {tempDescription, tempIcon, customPhrase, tempUsername});
}

// Takes the player and for the kidnapping event (BC5), rolls the dice and accordingly penalizes the player or makes them lose a turn
function kidnapping(tempRow, socket, client, io) {
    var tempDescription = tempRow.description;
    var tempIcon = tempRow.icon;
    var tempUser = getCurrentUser(socket.id);
    var tempUsername = tempUser.username;
    var result = Math.floor(Math.random() * 6 + 1);
    var result2 = Math.floor(Math.random() * 6 + 1);
    result += result2;
    var changePhrase = 'You rolled a ' + result;
    if (result < 5 || result > 9) {
        changePhrase = changePhrase + '. Unfortunately you are kidnapped and you lose your next turn.';
        loseTurn(socket, client, io);
    } else {
        var tempValue = tempRow.value;
        var tempCoefficient = getCoefficient(client, 'penalty', socket.id);
        tempValue *= tempCoefficient;
        changePhrase = changePhrase + '. You pay a ransom of ' + tempValue + ' million yen to be set free.';
        tempValue *= -1;
        updateBalance(client, socket, socket.id, tempValue, io);
    }
    io.to(tempUser.room).emit('showModifiedGB', {tempDescription, tempIcon, changePhrase, tempUsername});
}

// Emits event that the player should lose their next turn. Currently just emits hardcoded 1 turn, but can be changed to be dynamic
function loseTurn(socket, client, io) {
    socket.emit('loseNextTurn', {turns: 1});
}

// Adds the passed in card ID to the matching set, so that it is essentially discarded
function discardCard(tempRow, socket, client, setType) {
    var tempRoom = getCurrentUser(socket.id).room;
    var tempArray = getCardSet(socket, client, setType);
    tempArray.push(tempRow.id);
    const text = 'UPDATE cardsets SET $1 WHERE roomname = $2';
    const values = [tempArray, tempRoom];
    client
        .query(text, values)
        .catch(e => console.error(e.stack));
}

// Gets the current set of discarded cards in the specified room
function getCardSet(socket, client, setType) {
    var tempRoom = getCurrentUser(socket.id).room;
    const text = 'SELECT $1 FROM cardsets WHERE roomname = $2 LIMIT 1';
    const values = [setType, tempRoom];
    client
        .query(text, values)
        .then(res => {
            return res.rows[0].setType;
        })
        .catch(e => console.error(e.stack));
}

//  Takes the specified event and obtains the user's response before then operating on it. Also takes into account special situations and passes the corresponding type to helper methods
function standardEvent(tempRow, socket, client, io, age) {
    if (tempRow.choice1text != null && tempRow.id != 'EA6' && tempRow.id != 'EO5') {
        let tempArray = [tempRow.choice1text, tempRow.choice1, tempRow.choice2text, tempRow.choice2];
        let setType;
        socket.emit('twoChoiceEvent', {tempArray});
        socket.on('twoChoiceResponse', ({choiceID}) => {
            choicesUpdate(socket, client, io, choiceID, 'standard', null);
        })
        if (age === 'Child') {
            setType = 'remainder';
        } else if (age === 'Adult') {
            setType = 'eventadult';
        } else {
            setType = 'eventold';
        }
        discardCard(tempRow, socket, client, setType);
    } else if (tempRow.id === 'EA6' || tempRow.id === 'EO5') {
        let tempArray = [tempRow.choice1text, tempRow.choice1, tempRow.choice2text, tempRow.choice2];
        let setType;
        socket.emit('investChoiceEvent', {tempArray});
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
        discardCard(tempRow, socket, client, setType);
    } else if (tempRow.id === 'EA1' || tempRow.id === 'EO1') { //Divorce   
        divorceCard(tempRow, socket, client, io);
    } else if (tempRow.id === 'EA2' || tempRow.id === 'EO2') { //Married
        marriageCard(tempRow, socket, client, io);
    } else if (tempRow.id === 'EA3' || tempRow.id === 'EO3') { //Children 
        childrenCard();
    } else if (tempRow.id === 'EO6') {  //Sell house
        sellHouseCard();
    } else if (tempRow.id === 'EO7') { //Book club
        bookClubCard();
    } else if (tempRow.id === 'EO10') { //Elected as mayor
        mayorCard();
    } else { //Become guardian of child
        guardianCard();
    }   //discardCard(tempRow, socket, client, setType)
}

// Takes in the given choice by ID and operates it based on the specific type
function choicesUpdate(socket, client, io, choiceID, choiceType, input) {
    var tempUser = getCurrentUser(socket.id);
    let tempUsername = tempUser.username;
    if (choiceType === 'standard') {
        var tempArray = getTraits(client, socket.id);
        var tempChoice = getChoiceDetails(client, choiceID);
        if (!tempChoice.effectless) {
            if (tempChoice.factoringid != 'null' && tempArray.includes(tempChoice.factoringid)) {
                choiceID = tempChoice.redirectid;
                tempChoice = getChoiceDetails(client, choiceID);
            }
            if (tempChoice.money) {
                moneyUpdate(tempChoice, 'choice', socket, io, client);
            }
            if (tempChoice.turnchange) {
                loseTurn(socket, io, client);
            }
            if (tempChoice.hastrait) {
                giveTrait(tempChoice, socket, io, client);
            }
        }
        let tempDescription = tempChoice.description;
        io.to(tempUser.room).emit('showRegularChoice', {tempDescription, tempUsername});
    } else if (choiceType === 'invest') {
        let result = Math.floor(Math.random() * 6 + 1);
        let tempValue = input * result;
        if (result % 2 === 1) {
            tempValue *= -1;
        }
        updateBalance(client, socket, socket.id, tempValue, io);
        let tempPhrase = 'You rolled a ' + result + '. The result of your investment was a change of ' + tempValue + ' million yen.';
        io.to(tempUser.room).emit('showRegularChoice', {tempPhrase, tempUsername});
    } else if (choiceType === 'divorce') {
        let partnerID = getPartner(socket, client, io);
        updateMarriage(socket.id, client, io, null);
        updateMarriage(partnerID, client, io, null);
        let userC = getCoefficient(client, 'receiving', socket.id);
        let partnerC = getCoefficient(client, 'giving', partnerID);
        if (choiceID === 'C23') {
            userC *= 10;
            partnerC *= -10;
            updateBalance(client, socket, socket.id, userC, io);
            updateBalance(client, socket, partnerID, partnerC, io);
        } else {
            userC *= 20;
            partnerC *= -20;
            updateBalance(client, socket, socket.id, userC, io);
            updateBalance(client, socket, partnerID, partnerC, io);
        }
    } else if (choiceType === 'marriage') {
        let tempArray = getRoomUsers(tempUser.room);
        let userC;
        let partnerC;
        let thirdC;
        tempArray.forEach(element => {
            if (element.id !== socket.id && element.id !== input) {
                userC = getCoefficient(client, 'receiving', socket.id) * 0.05;
                partnerC = getCoefficient(client, 'receiving', socket) * 0.05;
                thirdC = getCoefficient(client, 'giving', element.id) * -0.05;
                updateBalance(client, socket, socket.id, userC, io);
                updateBalance(client, socket, input, partnerC, io);
                updateBalance(client, socket, element.id, thirdC, io);
            }
        });
    }
}

// Takes the ID of the choice and returns the corresponding row as an object
function getChoiceDetails(client, choiceID) {
    const text = 'SELECT * FROM eventchoices WHERE id = $1';
    const values = [choiceID];
    client
        .query(text, values)
        .then (res => {
            return res.rows[0];
        })
        .catch(e => console.error(e.stack));
}

// Handles divorce event cards. Top of the stack
function divorceCard(tempRow, socket, client, io) {
    const text = 'SELECT married FROM users WHERE id = $1';
    const values = [socket.id];
    client
        .query(text, values)
        .then (res => {
            let tempMarriage = res.row[0];
            if (tempMarriage.married != null) {
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

// Takes the current user and returns the ID of their marriage partner. Null if there is no partner (unmarried)
function getPartner(socket, client, io) {
    let tempID = socket.id;
    const text = 'SELECT married FROM users WHERE id = $1';
    const values = [tempID];
    client
        .query(text, values)
        .then (res => {
            return res.row[0].married;
        })
        .catch (e => console.error(e.stack));
}

// Handles the marriage event. Handles the checking of if they have the distrust trait and if they do, it prevents marriage while also removing those trait cards from their arrays
function marriageCard(tempRow, socket, client, io) {
    socket.emit('getPartnerID', {filler: true});
    socket.on('getPartnerResponse', ({pID}) => {
        let tempArray1 = getTraits(client, socket.id);
        let tempArray2 = getTraits(client, pID);
        if (!tempArray1.includes('T2') || !tempArray2.includes('T2')) {
            updateMarriage(pID, client, io, socket.id);
            updateMarriage(socket.id, client, io, pID);
            choicesUpdate(socket, client, io, 'C25', 'marriage', pID);
        } else {
            if (tempArray1.includes('T2')) {
                let index = tempArray1.indexOf('T2');
                tempArray1.splice(index, 1);
                updateTraits(tempArray1, client, socket.id, 'T2');
            }
            if (tempArray2.includes('T2')) {
                let index = tempArray2.indexOf('T2');
                tempArray2.splice(index, 1);
                updateTraits(tempArray2, client, pID, 'T2');
            }
            choicesUpdate(socket, client, io, 'C50', 'standard', null);
        }
    });
}

// Returns the number of married people in a room. Decides if marriage cards can still be landed on
function getMarriedCount(socket, client) {
    let tempRoom = getCurrentUser(socket.id).room;
    const text = 'SELECT COUNT(*) FROM users WHERE room = $1 AND married IS NOT NULL';
    const values = [tempRoom];
    client
        .query(text, values)
        .then (res => {
            return res.row[0].count;
        })
        .catch (e => console.error(e.stack));
}

module.exports = {pullCard, createCardSet, deleteCardSet, addUser, removeUser};

/*     const text = 'SELECT * FROM '
client.query('SELECT * FROM bad;', (err, res) => {
    if (err) {
        console.log("Test");
    };
    for (let row of res.rows) {
        console.log(JSON.stringify(row));
    }
    client.end();
})

*/