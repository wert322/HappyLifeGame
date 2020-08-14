

function initialize() {
    var peer = new Peer();
    peer.on('open', function(id) {
        alert('My peer ID is: ' + id);
    });
}