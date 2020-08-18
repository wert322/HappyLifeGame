const roomList = document.getElementById('rooms');
const socket = io();

// Emits event to get the rooms and their sizes
socket.emit('getSize',{filler: true});

// Captures the map of rooms and their sizes, along with a list of the rooms
socket.on('getSizeOutput', ({memberCount, roomList}) => {
    console.log(memberCount.toString());
    console.log(roomList.toString());
    outputRoomList(memberCount, roomList);
});

socket.on('updateRooms', ({filler}) => {
    socket.emit('getSize',{filler: true});
});

// Adds roomlist to startgame DOM
function outputRoomList(memberCount, roomList) {
    var roomListHTML = "";
    for (i = 0; i < roomList.length; i++) {
        roomListHTML += `<li>${roomList[i]}: ${memberCount[i]}/6 users</li>`;
    }
    console.log(roomListHTML);
    roomList.textContent = roomListHTML;
}