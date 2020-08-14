var peer = new Peer();

function initialize() {
    peer.on('open', function(id) {
        alert('My peer ID is: ' + id);
    });
    peer.on('connection', function(conn) {
        alert('We have liftoff');
        conn.send('Hello World');
    });
}

function joint() {
    var dID = prompt('Input your host\'s ID:');
    var conn = peer.connect(dID);

    conn.on('data', function(data) {
        alert(data);
        console.log(data);
    });
      
    /*if(conn.open) {   
        alert('made it ');
    } else {
        alert('nope');
    }*/
}
