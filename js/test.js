var peer = new Peer();

function initialize() {
    peer.on('open', function(id) {
        alert('My peer ID is: ' + id);
    });
}

function joint() {
    var dID = prompt('Input your host\'s ID:');
    var conn = peer.connect(dID);
    alert('made it ');
}