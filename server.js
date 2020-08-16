const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Server';
var roomList = [];

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room); 

        // Checks if this room has already been made, and adds to the list if not
        if (roomList.indexOf(room) === -1) {
            roomList.push(room);
        }

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome!'));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat.`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        
        // Removes room from list if it's no longer populated/active
        if (getRoomUsers(user.room).length === 0) {
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
        }
    });
});

const port = process.env.PORT || 8000;

server.listen(port, () => console.log('Server running on port ' + port));