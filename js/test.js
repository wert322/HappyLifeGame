var peer = new Peer();

function initialize() {
    peer.on('open', function(id) {
        alert('My peer ID is: ' + id);
    });
    peer.on('connection', function(conn) {
        alert('We have liftoff');
    });
}

function joint() {
    var dID = prompt('Input your host\'s ID:');
    var conn = peer.connect(dID);
    /*conn.on('open', function() {
        // Receive messages
        conn.on('data', function(data) {
          console.log('Received', data);
        });
      
        // Send messages
        conn.send('Hello!');
    });*/
    /*if(conn.open) {   
        alert('made it ');
    } else {
        alert('nope');
    }*/
}
