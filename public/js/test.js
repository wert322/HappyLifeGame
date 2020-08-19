const roomDoc = document.getElementById('rooms');
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
    if (roomList.length === 0) {
        roomDoc.textContent='No rooms are currently available';
    } else {
        roomDoc.textContent='';
        var fragment = document.createDocumentFragment();
        for (var i = 0; i < roomList.length; i++) {
            var li = document.createElement("li");
            if (i % 2 === 0) {
                li.setAttribute('id', 'alternativelist');
            } else {
                li.setAttribute('id', 'regularlist');
            }
            li.appendChild(document.createTextNode(roomList[i] + ": " + memberCount[i] + "/6 users"));
            fragment.appendChild(li);
        }
        roomDoc.appendChild(fragment);
    }
}