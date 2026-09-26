import { useMemo, useState } from "react";
import {
  MAGNIFICATIONS,
  MAGNIFICATION_BY_ID,
  SAMPLES,
  SAMPLE_BY_ID,
  STRUCTURES,
  STRUCTURE_BY_ID,
  type MagnificationId,
  type StructureId,
} from "../data/observation";
import type { ObservationRecord } from "../storage/localStore";
import { MiniGrid } from "./MiniGrid";

interface RecordsPanelProps {
  records: ObservationRecord[];
}

type SampleFilter = string; // "all" 或样本 id
type MagnificationFilter = "all" | MagnificationId;
type StructureFilter = "all" | StructureId;

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

export function RecordsPanel({ records }: RecordsPanelProps) {
  const [sampleFilter, setSampleFilter] = useState<SampleFilter>("all");
  const [magnificationFilter, setMagnificationFilter] = useState<MagnificationFilter>("all");
  const [structureFilter, setStructureFilter] = useState<StructureFilter>("all");

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        if (sampleFilter !== "all" && record.sampleId !== sampleFilter) {
          return false;
        }
        if (magnificationFilter !== "all" && record.magnification !== magnificationFilter) {
          return false;
        }
        if (structureFilter !== "all" && !Object.values(record.marks).includes(structureFilter)) {
          return false;
        }
        return true;
      }),
    [records, sampleFilter, magnificationFilter, structureFilter],
  );

  return (
    <section className="panel records-panel" aria-label="已提交观察记录">
      <div className="panel-head">
        <div>
          <p className="eyebrow">第三步 · 回看</p>
          <h2>提交记录筛选</h2>
        </div>
        <span className="mark-count">
          {filtered.length}/{records.length} 条
        </span>
      </div>

      <div className="filter-grid">
        <label className="field">
          <span>按样本</span>
          <select value={sampleFilter} onChange={(event) => setSampleFilter(event.target.value)}>
            <option value="all">全部样本</option>
            {SAMPLES.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>按倍率</span>
          <select
            value={magnificationFilter}
            onChange={(event) => setMagnificationFilter(event.target.value as MagnificationFilter)}
          >
            <option value="all">全部倍率</option>
            {MAGNIFICATIONS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>按重点结构</span>
          <select
            value={structureFilter}
            onChange={(event) => setStructureFilter(event.target.value as StructureFilter)}
          >
            <option value="all">全部结构</option>
            {STRUCTURES.map((structure) => (
              <option key={structure.id} value={structure.id}>
                {structure.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-tip">
          {records.length === 0
            ? "还没有提交过观察记录。在九宫格登记重点结构后点击“提交本次观察”。"
            : "当前筛选条件下没有记录，请调整样本 / 倍率 / 结构条件。"}
        </p>
      ) : (
        <ul className="record-list">
          {filtered.map((record) => {
            const sample = SAMPLE_BY_ID[record.sampleId];
            const counts = STRUCTURES.map((structure) => ({
              structure,
              count: Object.values(record.marks).filter((mark) => mark === structure.id).length,
            })).filter((entry) => entry.count > 0);
            return (
              <li key={record.id} className="record-item">
                <MiniGrid marks={record.marks} />
                <div className="record-body">
                  <h3>{sample?.name ?? record.sampleId}</h3>
                  <p className="record-time">{formatTime(record.createdAt)}</p>
                  <div className="record-chips">
                    <span className="chip chip-type">{sample?.typeLabel ?? "未知样本"}</span>
                    <span className="chip">
                      {MAGNIFICATION_BY_ID[record.magnification]?.label ?? record.magnification}
                    </span>
                    {counts.map(({ structure, count }) => (
                      <span key={structure.id} className={`chip chip-mark mark-${structure.id}`}>
                        {structure.name} × {count}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {structureFilter !== "all" && (
        <p className="filter-hint">
          只显示格子中登记过「{STRUCTURE_BY_ID[structureFilter as StructureId].name}」的记录。
        </p>
      )}
    </section>
  );
}
