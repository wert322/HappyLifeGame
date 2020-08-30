const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const {pullCard, createCardSet, deleteCardSet, addUser, removeUser} = require('./utils/gamefunctions');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Server';
var roomList = [];

const {Client} = require('pg');
const client = new Client({
    connectionString: 'postgres://mhzhcpihkxyejj:0be6dc9b8f8b2cd59cb3b957077a1b1e1d670525ca3a4216ffab4b647b14d9f9@ec2-107-20-104-234.compute-1.amazonaws.com:5432/d66rq4fqjgh8k9?sslmode=true',
    ssl: true,
    sslmode: require,
})
client.connect();

// Run when client connects
io.on('connection', socket => {

    socket.on('drawCard', ({cardtype}) => {
        pullCard(cardtype, age, client, socket, io);
    });

    // Checks if the room is full and responds with an appropriate signaling event
    socket.on('joinTest', ({room}) => {
        var isFull = (getRoomUsers(room).length > 5);
        socket.emit('joinTestResponse', isFull);
    });

    socket.on('joinRoom', ({username, room}) => {
        var tempUsers = getRoomUsers(room);
        var doesContain = false;
        for (i = 0; i < tempUsers.length; i++) {
            var tempObject = tempUsers[i];
            if (tempObject.username === username) {
                doesContain = true;
            }
        }
        if (doesContain) {
            socket.emit('usernameTaken', {filler: true});
        } else {
            const user = userJoin(socket.id, username, room);

            socket.join(user.room);

            // Checks if this room has already been made, and adds to the list if not
            if (roomList.indexOf(room) === -1) {
                roomList.push(room);
                createCardSet(room, client);
            }

            // Initializes the user in the DB
            addUser(socket, client);
            
            // Welcome current user
            socket.emit('message', formatMessage(botName, 'Welcome!'));

            // Broadcast when a user connects
            socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat.`));

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
            io.emit('updateRooms', {filler: true});
        }
    });

    // Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Listens for and returns the number of people in all rooms of a given array
    socket.on('getSize', (filler) => { 
        var memberCount = new Array();
        for (i = 0; i < roomList.length; i++) {
            memberCount.push(getRoomUsers(roomList[i]).length);
        };
        socket.emit('getSizeOutput', {memberCount, roomList});
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        
        // Removes the user from the db
        removeUser(socket, client);
        
        // Removes room from list if it's no longer populated/active
        if (user && getRoomUsers(user.room).length === 0) {
            deleteCardSet(user.room, client);
            var indexPlace = roomList.indexOf(user.room);
            if (indexPlace > -1) {
                roomList.splice(indexPlace, 1);
            };
        };
        
        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat.`));
            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
            io.emit('updateRooms', {filler: true});
        }
    });
});

const port = process.env.PORT || 8000;

server.listen(port, () => console.log('Server running on port ' + port));