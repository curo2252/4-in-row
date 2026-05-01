import { SIZE } from "../constants";

export function checkWinner(board) {
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const player = board[y * SIZE + x];
      if (!player) continue;

      for (let [dx, dy] of dirs) {
        let count = 1;

        for (let step = 1; step < 4; step++) {
          const nx = x + dx * step;
          const ny = y + dy * step;

          if (
            nx >= 0 &&
            nx < SIZE &&
            ny >= 0 &&
            ny < SIZE &&
            board[ny * SIZE + nx] === player
          ) {
            count++;
          } else {
            break;
          }
        }

        if (count === 4) return player;
      }
    }
  }

  return null;
}