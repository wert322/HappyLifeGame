var peer = new Peer();
var conn = null;
var dID = null;
var username = "";
var clientList = new Map;

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
        document.getElementById("hostID").innerHTML = dID;
        username = document.getElementsByName("usernameForm")[0].value;
    });
    peer.on('connection', function(conn) {
        alert('Connection established');
        conn.on('open', function() {
            alert('Sending ID and username right now');
            conn.send(username);
        });
        conn.on('data', function(data) {
            alert('Received Username and ID in exchange');
            tempID = data[0];
            tempUS = data[1];
            clientList.set(tempID, tempUS);
        });
    });
}

function joint() {
    server()
    peer.on('open', function() {
        var cID = document.getElementsByName("hostIDForm")[0].value;
        username = document.getElementsByName("usernameForm")[0].value;
        if (cID == "" || cID == "Enter the Host's ID") {
            cID = prompt("Input your host's ID:");
        }
        conn = peer.connect(cID);
        conn.on('open', function() {
            conn.on('data', function(data) {
                alert('Received this message: ' + data);
                clientList.set(cID, data);
            });
            alert('Sending over Username and ID right now');
            var combinedUSID = Array;
            combinedUSID[0] = dID;
            combinedUSID[1] = username;
            conn.send(combinedUSID);
        });
    });
}

/*
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