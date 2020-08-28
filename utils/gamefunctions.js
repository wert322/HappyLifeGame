const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./users');

function createCardSet(room, client) {
    const text = 'INSERT INTO cardset(roomname, eventadult, eventold, remainder) VALUES($1,$2,$3,$4)';
    const values = [room, [], [], []];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));;
}

function deleteCardSet(room, client) {
    const text = 'DELETE FROM cardset WHERE roomname = $1';
    const values = [room];
    client
        .query(text, values)
        .catch (e => console.error(e.stack));;
}

function addUser(socket, client) {
    const text = 'INSERT INTO users(id, balance, children, traits, married, room) VALUES($1,$2,$3,$4,$5,$6)';
    const values = [socket.id, 0, 0, [], false, getCurrentUser(socket.id).room];
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
                    doubleTraits(tempRow, socket, io);
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
function doubleTraits(tempRow, socket, io) {
    let result = Math.floor(Math.random() * 6 + 1);
    if (result < 4) {
        // update trait array to include T3
    } else {
        // update trait array to include T4
    }
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