const { Server } = require("socket.io");

const io = new Server(8000, {
    cors: true,
});

const Room = {};

function getKeyByValue(object, value) {
    for (let key in object) {
        if (object[key] === value) {
            return key;
        }
    }
    // If the value is not found
    return null;
}


io.on("connection", (socket) => {
    console.log(`Socket Connected`, socket.id);

    // =========================== Step 4 ===========================
    socket.on("Send_RoomJoin_Req", (roomCode) => {
        // io.to(roomCode).emit("User_Join", socket.id);
        // socket.join(roomCode);
        if (Room[roomCode]) {
            io.to(Room[roomCode]).emit("User_Join", socket.id);
            // io.to(socket.id).emit("User_Join", Room[roomCode]);
            delete Room.roomCode;
        }
        else {
            Room[roomCode] = socket.id;
        }
    });

    // =========================== Step 6 ===========================
    socket.on("Send_Offer", ({ remoteId, Offer }) => {
        io.to(remoteId).emit("Get_Offer", { id: socket.id, Offer });
        // console.log(`1 Id: ${remoteId} Socket id: ${socket.id}`)
    });

    // =========================== Step 8 ===========================
    socket.on("Send_Ans", ({ id, Ans }) => {
        io.to(id).emit("Get_Ans", Ans);
        // console.log(`2 Id: ${id} Socket id: ${socket.id}`)
    });

    // =========================== Step 10 ===========================
    socket.on('disconnect', () => {
        let key = getKeyByValue(Room, socket.id);
        delete Room[key];
        // console.log(Room);
    });
});

console.log("Server Run");