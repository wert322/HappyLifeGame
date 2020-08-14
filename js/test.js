

function initialize() {
    var peer = new Peer();
    alert('test22');
    peer.on('open', function(id) {
        alert('My peer ID is: ' + id);
    });
}