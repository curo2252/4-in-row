import React, { useState, useEffect } from "react";
import "./App.css";

import { SIZE, BOT, HUMAN } from "./constants";
import Board from "./components/Board";
import { getBestMove } from "./game/bot";
import { checkWinner } from "./game/winner";

export default function FourInRow() {
  const [screen, setScreen] = useState("menu");
  const [board, setBoard] = useState(Array(SIZE * SIZE).fill(null));
  const [isRed, setIsRed] = useState(true);
  const [mode, setMode] = useState(null);

  const winner = checkWinner(board);

  const winnerText =
    winner === HUMAN
      ? "Игрок 1 выиграл"
      : mode === "bot"
      ? "Бот выиграл"
      : "Игрок 2 выиграл";

  const startGame = (selectedMode) => {
    if (selectedMode === "online") {
      alert("Онлайн режим скоро будет доступен");
      return;
    }

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
    setScreen("menu");
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;
    if (mode === "bot" && !isRed) return;

    const newBoard = [...board];
    newBoard[index] = isRed ? HUMAN : BOT;

    setBoard(newBoard);
    setIsRed(!isRed);
  };

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

          <button className="menu-button" onClick={() => startGame("online")}>
            По сети
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
                  {winner ? winnerText : ""}
                </div>
              </div>
            </div>
          )}
      
      
    </div>
  );
}