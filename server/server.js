/* eslint-env node */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {};

function createRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

io.on("connection", (socket) => {
  console.log("Игрок подключился:", socket.id);

  socket.on("create-room", () => {
    const roomCode = createRoomCode();

    rooms[roomCode] = {
      players: [socket.id],
    };

    socket.join(roomCode);

    socket.emit("room-created", {
      roomCode,
      player: "R",
    });

    console.log("Комната создана:", roomCode);
  });

  socket.on("join-room", (roomCode) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("room-error", "Комната не найдена");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("room-error", "Комната заполнена");
      return;
    }

    room.players.push(socket.id);
    socket.join(roomCode);

    socket.emit("room-joined", {
      roomCode,
      player: "B",
    });

    io.to(roomCode).emit("game-start", {
      roomCode,
    });

    console.log("Игрок вошёл в комнату:", roomCode);
  });

  socket.on("online-move", ({ roomCode, index, player }) => {
    socket.to(roomCode).emit("opponent-move", {
      index,
      player,
    });
  });

  socket.on("disconnect", () => {
    console.log("Игрок отключился:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});