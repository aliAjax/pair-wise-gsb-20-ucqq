// 本机保存层：草稿（样本、倍率、格子）与已提交记录的 localStorage 读写。
// 与观察资料、判断规则分开组织；所有解析都做容错，坏数据退回默认值。

import {
  MAGNIFICATION_IDS,
  SAMPLES,
  STRUCTURE_IDS,
  type MagnificationId,
  type StructureId,
} from "../data/observation";
import type { Marks } from "../rules/observationRules";

/** 按样本隔离：草稿每个样本各存一份格子，血液涂片的标注不会混进植物组织 */
export interface DraftState {
  sampleId: string;
  magnification: MagnificationId;
  marksBySample: Record<string, Marks>;
  savedAt: string;
}

export interface ObservationRecord {
  id: string;
  sampleId: string;
  magnification: MagnificationId;
  marks: Marks;
  createdAt: string;
}

const STORAGE_VERSION = "v1";
const DRAFT_KEY = `hxwl-06:grid-draft:${STORAGE_VERSION}`;
const RECORDS_KEY = `hxwl-06:observation-records:${STORAGE_VERSION}`;

export const DEFAULT_DRAFT: DraftState = {
  sampleId: SAMPLES[0].id,
  magnification: "100x",
  marksBySample: {},
  savedAt: "",
};

/** localStorage 被禁用或不可访问时的会话内兜底，保证当前会话功能可用 */
const memoryFallback = new Map<string, string>();

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // 访问被拒绝（如沙箱 iframe），走内存兜底
  }
  return null;
}

function readRaw(key: string): string | null {
  try {
    const storage = getStorage();
    if (storage) {
      return storage.getItem(key);
    }
  } catch {
    // 读取异常时用内存兜底
  }
  return memoryFallback.has(key) ? memoryFallback.get(key)! : null;
}

function writeRaw(key: string, value: string): void {
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(key, value);
      return;
    }
  } catch {
    // 写入异常时用内存兜底
  }
  memoryFallback.set(key, value);
}

function readJSON(key: string): unknown {
  const raw = readRaw(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  writeRaw(key, JSON.stringify(value));
}

function asMagnification(value: unknown): MagnificationId | null {
  return typeof value === "string" && MAGNIFICATION_IDS.includes(value as MagnificationId)
    ? (value as MagnificationId)
    : null;
}

function asStructureId(value: unknown): StructureId | null {
  return typeof value === "string" && STRUCTURE_IDS.includes(value as StructureId)
    ? (value as StructureId)
    : null;
}

/** 清洗一份格子数据，只接受 0–8 的格位键和合法结构值 */
export function normalizeMarks(value: unknown): Marks {
  if (!value || typeof value !== "object") {
    return {};
  }
  const marks: Marks = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
    const position = Number(key);
    const structureId = asStructureId(raw);
    if (Number.isInteger(position) && position >= 0 && position <= 8 && structureId) {
      marks[position] = structureId;
    }
  });
  return marks;
}

export function loadDraft(): DraftState {
  const data = readJSON(DRAFT_KEY);
  if (!data || typeof data !== "object") {
    return DEFAULT_DRAFT;
  }
  const source = data as Record<string, unknown>;
  const sampleId =
    typeof source.sampleId === "string" && SAMPLES.some((sample) => sample.id === source.sampleId)
      ? source.sampleId
      : DEFAULT_DRAFT.sampleId;
  const magnification = asMagnification(source.magnification) ?? DEFAULT_DRAFT.magnification;

  const marksBySample: Record<string, Marks> = {};
  const rawMap = source.marksBySample;
  if (rawMap && typeof rawMap === "object") {
    Object.entries(rawMap as Record<string, unknown>).forEach(([key, raw]) => {
      marksBySample[key] = normalizeMarks(raw);
    });
  }

  return {
    sampleId,
    magnification,
    marksBySample,
    savedAt: typeof source.savedAt === "string" ? source.savedAt : "",
  };
}

export function persistDraft(draft: DraftState): DraftState {
  const stamped: DraftState = { ...draft, savedAt: new Date().toISOString() };
  writeJSON(DRAFT_KEY, stamped);
  return stamped;
}

export function loadRecords(): ObservationRecord[] {
  const data = readJSON(RECORDS_KEY);
  if (!Array.isArray(data)) {
    return [];
  }
  const records: ObservationRecord[] = [];
  data.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }
    const source = entry as Record<string, unknown>;
    const sampleId =
      typeof source.sampleId === "string" && SAMPLES.some((sample) => sample.id === source.sampleId)
        ? source.sampleId
        : null;
    const magnification = asMagnification(source.magnification);
    if (!source.id || !sampleId || !magnification || !source.createdAt) {
      return;
    }
    records.push({
      id: String(source.id),
      sampleId,
      magnification,
      marks: normalizeMarks(source.marks),
      createdAt: String(source.createdAt),
    });
  });
  return records;
}

export function persistRecords(records: ObservationRecord[]): void {
  writeJSON(RECORDS_KEY, records);
}
