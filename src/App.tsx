import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { ObservationGrid } from "./components/ObservationGrid";
import { RecordList } from "./components/RecordList";
import { ToolPalette } from "./components/ToolPalette";
import {
  emptyGrid,
  getSample,
  MAGNIFICATIONS,
  SAMPLES,
  STRUCTURES,
  STRUCTURE_ORDER,
} from "./data/catalog";
import type {
  CellIndex,
  DraftState,
  GridMarks,
  ObservationRecord,
} from "./data/types";
import {
  allowedTools,
  applyMark,
  evaluateSubmission,
  filterRecords,
  recordContains,
  summarize,
  type RecordFilter,
  type Tool,
} from "./rules/judgment";
import {
  loadDraft,
  loadRecords,
  saveDraft,
  saveRecords,
} from "./storage/local";

const DEFAULT_FILTER: RecordFilter = {
  sampleId: "all",
  magnification: "all",
  structure: "",
};

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function App() {
  // 草稿（样本 / 倍率 / 各样本九格标注 / 备注）与已提交记录都从本机恢复
  const [initialDraft] = useState<DraftState>(() => loadDraft());
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [records, setRecords] = useState<ObservationRecord[]>(() =>
    loadRecords()
  );
  const [tool, setTool] = useState<Tool>(
    () => allowedTools(initialDraft.sampleId)[0]
  );
  const [filter, setFilter] = useState<RecordFilter>(DEFAULT_FILTER);
  const [submittedFlash, setSubmittedFlash] = useState(false);

  // 本机保存：任何录入变化即时写入，关掉再打开可找回现场
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const sample = getSample(draft.sampleId);
  const grid: GridMarks = draft.annotationsBySample[draft.sampleId];
  const tools = useMemo(
    () => allowedTools(draft.sampleId),
    [draft.sampleId]
  );
  const summary = useMemo(() => summarize(grid), [grid]);
  const issues = useMemo(() => evaluateSubmission(grid), [grid]);
  const hasBlock = issues.some((issue) => issue.level === "block");
  const filteredRecords = useMemo(
    () => filterRecords(records, filter),
    [records, filter]
  );

  // 指标由真实数据计算
  const structureTotal = records.reduce(
    (total, record) => total + summarize(record.marks).markedCount,
    0
  );
  const sampleCount = new Set(records.map((record) => record.sampleId)).size;

  function selectSample(sampleId: string) {
    setDraft((prev) => ({ ...prev, sampleId }));
    // 不同样本的可登记结构不同，工具盘回到该样本的第一个合法结构，
    // 血液涂片因此不可能选到细胞壁 / 纤毛
    setTool(allowedTools(sampleId)[0]);
  }

  function selectMagnification(magnification: string) {
    // 只改倍率：原标注按格位沿用，不清空、不重排
    setDraft((prev) => ({ ...prev, magnification }));
  }

  function markCell(index: CellIndex) {
    setSubmittedFlash(false);
    setDraft((prev) => ({
      ...prev,
      annotationsBySample: {
        ...prev.annotationsBySample,
        [prev.sampleId]: applyMark(
          prev.annotationsBySample[prev.sampleId],
          index,
          tool
        ),
      },
    }));
  }

  function clearGrid() {
    setSubmittedFlash(false);
    setDraft((prev) => ({
      ...prev,
      annotationsBySample: {
        ...prev.annotationsBySample,
        [prev.sampleId]: emptyGrid(),
      },
    }));
  }

  function submitRecord() {
    if (hasBlock) return; // 重点结构为空时留在本页，由提示区说明原因
    const record: ObservationRecord = {
      id: createId(),
      sampleId: draft.sampleId,
      magnification: draft.magnification,
      marks: grid, // 快照：倍率变化沿用的是草稿格，已提交记录不受后续改动影响
      note: draft.note.trim(),
      createdAt: Date.now(),
    };
    setRecords((prev) => [record, ...prev]);
    setSubmittedFlash(true);
  }

  function deleteRecord(id: string) {
    setRecords((prev) => prev.filter((record) => record.id !== id));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">hxwl-06 · port 5106</p>
          <h1>显微镜九宫格观察记录</h1>
          <p className="subtitle">
            选定样本与倍率后，在 3×3 视野格上逐格登记细胞壁、细胞核或纤毛；
            同一格只保留一种判断，倍率切换时标注按位置沿用。
          </p>
        </div>
        <div className="stack-card">
          <span>分层组织</span>
          <strong>观察资料 · 判断规则 · 本机保存</strong>
          <span>关闭页面后再次打开，样本、倍率与九格标注自动找回</span>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="样本数" value={String(sampleCount)} />
        <MetricCard label="视野记录" value={String(records.length)} />
        <MetricCard label="结构登记总数" value={String(structureTotal)} />
        <MetricCard
          label="本视野已判格位"
          value={`${summary.markedCount}/9`}
        />
      </section>

      <section className="workspace">
        <aside className="panel narrow">
          <h2>① 选择样本</h2>
          <div className="sample-list">
            {SAMPLES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sample-option${
                  item.id === draft.sampleId ? " active" : ""
                }`}
                onClick={() => selectSample(item.id)}
              >
                <strong>{item.name}</strong>
                <span>
                  {item.category} · {item.staining}
                </span>
              </button>
            ))}
          </div>

          <h2>② 选择倍率</h2>
          <div className="mag-chips">
            {MAGNIFICATIONS.map((mag) => (
              <button
                key={mag}
                type="button"
                className={mag === draft.magnification ? "active" : ""}
                onClick={() => selectMagnification(mag)}
              >
                {mag}
              </button>
            ))}
          </div>
          <p className="side-note">切换倍率不清空标注，九格判断按原位置沿用。</p>
        </aside>

        <section className="panel stage-panel">
          <div className="section-heading">
            <div>
              <p>
                {sample.category} · {sample.staining}
              </p>
              <h2>
                {sample.name} · {draft.magnification} 视野九宫格
              </h2>
            </div>
            <div className="heading-actions">
              <button type="button" onClick={clearGrid}>
                清空本样本标注
              </button>
            </div>
          </div>

          <div className="stage-layout">
            <ObservationGrid marks={grid} onCellClick={markCell} />

            <div className="stage-side">
              <h3>③ 选择判断，再点格位登记</h3>
              <ToolPalette tools={tools} active={tool} onSelect={setTool} />
              <p className="side-note">
                再点同一格可取消；格内已有其他判断时，新判断直接替换，每格只留一种。
              </p>

              <div className="grid-summary">
                {STRUCTURE_ORDER.filter((id) =>
                  sample.allowedStructures.includes(id)
                ).map((id) => (
                  <span key={id} className={`summary-chip chip-${id}`}>
                    {STRUCTURES[id].name} {summary.structureCounts[id]}
                  </span>
                ))}
                <span className="summary-chip chip-na">
                  视野无关 {summary.naCount}
                </span>
                <span className="summary-chip">未判断 {summary.emptyCount}</span>
              </div>

              <label className="note-field">
                <span>本视野备注（可选）</span>
                <textarea
                  rows={3}
                  placeholder="补充整段描述，位置问题请看九格标注"
                  value={draft.note}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, note: event.target.value }))
                  }
                />
              </label>

              <button
                type="button"
                className="primary-action"
                disabled={hasBlock}
                onClick={submitRecord}
              >
                提交本视野记录
              </button>

              <div className="issue-list" aria-live="polite">
                {issues.map((issue) => (
                  <p key={issue.text} className={`issue issue-${issue.level}`}>
                    {issue.level === "block" ? "⛔ " : "ℹ️ "}
                    {issue.text}
                  </p>
                ))}
                {submittedFlash && !hasBlock && (
                  <p className="issue issue-ok">
                    ✅ 已提交，可在下方按样本、倍率和结构筛选回看。
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>

      <RecordList
        records={filteredRecords}
        filter={filter}
        onFilterChange={setFilter}
        onDelete={deleteRecord}
      />

      <footer className="page-footer">
        {STRUCTURE_ORDER.map((id) => (
          <span key={id} className={`legend chip-${id}`}>
            {STRUCTURES[id].name}
          </span>
        ))}
        <span className="legend chip-na">与视野无关</span>
        <span className="legend">
          已提交 {records.length} 份 · 含“视野无关”标记{" "}
          {records.filter((record) => recordContains(record, "na")).length} 份
        </span>
      </footer>
    </main>
  );
}

export default App;
