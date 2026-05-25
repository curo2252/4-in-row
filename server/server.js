/* eslint-env node */
/* global require, process */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const SIZE = 8;
const RED = "R";
const BLUE = "B";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Four In Row server is running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {};

function createRoomCode() {
  let code;

  do {
    code = Math.random().toString(36).substring(2, 7).toUpperCase();
  } while (rooms[code]);

  return code;
}

function getRoomBySocketId(socketId) {
  return Object.entries(rooms).find(([, room]) =>
    room.players.some((player) => player.id === socketId)
  );
}

io.on("connection", (socket) => {
  console.log("Игрок подключился:", socket.id);

  socket.on("create-room", () => {
    const roomCode = createRoomCode();

    rooms[roomCode] = {
      board: Array(SIZE * SIZE).fill(null),
      turn: RED,
      players: [{ id: socket.id, symbol: RED }],
    };

    socket.join(roomCode);

    socket.emit("room-created", {
      roomCode,
      player: RED,
      board: rooms[roomCode].board,
      turn: rooms[roomCode].turn,
    });

    console.log("Комната создана:", roomCode);
  });

  socket.on("join-room", (roomCodeRaw) => {
    const roomCode = String(roomCodeRaw || "").trim().toUpperCase();
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("room-error", "Комната не найдена");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("room-error", "Комната заполнена");
      return;
    }

    room.players.push({ id: socket.id, symbol: BLUE });
    socket.join(roomCode);

    socket.emit("room-joined", {
      roomCode,
      player: BLUE,
      board: room.board,
      turn: room.turn,
    });

    io.to(roomCode).emit("game-start", {
      roomCode,
      board: room.board,
      turn: room.turn,
    });

    console.log("Игрок вошёл в комнату:", roomCode);
  });

  socket.on("online-move", ({ roomCode, index, player }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("room-error", "Комната не найдена");
      return;
    }

    const currentPlayer = room.players.find((p) => p.id === socket.id);

    if (!currentPlayer || currentPlayer.symbol !== player) {
      socket.emit("room-error", "Ты не игрок этой комнаты");
      return;
    }

    if (room.turn !== player) {
      socket.emit("room-error", "Сейчас не твой ход");
      return;
    }

    if (typeof index !== "number" || index < 0 || index >= SIZE * SIZE) {
      socket.emit("room-error", "Неверный ход");
      return;
    }

    if (room.board[index]) {
      socket.emit("room-error", "Клетка уже занята");
      return;
    }

    room.board[index] = player;
    room.turn = player === RED ? BLUE : RED;

    io.to(roomCode).emit("move-made", {
      index,
      player,
      board: room.board,
      turn: room.turn,
    });
  });

  socket.on("leave-room", () => {
    const found = getRoomBySocketId(socket.id);

    if (!found) return;

    const [roomCode, room] = found;

    socket.leave(roomCode);

    room.players = room.players.filter((player) => player.id !== socket.id);

    socket.to(roomCode).emit("opponent-left");

    if (room.players.length === 0) {
      delete rooms[roomCode];
      console.log("Комната удалена:", roomCode);
    }
  });

  socket.on("disconnect", () => {
    console.log("Игрок отключился:", socket.id);

    const found = getRoomBySocketId(socket.id);

    if (!found) return;

    const [roomCode, room] = found;

    room.players = room.players.filter((player) => player.id !== socket.id);

    socket.to(roomCode).emit("opponent-left");

    if (room.players.length === 0) {
      delete rooms[roomCode];
      console.log("Комната удалена:", roomCode);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});