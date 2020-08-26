const socket = io();

socket.emit('testDB', {filler: true});
