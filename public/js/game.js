/* rolls a die and returns the value (1 to 6) */
function rollDie() {
    return Math.floor(Math.random() * 6 + 1);
}

function rollTwoDie() {
    return rollDie() + rollDie();
}