var peer = new Peer();
var conn = null;
var dID = null;

function server() {
    peer = new Peer('', {secure:true, host:'happylifegame.herokuapp.com', port:443});
    peer.on('open', function(id) {
        dID = id;
    });
    peer.on('error', function(err) {
        alert('' + err);
    });
    function ping() {
        console.log(peer)
        peer.socket.send({
            type: 'ping'
        })
        setTimeout(ping, 16000)
    }
    ping()
}

function initialize() {
    server();
    peer.on('open', function() {
        document.getElementById("hostID").innerHTML = dID;
    });
    alert(dID);
    peer.on('connection', function(incoming) {
        /*if(conn) {
            incoming.close();
            alert('connection is closed');
            return;
        }*/
        conn = incoming;
        alert('We have liftoff');
        var phrase = prompt('Type your message here');
        conn.on('open', function() {
            alert('The message was sent');
            conn.send(phrase);
        });
    });
}

function joint() {
    server();
    peer.on('open', function(){
        alert('I am here at least');
        dID = prompt('Input your host\'s ID:');
        conn = peer.connect(dID);
        alert(dID);
        conn.on('open', function() {
            alert('Conn working');
            conn.on('data', function(data) {
                alert('Received this message: ' + data);
                console.log(data);
            });
        });
    });
}

function readySwitch() {
    var testelm = document.getElementById("testButton");
    if (testelm.value=="Not Ready") {
        testelm.value = "Ready";
        alert('we here');
        conn.on('open', function() {
            alert('Test');
            conn.send(true);
        });
    } else{
        testelm.value = "Not Ready";
        alert('We not here');

        conn.on('open', function() {
            alert('Test2');
            conn.send(false);
        });
    }
}