const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./users');
const { restart } = require('nodemon');
const { text } = require('express');
const e = require('express');

// Creates the array that holds the pulled cards for each room
function createCardSet(room, client) {
    const text = 'INSERT INTO cardset(roomname, eventadult, eventold, remainder) VALUES($1,$2,$3,$4)';
    const values = [room, [], [], []];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
}

// Deletes the array that holds the pulled cards for each room when they are emptied
function deleteCardSet(room, client) {
    const text = 'DELETE FROM cardset WHERE roomname = $1';
    const values = [room];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
}

// Adds the user to the users table
function addUser(socket, client) {
    const text = 'INSERT INTO users(id, balance, children, traits, married, room, receiving, giving, earning, penalty, college) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)';
    const values = [socket.id, 0, 0, [], null, getCurrentUser(socket.id).room, 1, 1, 1, 1, 1];
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
        const text = 'SELECT * FROM good WHERE age = $1 ORDER BY RANDOM() LIMIT 1';
        const values = [age];
        client.query(text, values, (err, res) => {
            if (err) {
                console.log(err);
            } else {
                var tempRow = res.rows[0];
                if (tempRow.traitcard === 2) {
                    doubleTraits(tempRow, socket, io, client);
                } else {
                    if (tempRow.money) {
                        moneyUpdate(tempRow,'good', socket, io, client);
                    }
                    if (tempRow.mobility) {
                        goodMobility(tempRow, socket, io);
                    }
                    if (tempRow.traitcard === 1) {
                        giveTrait(tempRow, socket, io, client);
                    }
                    // var tempDescription = tempRow.description;
                    // var tempIcon = tempRow.icon;
                    // var tempUser = getCurrentUser(socket.id);
                    // io.to(tempUser.room).emit('showRegularGB', {tempDescription, tempIcon});
                }
            }
        })
    } else if (cardtype === 'bad') {
        const text = 'SELECT * FROM bad WHERE age = $1 ORDER BY RANDOM() LIMIT 1';
        const values = [age];
        client.query(text, values, (err, res) => {
            if (err) {
                console.log(err);
            } else {
                var tempRow = res.rows[0];
                if (tempRow.id === 'BC1' || tempRow.id === 'BA5') {
                    // sudden death
                } else if (tempRow.id === 'BC5'){
                    // kidnapping
                } else {
                    if (tempRow.traitcard) {
                        
                    }
                    if (tempRow.money) {

                    }
                    if (tempRow.loseturn) {

                    }
                }
            }
        });
    } else {

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
    io.to(tempUser.room).emit('showModifiedGB', {tempDescription, tempIcon, changePhrase})
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

// Used to update the money of cards, used for all types. Can take in good dice roll cards. Adds in the coefficient too
function moneyUpdate(tempRow, type, socket, io, client) {
    var tempDescription = tempRow.description;
    var tempIcon = tempRow.icon;
    var tempUser = getCurrentUser(socket.id);
    if (type === 'good') {
        var tempCoefficient = getCoefficient(client, 'earning', socket.id);
        var tempValue = tempRow.value;
        tempValue *= tempCoefficient;
        if (tempRow.rolldice) {
            var result = Math.floor(Math.random() * 6 + 1);
            tempValue *= result;
            var changePhrase = 'You rolled a ' + result + ', and received ' + tempValue + ' yen as a result.';
            io.to(tempUser.room).emit('showModifiedGB', {tempDescription, tempIcon, changePhrase});
        } 
        updateBalance(client, socket, tempValue, io);
        io.to(tempUser.room).emit('showRegularGB', {tempDescription, tempIcon});
    } else if (type === 'bad') {
        // For penalties
    } else {
        // For events: MORE COMPLEX
    }
}

// Used for good mobility cards, which add a few extra spaces to the next turn
function goodMobility(tempRow, socket, io) {
    var tempSquares = tempRow.squares;
    socket.emit('addSpacesNext', {tempSquares});
}

// Takes the player and the value of the sum to be added or subtracted, and updates the DB accordingly
function updateBalance(client, socket, value, io) {
    let tempID = socket.id;
    let tempBalance = getBalance(client, tempID);
    tempBalance += value;
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