const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const toggleButton = document.getElementById('readyGameButton');

const socket = io();

// Get username and room from URL
var { username, room, customroom } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

// Check if it's a custom room and if so, update room
if (room === "custom") {
    room = customroom;
}

// Emits event to check if the room is full
socket.emit('joinTest', {room});

// Join chatroom
socket.on('joinTestResponse', isFull  => {
    if (isFull) {
        alert('This room is at maximum capacity. Please join a different room.');
        window.location.replace("lobby.html");
    } else {
        socket.emit('joinRoom', { username, room });
        socket.on('usernameTaken', filler => {
            alert('This username was taken. Please try a different one.');
            window.location.replace("lobby.html");
        });
    }
});

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// Message from server
socket.on('message', message => {
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
    var phrase = document.createElement("span");
    phrase.setAttribute("id", "time");
    phrase.appendChild(document.createTextNode(message.time));
    div.appendChild(phrase);
    div.appendChild(document.createTextNode(" " + message.username));
    var phraseTwo = document.createElement("span")
    phraseTwo.setAttribute("id", "text");
    phraseTwo.appendChild(document.createTextNode(" " + message.text));
    div.appendChild(phraseTwo);
    document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.textContent= room;
}

// Add users to DOM
function outputUsers(users) {
    userList.textContent='';
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < users.length; i++) {
        var li = document.createElement("li");
        li.setAttribute('id', users.username);
        li.appendChild(document.createTextNode(users[i].username));
        fragment.appendChild(li);
    }
    userList.appendChild(fragment);
}

function changeReady() {
    if (toggleButton.value === "Ready") {
        toggleButton.value = "Not Ready";
    } else {
        toggleButton.value = "Ready";
    }
}
