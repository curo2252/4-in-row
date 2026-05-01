import { HUMAN } from "../constants";

export default function Board({ board, onCellClick }) {
  return (
    <div className="board">
      {board.map((cell, i) => (
        <div key={i} onClick={() => onCellClick(i)} className="cell">
          {cell && (
            <div className={`piece ${cell === HUMAN ? "red" : "blue"}`} />
          )}
        </div>
      ))}
    </div>
  );
}