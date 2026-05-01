import { SIZE, BOT, HUMAN } from "../constants";

export function evaluateBoard(board) {
  let score = 0;

  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      for (let [dx, dy] of dirs) {
        const cells = [];

        for (let step = 0; step < 4; step++) {
          const nx = x + dx * step;
          const ny = y + dy * step;

          if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) {
            cells.length = 0;
            break;
          }

          cells.push(board[ny * SIZE + nx]);
        }

        if (cells.length === 4) score += evaluateLine(cells);
      }
    }
  }

  score += centerControl(board);
  return score;
}

function evaluateLine(cells) {
  const botCount = cells.filter((c) => c === BOT).length;
  const humanCount = cells.filter((c) => c === HUMAN).length;
  const emptyCount = cells.filter((c) => c === null).length;

  if (botCount > 0 && humanCount > 0) return 0;

  if (botCount === 4) return 100000;
  if (botCount === 3 && emptyCount === 1) return 1400;
  if (botCount === 2 && emptyCount === 2) return 150;
  if (botCount === 1 && emptyCount === 3) return 10;

  if (humanCount === 4) return -100000;
  if (humanCount === 3 && emptyCount === 1) return -1800;
  if (humanCount === 2 && emptyCount === 2) return -200;
  if (humanCount === 1 && emptyCount === 3) return -12;

  return 0;
}

function centerControl(board) {
  let score = 0;

  for (let i = 0; i < board.length; i++) {
    if (!board[i]) continue;

    const value = getCenterScore(i);

    if (board[i] === BOT) score += value;
    if (board[i] === HUMAN) score -= value;
  }

  return score;
}

export function getCenterScore(index) {
  const x = index % SIZE;
  const y = Math.floor(index / SIZE);
  const center = (SIZE - 1) / 2;

  return 10 - (Math.abs(x - center) + Math.abs(y - center));
}