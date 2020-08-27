function pullCard (filler) {
    client.query('SELECT * FROM bad;', (err, res) => {
        if (err) {
            console.log("Test");
        }
        ;
        for (let row of res.rows) {
            console.log(JSON.stringify(row));
        }
        client.end();
    })
}

module.exports = pullCard;