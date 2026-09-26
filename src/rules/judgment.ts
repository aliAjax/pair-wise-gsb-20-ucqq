// ===== 判断规则层：登记规则、提示规则、筛选规则（纯函数，不读取任何保存数据） =====

import { getSample } from "../data/catalog";
import type {
  CellIndex,
  CellMark,
  GridMarks,
  ObservationRecord,
  SampleCategory,
  StructureId,
} from "../data/types";

/** 当前样本允许使用的登记工具（结构 + “无关”） */
export type Tool = StructureId | "na";

export function allowedTools(sampleId: string): Tool[] {
  return [...getSample(sampleId).allowedStructures, "na"];
}

/**
 * 规则一：结构必须适用于该样本大类。
 * 例如血液涂片不允许登记细胞壁 / 纤毛，避免与植物组织、微生物混标。
 */
export function isStructureAllowed(
  sampleId: string,
  structure: StructureId
): boolean {
  return getSample(sampleId).allowedStructures.includes(structure);
}

export function categoryOf(sampleId: string): SampleCategory {
  return getSample(sampleId).category;
}

/**
 * 规则二：同一格只保留一种判断。
 * - 点空白格：写入当前工具
 * - 点已有同判断的格：取消（清空该格）
 * - 点已有其他判断的格：直接替换为当前工具
 */
export function applyMark(
  grid: GridMarks,
  index: CellIndex,
  tool: Tool
): GridMarks {
  const next = { ...grid };
  next[index] = next[index] === tool ? null : tool;
  return next;
}

export interface GridSummary {
  structureCounts: Record<StructureId, number>;
  naCount: number;
  emptyCount: number;
  markedCount: number;
}

export function summarize(grid: GridMarks): GridSummary {
  const summary: GridSummary = {
    structureCounts: { "cell-wall": 0, nucleus: 0, cilia: 0 },
    naCount: 0,
    emptyCount: 0,
    markedCount: 0,
  };
  (Object.values(grid) as CellMark[]).forEach((mark) => {
    if (mark === null) summary.emptyCount += 1;
    else if (mark === "na") summary.naCount += 1;
    else {
      summary.structureCounts[mark] += 1;
      summary.markedCount += 1;
    }
  });
  return summary;
}

export interface SubmitIssue {
  level: "block" | "info";
  text: string;
}

/**
 * 提交前规则检查（提示留在本页，不做弹窗 / 跳页）：
 * - block：重点结构为空（一格结构都没登记）→ 不允许提交
 * - info：存在与当前视野无关的格位 → 可提交，但留在本页提示
 * - info：尚有格位未判断 → 可提交，但留在本页提示
 */
export function evaluateSubmission(grid: GridMarks): SubmitIssue[] {
  const summary = summarize(grid);
  const issues: SubmitIssue[] = [];
  if (summary.markedCount === 0) {
    issues.push({
      level: "block",
      text: "重点结构为空：请至少在一个格位登记细胞壁、细胞核或纤毛后再提交。",
    });
  }
  if (summary.naCount > 0) {
    issues.push({
      level: "info",
      text: `已有 ${summary.naCount} 个格位标记为与当前视野无关，将保留在本页提示中，不计入结构判断。`,
    });
  }
  if (summary.emptyCount > 0) {
    issues.push({
      level: "info",
      text: `还有 ${summary.emptyCount} 个格位未判断；如确属视野外区域，可用“与视野无关”标记。`,
    });
  }
  return issues;
}

export interface RecordFilter {
  sampleId: string;
  magnification: string;
  structure: "" | StructureId | "na";
}

/** 规则三：提交后的记录可按样本、倍率、结构三个维度组合筛选 */
export function filterRecords(
  records: ObservationRecord[],
  filter: RecordFilter
): ObservationRecord[] {
  return records.filter((record) => {
    if (filter.sampleId !== "all" && record.sampleId !== filter.sampleId)
      return false;
    if (
      filter.magnification !== "all" &&
      record.magnification !== filter.magnification
    )
      return false;
    if (filter.structure !== "" && !recordContains(record, filter.structure))
      return false;
    return true;
  });
}

export function recordContains(
  record: ObservationRecord,
  structure: StructureId | "na"
): boolean {
  return (Object.values(record.marks) as CellMark[]).includes(structure);
}
