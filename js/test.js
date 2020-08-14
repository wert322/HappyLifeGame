var peer = new Peer();

function initialize() {
    peer.on('open', function(id) {
        alert('My peer ID is: ' + id);
    });
}