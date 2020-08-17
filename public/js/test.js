const roomList = document.getElementById('rooms');
const socket = io();

// Emits event to get the rooms and their sizes
socket.emit('getSize',{filler: true});

// Captures the map of rooms and their sizes, along with a list of the rooms
socket.on('roomUsers', ({memberCountMap, roomList}) => {
    outputRoomList(memberCountMap, roomList);
});

// Adds roomlist to startgame DOM
function outputRoomList(memberCountMap, roomList) {
    roomList.innerHTML = `
        ${roomList.map(room => `<li>${room}: ${memberCountMap.get(room)}/6 users</li>`).join('')}
    `;
}
