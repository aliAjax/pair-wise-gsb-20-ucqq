import { STRUCTURES } from "../data/catalog";
import type { CellIndex, CellMark, GridMarks } from "../data/types";

const CELL_LABELS: Array<[number, number]> = [
  [1, 1], [1, 2], [1, 3],
  [2, 1], [2, 2], [2, 3],
  [3, 1], [3, 2], [3, 3],
];

function markClass(mark: CellMark): string {
  if (mark === null) return "is-empty";
  if (mark === "na") return "is-na";
  return `is-${mark}`;
}

function markText(mark: CellMark): string {
  if (mark === null) return "";
  if (mark === "na") return "视野无关";
  return STRUCTURES[mark].name;
}

interface GridProps {
  marks: GridMarks;
  onCellClick?: (index: CellIndex) => void;
  compact?: boolean;
}

/** 九宫格视野：大格用于登记，compact 迷你格用于已提交记录回看 */
export function ObservationGrid({ marks, onCellClick, compact }: GridProps) {
  const indices = Array.from({ length: 9 }, (_, i) => i as CellIndex);
  return (
    <div
      className={`obs-grid${compact ? " compact" : ""}`}
      role="grid"
      aria-label="九宫格视野标注"
    >
      {indices.map((index) => {
        const mark = marks[index];
        const [row, col] = CELL_LABELS[index];
        return (
          <button
            key={index}
            type="button"
            className={`grid-cell ${markClass(mark)}`}
            onClick={() => onCellClick?.(index)}
            disabled={!onCellClick}
            aria-label={`第${row}行第${col}列：${markText(mark) || "未判断"}`}
            title={mark ? markText(mark) : `第${row}行第${col}列 · 未判断`}
          >
            <span className="cell-pos">
              {row}-{col}
            </span>
            <span className="cell-mark">{markText(mark)}</span>
          </button>
        );
      })}
    </div>
  );
}
