import { SIZE, BOT, HUMAN } from "../constants";
import { getCenterScore } from "./evaluate";

export function getCandidateMoves(board, limit) {
  const occupied = board
    .map((cell, index) => (cell ? index : null))
    .filter((index) => index !== null);

  if (occupied.length === 0) return [27, 28, 35, 36];

  const candidates = new Set();

  for (let index of occupied) {
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
          const newIndex = ny * SIZE + nx;

          if (board[newIndex] === null) {
            candidates.add(newIndex);
          }
        }
      }
    }
  }

  return [...candidates]
    .sort((a, b) => movePriority(board, b) - movePriority(board, a))
    .slice(0, limit);
}

function movePriority(board, index) {
  const x = index % SIZE;
  const y = Math.floor(index / SIZE);

  let score = getCenterScore(index) * 4;

  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (let [dx, dy] of dirs) {
    let botNear = 0;
    let humanNear = 0;

    for (let step = -3; step <= 3; step++) {
      if (step === 0) continue;

      const nx = x + dx * step;
      const ny = y + dy * step;

      if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue;

      const cell = board[ny * SIZE + nx];

      if (cell === BOT) botNear++;
      if (cell === HUMAN) humanNear++;
    }

    score += botNear * botNear * 12;
    score += humanNear * humanNear * 18;
  }

  


  return score;
}

export function getEmptyCells(board) {
  return board
    .map((cell, index) => (cell === null ? index : null))
    .filter((index) => index !== null);
}