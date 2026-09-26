// ===== 本机保存层：只管 localStorage 读写，与观察资料、判断规则分开组织 =====
// 关闭页面再打开时，凭这里恢复“刚录的样本、倍率和格子”。

import {
  createInitialDraft,
  emptyGrid,
  SEED_RECORDS,
} from "../data/catalog";
import type {
  CellIndex,
  DraftState,
  GridMarks,
  ObservationRecord,
} from "../data/types";

const STORAGE_VERSION = "v1";
const DRAFT_KEY = `hxwl-06:${STORAGE_VERSION}:draft`;
const RECORDS_KEY = `hxwl-06:${STORAGE_VERSION}:records`;

function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    // 本机数据损坏时不应拖垮页面，按无数据处理
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 隐私模式 / 配额超限时静默失败，不影响当页录入
  }
}

function sanitizeGrid(value: unknown): GridMarks {
  const fallback = emptyGrid();
  if (typeof value !== "object" || value === null) return fallback;
  for (let i = 0; i < 9; i += 1) {
    const mark = (value as Record<string, unknown>)[String(i)];
    if (
      mark === "cell-wall" ||
      mark === "nucleus" ||
      mark === "cilia" ||
      mark === "na" ||
      mark === null
    ) {
      fallback[i as CellIndex] = mark;
    }
  }
  return fallback;
}

export function loadDraft(): DraftState {
  const initial = createInitialDraft();
  const saved = readJSON<Partial<DraftState>>(DRAFT_KEY);
  if (!saved) return initial;

  // 只恢复已知样本；标注按样本维度逐个消毒，避免跨样本脏数据
  const annotationsBySample = { ...initial.annotationsBySample };
  if (
    typeof saved.annotationsBySample === "object" &&
    saved.annotationsBySample !== null
  ) {
    for (const key of Object.keys(annotationsBySample)) {
      const grid = (saved.annotationsBySample as Record<string, unknown>)[key];
      if (grid !== undefined) {
        annotationsBySample[key as keyof typeof annotationsBySample] =
          sanitizeGrid(grid);
      }
    }
  }

  return {
    sampleId:
      typeof saved.sampleId === "string" &&
      saved.sampleId in annotationsBySample
        ? saved.sampleId
        : initial.sampleId,
    magnification:
      typeof saved.magnification === "string"
        ? saved.magnification
        : initial.magnification,
    annotationsBySample,
    note: typeof saved.note === "string" ? saved.note : "",
  };
}

export function saveDraft(draft: DraftState): void {
  writeJSON(DRAFT_KEY, draft);
}

export function loadRecords(): ObservationRecord[] {
  const saved = readJSON<ObservationRecord[]>(RECORDS_KEY);
  if (!saved) return SEED_RECORDS;
  if (!Array.isArray(saved)) return SEED_RECORDS;
  return saved.map((record) => ({
    id: String(record.id),
    sampleId: String(record.sampleId),
    magnification: String(record.magnification),
    marks: sanitizeGrid(record.marks),
    note: typeof record.note === "string" ? record.note : "",
    createdAt:
      typeof record.createdAt === "number" ? record.createdAt : Date.now(),
  }));
}

export function saveRecords(records: ObservationRecord[]): void {
  writeJSON(RECORDS_KEY, records);
}
