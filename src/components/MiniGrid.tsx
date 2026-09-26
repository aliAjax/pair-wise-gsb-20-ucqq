import { STRUCTURE_BY_ID } from "../data/observation";
import type { Marks } from "../rules/observationRules";

/** 记录列表里使用的 3×3 迷你预览，按格位还原提交时的判断 */
export function MiniGrid({ marks }: { marks: Marks }) {
  return (
    <div className="mini-grid" aria-label="提交时的九宫格标注">
      {Array.from({ length: 9 }, (_, position) => {
        const mark = marks[position];
        const structure = mark ? STRUCTURE_BY_ID[mark] : null;
        return (
          <span
            key={position}
            className={structure ? `mini-cell mark-${structure.id}` : "mini-cell"}
            title={structure ? structure.name : "未登记"}
          >
            {structure ? structure.short : ""}
          </span>
        );
      })}
    </div>
  );
}
