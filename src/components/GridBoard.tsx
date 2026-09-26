import { useEffect, useState } from "react";
import {
  MAGNIFICATION_BY_ID,
  MAGNIFICATIONS,
  STRUCTURE_BY_ID,
  type MagnificationId,
  type Sample,
} from "../data/observation";
import {
  isPositionInView,
  outOfViewMarks,
  highestMagnificationCovering,
  type AnnotationTool,
  type GridIssue,
  type Marks,
} from "../rules/observationRules";

interface GridBoardProps {
  sample: Sample;
  magnification: MagnificationId;
  marks: Marks;
  tool: AnnotationTool;
  issues: GridIssue[];
  successNotice: { kind: "info" | "success"; message: string } | null;
  onCellClick: (position: number) => void;
  onSubmit: () => void;
  onClear: () => void;
}

const ROW_LABELS = ["上排", "中排", "下排"];

export function GridBoard({
  sample,
  magnification,
  marks,
  tool,
  issues,
  successNotice,
  onCellClick,
  onSubmit,
  onClear,
}: GridBoardProps) {
  const [armed, setArmed] = useState(false);

  // 格子一旦变化，取消“确认清空”的待发状态
  useEffect(() => {
    setArmed(false);
  }, [marks]);

  useEffect(() => {
    if (!armed) {
      return;
    }
    const timer = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  const outside = outOfViewMarks(marks, magnification);
  const outsidePositions = Object.keys(outside)
    .map((key) => Number(key))
    .sort((a, b) => a - b);
  const coverId = highestMagnificationCovering(marks);
  const markedCount = Object.keys(marks).length;

  return (
    <section className="panel grid-board" aria-label="九宫格观察记录">
      <div className="panel-head">
        <div>
          <p className="eyebrow">第二步</p>
          <h2>
            {sample.name} · {MAGNIFICATION_BY_ID[magnification].label} 视野九宫格
          </h2>
        </div>
        <span className="mark-count">已登记 {markedCount}/9 格</span>
      </div>

      {outsidePositions.length > 0 && (
        <div className="notice notice-info" role="status">
          <strong>低倍率标注已按位置沿用：</strong>
          {outsidePositions.map((position) => position + 1).join("、")} 格不在当前
          {MAGNIFICATION_BY_ID[magnification].label}视野内，标注仍保留；
          {coverId ? `切到 ${MAGNIFICATION_BY_ID[coverId].label} 可查看全部已标格位。` : ""}
          可用橡皮擦清除视野外标注。
        </div>
      )}

      {issues.map((issue, index) => (
        <div key={index} className={`notice notice-${issue.kind}`} role="alert">
          {issue.kind === "error" ? "无法提交：" : issue.kind === "warning" ? "请先处理：" : "提示："}
          {issue.message}
        </div>
      ))}

      {successNotice && (
        <div className={`notice notice-${successNotice.kind}`} role="status">
          {successNotice.message}
        </div>
      )}

      <div className={`grid-grid tool-cursor-${tool}`}>
        {Array.from({ length: 9 }, (_, position) => {
          const mark = marks[position];
          const structure = mark ? STRUCTURE_BY_ID[mark] : null;
          const inView = isPositionInView(position, magnification);
          const row = Math.floor(position / 3);
          const col = position % 3;
          const classNames = [
            "grid-cell",
            structure ? `mark-${structure.id}` : "",
            inView ? "in-view" : "out-of-view",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={position}
              type="button"
              className={classNames}
              aria-label={`第 ${position + 1} 格（${ROW_LABELS[row]}第 ${col + 1} 列）${
                structure ? `：${structure.name}` : "，未登记"
              }${inView ? "" : "，不在当前视野"}`}
              title={inView ? undefined : "不在当前视野，不能新登记（可擦除沿用标注）"}
              onClick={() => onCellClick(position)}
            >
              <span className="cell-no">{position + 1}</span>
              {structure && <span className="cell-mark">{structure.short}</span>}
              {!inView && <span className="cell-fov">视野外</span>}
            </button>
          );
        })}
      </div>

      <div className="magnification-strip">
        {MAGNIFICATIONS.map((entry) => (
          <span
            key={entry.id}
            className={entry.id === magnification ? "is-current" : ""}
            title={entry.detail}
          >
            {entry.label} 视野 {entry.view.length} 格
          </span>
        ))}
      </div>

      <div className="submit-bar">
        <button type="button" className="primary-action" onClick={onSubmit}>
          提交本次观察
        </button>
        <button
          type="button"
          className={armed ? "clear-button is-armed" : "clear-button"}
          onClick={() => {
            if (armed) {
              onClear();
            } else {
              setArmed(true);
            }
          }}
        >
          {armed ? "再次点击确认清空本样本格子" : "清空本样本格子"}
        </button>
      </div>
    </section>
  );
}
