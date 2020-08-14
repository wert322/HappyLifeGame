let canvas = document.getElementById("gameScreen");
let ctx = canvas.getContext("2d")

/* rolls a die and returns the value (1 to 6) */
function rollDie() {
    return Math.floor(Math.random() * 6 + 1);
}