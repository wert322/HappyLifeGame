var app = express();
var server = require('http').createServer(app).listen(8080);
var io = require('socket.io').listen(server);

/* old code is this
var peer = new Peer();
var conn = null;
var dID = null;
var username = "";

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
    server()
    peer.on('open', function() {
        alert('My peer ID is: ' + dID);
        document.getElementById("hostIDPlaceholder").innerHTML = dID;
        username = document.getElementsByName("usernameForm")[0].value;
    });
    peer.on('connection', function(conn) {
        var phrase = prompt('We have liftoff. Type your message here');
        conn.on('open', function() {
            alert('The message was sent');
            conn.send(phrase);
        });
    });
}

function joint() {
    server()
    peer.on('open', function() {
        dID = document.getElementsByName("hostIDForm")[0].value;
        username = document.getElementsByName("usernameForm")[0].value;
        if (dID == "" || dID == "Enter the Host's ID") {
            dID = prompt("Input your host's ID:");
        }
        conn = peer.connect(dID);
        conn.on('open', function() {
            conn.on('data', function(data) {
                alert('Received this message: ' + data);
            });
        });
    });
}


function readySwitch() {
    var testelm = document.getElementById("testButton"); //renamed this btw
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
}*/