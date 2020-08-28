function createCardSet(room, client) {
    const text = 'INSERT INTO cardset(roomname, eventadult, eventold, remainder) VALUES($1,$2,$3,$4)';
    const values = [room, [], [], []];
    client.query(text, values);
}

function deleteCardSet(room, client) {
    const text = 'DELETE FROM cardset WHERE roomname = $1';
    const values = [room];
    client.query(text, values);
}


function pullCard (filler) {
    const text = 'SELECT * FROM '
    client.query('SELECT * FROM bad;', (err, res) => {
        if (err) {
            console.log("Test");
        };
        for (let row of res.rows) {
            console.log(JSON.stringify(row));
        }
        client.end();
    })
}

module.exports = {pullCard, createCardSet, deleteCardSet};