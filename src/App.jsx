import React, { useState, useEffect } from "react";
import "./App.css";

import { SIZE, BOT, HUMAN } from "./constants";
import Board from "./components/Board";
import { getBestMove } from "./game/bot";
import { checkWinner } from "./game/winner";
import { socket } from "./socket";

export default function FourInRow() {
  const [screen, setScreen] = useState("menu");
  const [board, setBoard] = useState(Array(SIZE * SIZE).fill(null));
  const [isRed, setIsRed] = useState(true);
  const [mode, setMode] = useState(null);

  const [roomCode, setRoomCode] = useState("");
  const [onlinePlayer, setOnlinePlayer] = useState(null);

  const winner = checkWinner(board);

  const winnerText =
    winner === HUMAN
      ? "Игрок 1 выиграл"
      : mode === "bot"
      ? "Бот выиграл"
      : "Игрок 2 выиграл";

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    resetGame();
    setScreen("game");
  };

  const resetGame = () => {
    setBoard(Array(SIZE * SIZE).fill(null));
    setIsRed(true);
  };

  const exitToMenu = () => {
    resetGame();
    setMode(null);
    setRoomCode("");
    setOnlinePlayer(null);
    setScreen("menu");
  };

  const createOnlineRoom = () => {
    socket.emit("create-room");
  };

  const joinOnlineRoom = () => {
    const code = prompt("Введите код комнаты");

    if (code) {
      socket.emit("join-room", code.toUpperCase());
    }
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;

    if (mode === "bot" && !isRed) return;

    if (mode === "online") {
      const currentPlayer = isRed ? HUMAN : BOT;

      if (currentPlayer !== onlinePlayer) return;

      const newBoard = [...board];
      newBoard[index] = onlinePlayer;

      setBoard(newBoard);
      setIsRed(!isRed);

      socket.emit("online-move", {
        roomCode,
        index,
        player: onlinePlayer,
      });

      return;
    }

    const newBoard = [...board];
    newBoard[index] = isRed ? HUMAN : BOT;

    setBoard(newBoard);
    setIsRed(!isRed);
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Подключено:", socket.id);
    });

    socket.on("room-created", ({ roomCode, player }) => {
      console.log("Комната создана:", roomCode, "Ты:", player);
      setRoomCode(roomCode);
      setOnlinePlayer(player);
      setMode("online");
      resetGame();
      setScreen("game");
    });

    socket.on("room-joined", ({ roomCode, player }) => {
      console.log("Ты вошёл в комнату:", roomCode, "Ты:", player);
      setRoomCode(roomCode);
      setOnlinePlayer(player);
      setMode("online");
      resetGame();
      setScreen("game");
    });

    socket.on("game-start", ({ roomCode }) => {
      console.log("Игра началась в комнате:", roomCode);
    });

    socket.on("opponent-move", ({ index, player }) => {
      setBoard((prev) => {
        const newBoard = [...prev];

        if (!newBoard[index]) {
          newBoard[index] = player;
        }

        return newBoard;
      });

      setIsRed((prev) => !prev);
    });

    socket.on("room-error", (message) => {
      alert(message);
    });

    return () => {
      socket.off("connect");
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("game-start");
      socket.off("opponent-move");
      socket.off("room-error");
    };
  }, []);

  useEffect(() => {
    if (mode !== "bot" || isRed || winner) return;

    const timer = setTimeout(() => {
      const move = getBestMove(board);

      setBoard((prev) => {
        const newBoard = [...prev];

        if (move !== null && move !== undefined && !newBoard[move]) {
          newBoard[move] = BOT;
        }

        return newBoard;
      });

      setIsRed(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [mode, isRed, board, winner]);

  return (
    <div className="wrapper">
      {screen === "menu" && (
        <div className="main menu">
          <h1 className="menu-title">Four In Row</h1>

          <button className="menu-button" onClick={() => startGame("bot")}>
            Против бота
          </button>

          <button className="menu-button" onClick={() => startGame("pvp")}>
            1 на 1
          </button>

          <button className="menu-button" onClick={createOnlineRoom}>
            Создать комнату
          </button>

          <button className="menu-button" onClick={joinOnlineRoom}>
            Войти по коду
          </button>
        </div>
      )}

      {screen === "game" && (
        <div className="main game-card">
          <div className="game-header">
            <div className="top-bar">
              <button onClick={resetGame}>↺</button>
              <button onClick={exitToMenu}>✕</button>
            </div>
          </div>

          <div className="game-content">
            <Board board={board} onCellClick={handleClick} />
          </div>

          <div className="game-footer">
            <div className="status-text">
              {winner
                ? winnerText
                : mode === "online"
                ? roomCode
                  ? `Комната: ${roomCode}`
                  : ""
                : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}