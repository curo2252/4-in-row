import { SIZE, BOT, HUMAN, AI_DEPTH } from "../constants";
import { checkWinner } from "./winner";
import { evaluateBoard } from "./evaluate";
import { getCandidateMoves, getEmptyCells } from "./utils";

export function getBestMove(board) {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return null;

  if (empty.length === SIZE * SIZE) return 27;

  // 1. если бот может выиграть — сразу ходит
  for (let move of empty) {
    const test = [...board];
    test[move] = BOT;
    if (checkWinner(test) === BOT) return move;
  }

  // 2. если игрок может выиграть — сразу блокируем
  for (let move of empty) {
    const test = [...board];
    test[move] = HUMAN;
    if (checkWinner(test) === HUMAN) return move;
  }

  const cache = new Map();

  // было 14, потом 10 — оставляем 10
  const moves = getCandidateMoves(board, 10);

  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (let move of moves) {
    const newBoard = [...board];
    newBoard[move] = BOT;

    const score = minimax(
      newBoard,
      AI_DEPTH - 1,
      false,
      -Infinity,
      Infinity,
      cache
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(board, depth, isBotTurn, alpha, beta, cache) {
  const key =
    board.map((c) => c || "-").join("") + "|" + depth + "|" + isBotTurn;

  if (cache.has(key)) return cache.get(key);

  const winner = checkWinner(board);

  if (winner === BOT) return 100000 + depth;
  if (winner === HUMAN) return -100000 - depth;

  if (depth === 0) {
    const value = evaluateBoard(board);
    cache.set(key, value);
    return value;
  }

  // чем глубже, тем меньше вариантов смотрим
  const moves = getCandidateMoves(board, depth >= 3 ? 7 : 4);

  if (moves.length === 0) {
    const value = evaluateBoard(board);
    cache.set(key, value);
    return value;
  }

  let bestScore;

  if (isBotTurn) {
    bestScore = -Infinity;

    for (let move of moves) {
      const newBoard = [...board];
      newBoard[move] = BOT;

      const score = minimax(
        newBoard,
        depth - 1,
        false,
        alpha,
        beta,
        cache
      );

      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);

      if (beta <= alpha) break;
    }
  } else {
    bestScore = Infinity;

    for (let move of moves) {
      const newBoard = [...board];
      newBoard[move] = HUMAN;

      const score = minimax(
        newBoard,
        depth - 1,
        true,
        alpha,
        beta,
        cache
      );

      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, score);

      if (beta <= alpha) break;
    }
  }

  cache.set(key, bestScore);
  return bestScore;
}