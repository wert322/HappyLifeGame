const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');


// Get username and room from URL
var { username, room, customroom } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

// Check if it's a custom room and if so, update room
if (room === "custom") {
    room = customroom;
}

const socket = io();

// Emites event to check if the room is full
socket.emit('joinTest', {room});

// Join chatroom
socket.on('joinTestResponse', isFull  => {
    if (isFull) {
        alert('This room is at maximum capacity. Please join a different room.');
        window.location.replace("startgame.html");
    } else {
        socket.emit('joinRoom', { username, room });
    }
});


// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// Message from server
socket.on('message', message => {
    console.log(message);
    outputMessage(message);

    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get message text
    const msg = e.target.elements.msg.value;

    // Emit message to server
    socket.emit('chatMessage', msg);

    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});


// Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p><span id="time">${message.time}</span> ${message.username}: <span id="text">${message.text}</span></p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}