import { SIZE, BOT, HUMAN, AI_DEPTH } from "../constants";
import { checkWinner } from "./winner";
import { evaluateBoard } from "./evaluate";
import { getCandidateMoves, getEmptyCells } from "./utils";

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getWinningMoves(board, player) {
  const empty = getEmptyCells(board);
  const wins = [];

  for (let move of empty) {
    const test = [...board];
    test[move] = player;

    if (checkWinner(test) === player) {
      wins.push(move);
    }
  }

  return wins;
}

function createsDoubleThreat(board, move, player) {
  const test = [...board];
  test[move] = player;

  return getWinningMoves(test, player).length >= 2;
}

function opponentCanForceWin(board) {
  const humanMoves = getCandidateMoves(board, 12);

  for (let move of humanMoves) {
    const test = [...board];
    test[move] = HUMAN;

    if (checkWinner(test) === HUMAN) {
      return true;
    }

    const wins = getWinningMoves(test, HUMAN);

    if (wins.length >= 2) {
      return true;
    }
  }

  return false;
}

export function getBestMove(board) {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return null;

  if (empty.length === SIZE * SIZE) {
    return randomFrom([27, 28, 35, 36]);
  }

  for (let move of empty) {
    const test = [...board];
    test[move] = BOT;
    if (checkWinner(test) === BOT) return move;
  }

  for (let move of empty) {
    const test = [...board];
    test[move] = HUMAN;
    if (checkWinner(test) === HUMAN) return move;
  }

  for (let move of empty) {
    if (createsDoubleThreat(board, move, BOT)) {
      return move;
    }
  }

  for (let move of empty) {
    if (createsDoubleThreat(board, move, HUMAN)) {
      return move;
    }
  }

  const cache = new Map();
  const moves = getCandidateMoves(board, 16);

  let bestScore = -Infinity;
  let scoredMoves = [];

  for (let move of moves) {
    const newBoard = [...board];
    newBoard[move] = BOT;

    let score = minimax(
      newBoard,
      AI_DEPTH - 1,
      false,
      -Infinity,
      Infinity,
      cache
    );

    if (createsDoubleThreat(board, move, BOT)) {
      score += 7000;
    }

    if (opponentCanForceWin(newBoard)) {
      score -= 15000;
    }

    const humanDanger = getCandidateMoves(newBoard, 12).some((humanMove) =>
      createsDoubleThreat(newBoard, humanMove, HUMAN)
    );

    if (humanDanger) {
      score -= 7000;
    }

    scoredMoves.push({ move, score });

    if (score > bestScore) {
      bestScore = score;
    }
  }

  const goodMoves = scoredMoves
    .filter((item) => bestScore - item.score <= 20)
    .map((item) => item.move);

  return randomFrom(goodMoves);
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

  const moves = getCandidateMoves(board, depth >= 3 ? 10 : 7);

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