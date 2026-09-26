// 观察资料层：样本库、可登记结构、倍率与对应视野格位。
// 只描述“有什么资料”，不包含判断规则，也不接触 localStorage。

export type SampleType = "plant" | "animal" | "microbe" | "blood";

export interface Sample {
  id: string;
  name: string;
  type: SampleType;
  typeLabel: string;
  stain: string;
}

export type StructureId = "wall" | "nucleus" | "cilia";

export interface StructureDef {
  id: StructureId;
  name: string;
  /** 迷你九宫格里使用的单字标记 */
  short: string;
  /** 可在哪些样本类型中观察到该结构 */
  appliesTo: SampleType[];
}

export type MagnificationId = "100x" | "400x" | "1000x";

export interface MagnificationDef {
  id: MagnificationId;
  label: string;
  detail: string;
  /**
   * 该倍率下落在视野内的格位（0–8，按从左到右、从上到下编号）。
   * 倍率越高视野越小：100x 覆盖全部 9 格，400x 为中心十字 5 格，
   * 1000x 只剩中心 1 格。标注按格位沿用，不在视野内的格位只做提示、不丢弃。
   */
  view: number[];
}

export const GRID_POSITIONS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export const SAMPLES: Sample[] = [
  { id: "onion-epidermis", name: "洋葱表皮", type: "plant", typeLabel: "植物组织", stain: "碘液染色" },
  { id: "human-blood-smear", name: "人血涂片", type: "blood", typeLabel: "血液涂片", stain: "瑞氏染色" },
  { id: "paramecium", name: "草履虫", type: "microbe", typeLabel: "微生物", stain: "活体观察（不染色）" },
  { id: "cheek-epithelium", name: "人口腔上皮细胞", type: "animal", typeLabel: "动物组织", stain: "亚甲基蓝染色" },
];

export const STRUCTURES: StructureDef[] = [
  { id: "wall", name: "细胞壁", short: "壁", appliesTo: ["plant"] },
  { id: "nucleus", name: "细胞核", short: "核", appliesTo: ["plant", "animal", "microbe", "blood"] },
  { id: "cilia", name: "纤毛", short: "毛", appliesTo: ["microbe"] },
];

export const MAGNIFICATIONS: MagnificationDef[] = [
  { id: "100x", label: "100×", detail: "低倍 · 全视野 9 格", view: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { id: "400x", label: "400×", detail: "高倍 · 中心十字 5 格", view: [1, 3, 4, 5, 7] },
  { id: "1000x", label: "1000×", detail: "油镜 · 仅中心 1 格", view: [4] },
];

export const SAMPLE_BY_ID: Record<string, Sample> = Object.fromEntries(
  SAMPLES.map((sample) => [sample.id, sample]),
);

export const STRUCTURE_BY_ID: Record<StructureId, StructureDef> = Object.fromEntries(
  STRUCTURES.map((structure) => [structure.id, structure]),
) as Record<StructureId, StructureDef>;

export const MAGNIFICATION_BY_ID: Record<MagnificationId, MagnificationDef> =
  Object.fromEntries(MAGNIFICATIONS.map((magnification) => [magnification.id, magnification])) as
    Record<MagnificationId, MagnificationDef>;

export const STRUCTURE_IDS: StructureId[] = STRUCTURES.map((structure) => structure.id);

export const MAGNIFICATION_IDS: MagnificationId[] = MAGNIFICATIONS.map((magnification) => magnification.id);
