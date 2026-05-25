import React, { useState, useEffect, useRef } from "react";
import "./App.css";

import { SIZE, BOT, HUMAN } from "./constants";
import Board from "./components/Board";
import { getBestMove } from "./game/bot";
import { checkWinner } from "./game/winner";
import { socket } from "./socket";

let bgAudio = null;

export default function FourInRow() {
  const [screen, setScreen] = useState("menu");
  const [board, setBoard] = useState(Array(SIZE * SIZE).fill(null));
  const [isRed, setIsRed] = useState(true);
  const [mode, setMode] = useState(null);

  const [roomCode, setRoomCode] = useState("");
  const [onlinePlayer, setOnlinePlayer] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineMessage, setOnlineMessage] = useState("");

  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);

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
    setJoinCode("");
    setOnlineLoading(false);
    setOnlineMessage("");
    setScreen("menu");
  };

  const createOnlineRoom = () => {
    setOnlineLoading(true);
    setOnlineMessage("Создаём комнату...");
    socket.emit("create-room");
  };

  const joinOnlineRoom = () => {
    if (!joinCode.trim()) {
      setOnlineMessage("Введите код комнаты");
      return;
    }

    setOnlineLoading(true);
    setOnlineMessage("Подключаемся...");
    socket.emit("join-room", joinCode.trim().toUpperCase());
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;

    if (mode === "bot" && !isRed) return;

    if (mode === "online") {
      const currentPlayer = isRed ? HUMAN : BOT;

      if (currentPlayer !== onlinePlayer) return;

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
    if (!bgAudio) {
      bgAudio = new Audio("/audio/background.mp3");
      bgAudio.loop = true;
      bgAudio.volume = 0.03;
    }

    audioRef.current = bgAudio;
    setMuted(bgAudio.paused);

    const startMusic = async () => {
      if (!bgAudio || !bgAudio.paused) return;

      try {
        await bgAudio.play();
        setMuted(false);
      } catch (e) {
        console.log("Autoplay blocked");
      }
    };

    startMusic();

    return () => {};
    }, []);
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Подключено:", socket.id);
    });

    socket.on("room-created", ({ roomCode, player, board, turn }) => {
      console.log("Комната создана:", roomCode, "Ты:", player);

      setRoomCode(roomCode);
      setOnlinePlayer(player);
      setMode("online");
      setBoard(board || Array(SIZE * SIZE).fill(null));
      setIsRed(turn ? turn === HUMAN : true);
      setOnlineLoading(false);
      setOnlineMessage("Ожидание второго игрока...");
      setScreen("game");
    });

    socket.on("room-joined", ({ roomCode, player, board, turn }) => {
      console.log("Ты вошёл в комнату:", roomCode, "Ты:", player);

      setRoomCode(roomCode);
      setOnlinePlayer(player);
      setMode("online");
      setBoard(board || Array(SIZE * SIZE).fill(null));
      setIsRed(turn ? turn === HUMAN : true);
      setOnlineLoading(false);
      setOnlineMessage("");
      setScreen("game");
    });

    socket.on("game-start", ({ roomCode, board, turn }) => {
      console.log("Игра началась в комнате:", roomCode);

      if (board) setBoard(board);
      if (turn) setIsRed(turn === HUMAN);
      setOnlineMessage("");
    });

    socket.on("move-made", ({ board, turn }) => {
      setBoard(board);
      setIsRed(turn === HUMAN);
    });

    socket.on("opponent-left", () => {
      setOnlineMessage("Соперник вышел из комнаты");
    });

    socket.on("room-error", (message) => {
      setOnlineLoading(false);
      setOnlineMessage(message);
    });

    return () => {
      socket.off("connect");
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("game-start");
      socket.off("move-made");
      socket.off("opponent-left");
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

          <div className="online-panel">
            <button
              className="menu-button"
              onClick={createOnlineRoom}
              disabled={onlineLoading}
            >
              {onlineLoading ? "Подождите..." : "Создать комнату"}
            </button>

            <input
              className="room-input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="КОД КОМНАТЫ"
              maxLength={5}
              disabled={onlineLoading}
            />

            <button
              className="menu-button"
              onClick={joinOnlineRoom}
              disabled={onlineLoading}
            >
              Войти
            </button>

            {onlineMessage && (
              <div className="online-message">{onlineMessage}</div>
            )}
          </div>
        </div>
      )}

      {screen === "game" && (
        <div className="main game-card">
          <div className="game-header">
            <div className="top-bar">
              <button
                onClick={(e) => {
                  e.stopPropagation();

                  if (!audioRef.current) return;

                  if (audioRef.current.paused) {
                    audioRef.current.play().then(() => {
                      setMuted(false);
                    }).catch(() => {});
                  } else {
                    audioRef.current.pause();
                    setMuted(true);
                  }
                }}
              >
                {muted ? "🔇" : "🔊"}
              </button>

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
                  ? `Комната: ${roomCode}${onlineMessage ? ` — ${onlineMessage}` : ""}`
                  : onlineMessage
                : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}