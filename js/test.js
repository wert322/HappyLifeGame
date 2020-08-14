var peer = new Peer();

function initialize() {
    peer.on('open', function(id) {
        document.getElementById("hostID").innerHTML = id;
    });
    peer.on('connection', function(conn) {
        alert('We have liftoff');
        var phrase = prompt('Type your message here');
        conn.on('open', function() {
            alert('The message was sent');
            conn.send(phrase);
        });
    });
}

function joint() {
    var dID = prompt('Input your host\'s ID:');
    var conn = peer.connect(dID);

    conn.on('open', function() {
        conn.on('data', function(data) {
            alert('Received this message: ' + data);
            console.log(data);
        });
    });
    
      
    /*if(conn.open) {   
        alert('made it ');
    } else {
        alert('nope');
    }*/
}
