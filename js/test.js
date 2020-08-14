var peer = new Peer();

function initialize() {
    peer.on('open', function(id) {
        alert('My peer ID is: ' + id);
    });
    peer.on('connection', function(conn) {
        alert('We have liftoff');
        conn.on('open', function() {
            alert('The message was sent');
            conn.send('Hello World');
        });
    });
}

function joint() {
    var dID = prompt('Input your host\'s ID:');
    var conn = peer.connect(dID);

    conn.on('open', function() {
        conn.on('data', function(data) {
            alert('Got something');
            console.log(data);
        });
    });
    
      
    /*if(conn.open) {   
        alert('made it ');
    } else {
        alert('nope');
    }*/
}
