import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { SAMPLE_BY_ID, STRUCTURES } from "./data/observation";
import {
  applyCellClick,
  isStructureAllowed,
  reviewObservation,
  type AnnotationTool,
  type GridIssue,
  type Marks,
} from "./rules/observationRules";
import {
  DEFAULT_DRAFT,
  loadDraft,
  loadRecords,
  persistDraft,
  persistRecords,
  type DraftState,
  type ObservationRecord,
} from "./storage/localStore";
import { ControlPanel } from "./components/ControlPanel";
import { GridBoard } from "./components/GridBoard";
import { RecordsPanel } from "./components/RecordsPanel";

function formatSavedAt(iso: string): string {
  if (!iso) {
    return "尚未保存";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "已保存";
  }
  return `已自动保存于 ${date.toLocaleString("zh-CN", { hour12: false })}`;
}

function firstAllowedTool(sampleId: string): AnnotationTool {
  const sample = SAMPLE_BY_ID[sampleId];
  const found = STRUCTURES.find((structure) => sample && isStructureAllowed(sample, structure.id));
  return found ? found.id : "erase";
}

function App() {
  // 关掉页面再打开：样本、倍率、格子从本机草稿找回
  const [draft, setDraft] = useState<DraftState>(loadDraft);
  const [records, setRecords] = useState<ObservationRecord[]>(loadRecords);
  const [tool, setTool] = useState<AnnotationTool>(() => firstAllowedTool(draft.sampleId));
  const [issues, setIssues] = useState<GridIssue[]>([]);
  const [notice, setNotice] = useState<{ kind: "info" | "success"; message: string } | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  // 草稿与记录分开存放：观察资料、判断规则之外，本机保存独立成层
  useEffect(() => {
    persistDraft(draft);
  }, [draft]);

  useEffect(() => {
    persistRecords(records);
  }, [records]);

  const sample = SAMPLE_BY_ID[draft.sampleId] ?? SAMPLE_BY_ID[DEFAULT_DRAFT.sampleId];
  const marks: Marks = draft.marksBySample[draft.sampleId] ?? {};

  const savedAtText = useMemo(() => formatSavedAt(draft.savedAt), [draft.savedAt]);

  function flashNotice(message: string, kind: "info" | "success" = "info") {
    setNotice({ kind, message });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4000);
  }

  /** 任何草稿改动都会重新打保存时间，并清掉上一次提交留下的审查提示 */
  function touchDraft(updater: (prev: DraftState) => DraftState) {
    setDraft((prev) => ({ ...updater(prev), savedAt: new Date().toISOString() }));
    setIssues([]);
    setNotice(null);
  }

  function updateSampleMarks(updater: (marks: Marks) => Marks) {
    touchDraft((prev) => ({
      ...prev,
      marksBySample: {
        ...prev.marksBySample,
        [prev.sampleId]: updater(prev.marksBySample[prev.sampleId] ?? {}),
      },
    }));
  }

  function handleSampleChange(sampleId: string) {
    touchDraft((prev) => ({ ...prev, sampleId }));
    // 每个样本的格子互相隔离，并把登记工具切到该样本可观察的第一种结构
    setTool(firstAllowedTool(sampleId));
  }

  function handleMagnificationChange(next: DraftState["magnification"]) {
    touchDraft((prev) => ({ ...prev, magnification: next }));
  }

  function handleCellClick(position: number) {
    const result = applyCellClick(marks, position, tool, draft.magnification);
    if (result.rejected) {
      flashNotice(result.rejected, "info");
      return;
    }
    updateSampleMarks(() => result.next);
  }

  function handleClear() {
    updateSampleMarks(() => ({}));
    flashNotice("已清空当前样本的格子登记（不影响其他样本）。", "info");
  }

  function handleSubmit() {
    const found = reviewObservation(sample.id, draft.magnification, marks);
    if (found.length > 0) {
      // 重点结构为空 / 格位与当前视野无关：提示留在本页，阻断提交
      setIssues(found);
      setNotice(null);
      return;
    }
    const record: ObservationRecord = {
      id: `rec-${Date.now()}`,
      sampleId: sample.id,
      magnification: draft.magnification,
      marks: { ...marks },
      createdAt: new Date().toISOString(),
    };
    setRecords((prev) => [record, ...prev]);
    // 提交后该样本的格子重新开始，但样本与倍率保留
    setDraft((prev) => ({
      ...prev,
      marksBySample: { ...prev.marksBySample, [prev.sampleId]: {} },
      savedAt: new Date().toISOString(),
    }));
    setIssues([]);
    setNotice(null);
    flashNotice("提交成功，可在下方“提交记录筛选”中按样本、倍率和结构回看。", "success");
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <p className="eyebrow">hxwl-06 · 显微镜玻片观察</p>
        <h1>九宫格观察记录</h1>
        <p className="subtitle">
          选定样本与倍率后，点格登记细胞壁、细胞核或纤毛；标注按格位随倍率沿用，样本之间互不混存。
        </p>
      </header>

      <div className="workspace">
        <ControlPanel
          sample={sample}
          magnification={draft.magnification}
          tool={tool}
          onSampleChange={handleSampleChange}
          onMagnificationChange={handleMagnificationChange}
          onToolChange={setTool}
          savedAtText={savedAtText}
        />
        <GridBoard
          sample={sample}
          magnification={draft.magnification}
          marks={marks}
          tool={tool}
          issues={issues}
          successNotice={notice}
          onCellClick={handleCellClick}
          onSubmit={handleSubmit}
          onClear={handleClear}
        />
      </div>

      <RecordsPanel records={records} />
    </main>
  );
}

export default App;
