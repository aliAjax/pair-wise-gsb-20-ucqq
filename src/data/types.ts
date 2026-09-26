// ===== 观察资料层：领域类型定义 =====

/** 样本大类 */
export type SampleCategory = "植物组织" | "动物组织" | "微生物" | "血液涂片";

/** 重点结构（判断对象） */
export type StructureId = "cell-wall" | "nucleus" | "cilia";

/** 九格位编号 0~8（从左上到右下） */
export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const GRID_SIZE = 9;

/**
 * 格位判断：同一格只保留一种判断。
 * - 结构 id：该格登记的重点结构
 * - "na"：该格与当前视野无关
 * - null：尚未判断
 */
export type CellMark = StructureId | "na" | null;

/** 九宫格标注，按格位存储（与倍率无关，倍率切换时按位置沿用） */
export type GridMarks = Record<CellIndex, CellMark>;

export interface StructureInfo {
  id: StructureId;
  name: string;
  short: string;
  hint: string;
}

export interface SampleInfo {
  id: string;
  name: string;
  category: SampleCategory;
  staining: string;
  /** 该样本允许登记的结构 */
  allowedStructures: StructureId[];
}

/** 一份已提交的视野观察记录 */
export interface ObservationRecord {
  id: string;
  sampleId: string;
  magnification: string;
  /** 提交瞬间的九宫格快照 */
  marks: GridMarks;
  note: string;
  createdAt: number;
}

/** 未提交的录入草稿（关掉页面后要能找回的现场） */
export interface DraftState {
  sampleId: string;
  magnification: string;
  /** 标注按样本维度保存：各倍率之间按位置沿用 */
  annotationsBySample: Record<string, GridMarks>;
  note: string;
}
