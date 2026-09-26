import {
  getSample,
  MAGNIFICATIONS,
  SAMPLES,
  STRUCTURES,
  STRUCTURE_ORDER,
} from "../data/catalog";
import type { ObservationRecord, StructureId } from "../data/types";
import type { RecordFilter } from "../rules/judgment";
import { ObservationGrid } from "./ObservationGrid";

interface RecordListProps {
  records: ObservationRecord[];
  filter: RecordFilter;
  onFilterChange: (filter: RecordFilter) => void;
  onDelete: (id: string) => void;
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getMonth() + 1}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const ALL = "all";

const SAMPLE_OPTIONS = SAMPLES.map((sample) => (
  <option key={sample.id} value={sample.id}>
    {sample.name}
  </option>
));

export function RecordList({
  records,
  filter,
  onFilterChange,
  onDelete,
}: RecordListProps) {
  const structureOptions: Array<{ value: RecordFilter["structure"]; label: string }> = [
    { value: "", label: "全部结构" },
    ...STRUCTURE_ORDER.map((id: StructureId) => ({
      value: id,
      label: STRUCTURES[id].name,
    })),
    { value: "na", label: "视野无关" },
  ];

  return (
    <section className="panel records-panel">
      <div className="section-heading">
        <div>
          <p>提交后归档</p>
          <h2>视野观察记录（{records.length}）</h2>
        </div>
      </div>

      <div className="filter-bar">
        <label>
          <span>样本</span>
          <select
            value={filter.sampleId}
            onChange={(event) =>
              onFilterChange({ ...filter, sampleId: event.target.value })
            }
          >
            <option value={ALL}>全部样本</option>
            {SAMPLE_OPTIONS}
          </select>
        </label>
        <label>
          <span>倍率</span>
          <select
            value={filter.magnification}
            onChange={(event) =>
              onFilterChange({ ...filter, magnification: event.target.value })
            }
          >
            <option value={ALL}>全部倍率</option>
            {MAGNIFICATIONS.map((mag) => (
              <option key={mag} value={mag}>
                {mag}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>结构</span>
          <select
            value={filter.structure}
            onChange={(event) =>
              onFilterChange({
                ...filter,
                structure: event.target.value as RecordFilter["structure"],
              })
            }
          >
            {structureOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {records.length === 0 ? (
        <p className="empty-tip">当前筛选条件下没有记录。</p>
      ) : (
        <div className="record-grid">
          {records.map((record) => {
            const sample = getSample(record.sampleId);
            return (
              <article key={record.id} className="record-card-v2">
                <header>
                  <div>
                    <h3>{sample.name}</h3>
                    <p className="record-meta">
                      <span className="record-cat">{sample.category}</span>
                      <span>{sample.staining}</span>
                      <span className="record-mag">{record.magnification}</span>
                    </p>
                  </div>
                  <div className="record-side">
                    <time>{formatTime(record.createdAt)}</time>
                    <button
                      type="button"
                      className="link-danger"
                      onClick={() => onDelete(record.id)}
                    >
                      删除
                    </button>
                  </div>
                </header>
                <ObservationGrid marks={record.marks} compact />
                {record.note && <p className="record-note">{record.note}</p>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
