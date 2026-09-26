// 判断规则层：结构适用范围、同格单一判断、倍率视野沿用与提交前审查。
// 只处理规则运算，不读 DOM / localStorage；资料定义从 data 层取得。

import {
  GRID_POSITIONS,
  MAGNIFICATION_IDS,
  MAGNIFICATION_BY_ID,
  SAMPLE_BY_ID,
  STRUCTURE_BY_ID,
  STRUCTURE_IDS,
  type MagnificationId,
  type Sample,
  type StructureId,
} from "../data/observation";

/** 点格工具：三种结构 + 橡皮擦（清除本格） */
export type AnnotationTool = StructureId | "erase";

export type Marks = Partial<Record<number, StructureId>>;

/** 本页提示：error 阻断提交，warning 要求处理后才能提交，info 仅说明 */
export type IssueKind = "error" | "warning" | "info";

export interface GridIssue {
  kind: IssueKind;
  position?: number;
  message: string;
}

export function isStructureAllowed(sample: Sample, structureId: StructureId): boolean {
  return STRUCTURE_BY_ID[structureId].appliesTo.includes(sample.type);
}

/** 结构按钮不可用原因，用于工具栏提示；可用时返回 null */
export function structureBlockReason(sample: Sample, structureId: StructureId): string | null {
  if (isStructureAllowed(sample, structureId)) {
    return null;
  }
  return `${STRUCTURE_BY_ID[structureId].name}不属于${sample.typeLabel}，避免与其他样本的判断混用`;
}

export function isPositionInView(position: number, magnificationId: MagnificationId): boolean {
  return MAGNIFICATION_BY_ID[magnificationId].view.includes(position);
}

export function inViewMarks(marks: Marks, magnificationId: MagnificationId): Marks {
  const view = MAGNIFICATION_BY_ID[magnificationId].view;
  const result: Marks = {};
  view.forEach((position) => {
    const mark = marks[position];
    if (mark) {
      result[position] = mark;
    }
  });
  return result;
}

export function outOfViewMarks(marks: Marks, magnificationId: MagnificationId): Marks {
  const result: Marks = {};
  GRID_POSITIONS.forEach((position) => {
    const mark = marks[position];
    if (mark && !isPositionInView(position, magnificationId)) {
      result[position] = mark;
    }
  });
  return result;
}

/**
 * 点格登记规则：
 * - 同一格只能保留一种判断：换结构直接覆盖；再次点同一结构相当于撤销。
 * - 格位不在当前倍率视野内时不可登记（标注仍按位置沿用），橡皮擦除外：
 *   允许清掉视野外沿用下来的旧标注。
 */
export function applyCellClick(
  marks: Marks,
  position: number,
  tool: AnnotationTool,
  magnificationId: MagnificationId,
): { next: Marks; rejected?: string } {
  const next: Marks = { ...marks };
  if (tool === "erase") {
    delete next[position];
    return { next };
  }
  if (!isPositionInView(position, magnificationId)) {
    return {
      next,
      rejected: `第 ${position + 1} 格不在当前${MAGNIFICATION_BY_ID[magnificationId].label}视野内，不能登记；标注按位置沿用，可切换倍率或用橡皮擦清除`,
    };
  }
  if (next[position] === tool) {
    delete next[position];
  } else {
    next[position] = tool;
  }
  return { next };
}

/** 找到能覆盖全部已标格位的最高倍率（提示老师切到哪个倍率核对沿用标注） */
export function highestMagnificationCovering(marks: Marks): MagnificationId | null {
  const positions = Object.keys(marks).map((key) => Number(key));
  if (positions.length === 0) {
    return null;
  }
  let chosen: MagnificationId | null = null;
  MAGNIFICATION_IDS.forEach((magnificationId) => {
    const view = MAGNIFICATION_BY_ID[magnificationId].view;
    if (positions.every((position) => view.includes(position))) {
      chosen = magnificationId;
    }
  });
  return chosen;
}

/**
 * 提交前审查（重点结构为空 / 格位与当前视野无关时，提示留在本页）：
 * - 一格都没登记 → error，重点结构为空，阻断提交；
 * - 存在当前视野外的沿用标注 → warning，阻断提交，引导切倍率核对或擦除；
 * - 标注了该样本不允许的结构（防御性校验）→ error。
 */
export function reviewObservation(
  sampleId: string,
  magnificationId: MagnificationId,
  marks: Marks,
): GridIssue[] {
  const sample = SAMPLE_BY_ID[sampleId];
  const issues: GridIssue[] = [];

  GRID_POSITIONS.forEach((position) => {
    const mark = marks[position];
    if (mark && sample && !isStructureAllowed(sample, mark)) {
      issues.push({
        kind: "error",
        position,
        message: `第 ${position + 1} 格的「${STRUCTURE_BY_ID[mark].name}」不适用于${sample.typeLabel}，请先擦除`,
      });
    }
  });

  const outside = outOfViewMarks(marks, magnificationId);
  const outsidePositions = Object.keys(outside)
    .map((key) => Number(key))
    .sort((a, b) => a - b);
  if (outsidePositions.length > 0) {
    const cells = outsidePositions.map((position) => `第 ${position + 1} 格`).join("、");
    const coverId = highestMagnificationCovering(marks);
    const switchTip = coverId
      ? `切到 ${MAGNIFICATION_BY_ID[coverId].label} 可看到全部已标格位`
      : "";
    issues.push({
      kind: "warning",
      message: `${cells}不在当前 ${MAGNIFICATION_BY_ID[magnificationId].label} 视野内（低倍率下的标注已按位置沿用）。请切换倍率核对，或用橡皮擦清除后再提交。${switchTip}`,
    });
  }

  if (STRUCTURE_IDS.every((structureId) => !Object.values(marks).includes(structureId))) {
    issues.push({
      kind: "error",
      message: "重点结构为空：请在九宫格中至少登记一个细胞壁 / 细胞核 / 纤毛判断后再提交",
    });
  }

  return issues;
}
