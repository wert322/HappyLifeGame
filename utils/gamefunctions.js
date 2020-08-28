const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./users');
const { restart } = require('nodemon');
const { text } = require('express');

function createCardSet(room, client) {
    const text = 'INSERT INTO cardset(roomname, eventadult, eventold, remainder) VALUES($1,$2,$3,$4)';
    const values = [room, [], [], []];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
}

function deleteCardSet(room, client) {
    const text = 'DELETE FROM cardset WHERE roomname = $1';
    const values = [room];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
}

function addUser(socket, client) {
    const text = 'INSERT INTO users(id, balance, children, traits, married, room, giving, earning, penalty, college) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';
    const values = [socket.id, 0, 0, [], null, getCurrentUser(socket.id).room, 1, 1, 1, 1];
    client
        .query(text,values)
        .catch (e => console.error(e.stack));
}

function removeUser(socket, client) {
    const text = 'DELETE FROM users WHERE id = $1';
    const values = [socket.id];
    client
        .query(text,values)
        .catch (e => console.error(e.stack));
}


function pullCard(cardtype, age, client, socket, io) {
    if (cardtype === 'good') {
        const text = 'SELECT * FROM good WHERE age = $1 ORDER BY RANDOM() LIMIT 1';
        const values = [age];
        client.query(text, values, (err, res) => {
            if (err) {
                console.log(err);
            } else {
                var tempRow = res.rows[0];
                if (traitcard === 2) {
                    doubleTraits(tempRow, socket, io, client);
                } else {
                    if (tempRow.money) {
                        moneyUpdate(tempRow,'good', socket, io);
                    }
                    if (tempRow.mobility) {
                        goodMobility(tempRow, socket, io);
                    }
                    if (traitcard === 1) {
                        giveTrait(tempRow, socket, io);
                    }
                    var tempDescription = tempRow.description;
                    var tempIcon = tempRow.icon;
                    var tempUser = getCurrentUser(socket.id);
                    io.to(tempUser.room).emit('showRegularGB', {tempDescription, tempIcon});
                }
            }
        })
    } else if (cardtype === 'bad') {
        
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

// Used to update the money of cards, used for all types. Can take in good dice roll cards
function moneyUpdate() {

}

// Used for good mobility cards, which add a few extra spaces to the next turn
function goodMobility() {

}

// Used to give trait cards, used for all types
function giveTrait() {

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

// Updates the coefficient for the specific column fro the specific user
function updateCoefficient(client, header, id, value) {
    const text = 'UPDATE users SET $1 = $2 WHERE id = $3';
    const values = [header, value, id];
    client
        .query(text, values)
        .catch(e => console.error(e.stack));
}

// Updates the users db to hold the users new traits list. Also updates his coefficients
function updateTraits(tempArray, client, id, trait) {
    const text = 'UPDATE users SET traits = $1 WHERE id = $2';
    const values = [tempArray, id];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));
    // Switches to updating coefficients
    var tempRow = getTraitDetails(client, trait);
    text = 'UPDATE users SET $1 = $2 WHERE id = $3';
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