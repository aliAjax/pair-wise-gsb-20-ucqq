// ===== 观察资料层：样本、倍率、结构目录（纯静态资料，不含任何保存/判断逻辑） =====

import type {
  CellIndex,
  CellMark,
  DraftState,
  GridMarks,
  ObservationRecord,
  SampleCategory,
  SampleInfo,
  StructureId,
  StructureInfo,
} from "./types";

export const MAGNIFICATIONS = ["100x", "200x", "400x", "1000x"] as const;

export const CATEGORIES: SampleCategory[] = [
  "植物组织",
  "动物组织",
  "微生物",
  "血液涂片",
];

export const STRUCTURES: Record<StructureId, StructureInfo> = {
  "cell-wall": {
    id: "cell-wall",
    name: "细胞壁",
    short: "壁",
    hint: "细胞外侧的网状/格状边界",
  },
  nucleus: {
    id: "nucleus",
    name: "细胞核",
    short: "核",
    hint: "染色后呈深色的圆形或椭圆形小体",
  },
  cilia: {
    id: "cilia",
    name: "纤毛",
    short: "毛",
    hint: "细胞边缘摆动的细丝状结构",
  },
};

export const STRUCTURE_ORDER: StructureId[] = ["cell-wall", "nucleus", "cilia"];

export const SAMPLES: SampleInfo[] = [
  {
    id: "onion-epidermis",
    name: "洋葱表皮",
    category: "植物组织",
    staining: "碘液",
    allowedStructures: ["cell-wall", "nucleus"],
  },
  {
    id: "human-blood-smear",
    name: "人血涂片",
    category: "血液涂片",
    staining: "瑞氏染色",
    allowedStructures: ["nucleus"],
  },
  {
    id: "paramecium",
    name: "草履虫",
    category: "微生物",
    staining: "活体观察",
    allowedStructures: ["nucleus", "cilia"],
  },
  {
    id: "cheek-epithelium",
    name: "人口腔上皮",
    category: "动物组织",
    staining: "甲基蓝",
    allowedStructures: ["nucleus"],
  },
  {
    id: "leaf-mount",
    name: "叶片横切",
    category: "植物组织",
    staining: "番红-固绿",
    allowedStructures: ["cell-wall", "nucleus"],
  },
];

export function getSample(sampleId: string): SampleInfo {
  return SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[0];
}

function marks(list: CellMark[]): GridMarks {
  const grid = emptyGrid();
  list.slice(0, 9).forEach((value, position) => {
    grid[position as CellIndex] = value;
  });
  return grid;
}

const DAY = 24 * 60 * 60 * 1000;

/** 预置观察资料（仅在本机没有任何已保存数据时使用一次） */
export const SEED_RECORDS: ObservationRecord[] = [
  {
    id: "seed-001",
    sampleId: "onion-epidermis",
    magnification: "400x",
    marks: marks(["cell-wall", "cell-wall", null, "cell-wall", "nucleus", "cell-wall", null, "cell-wall", "cell-wall"]),
    note: "碘液染色后细胞壁界限清楚，中央格可见细胞核。",
    createdAt: Date.now() - 3 * DAY,
  },
  {
    id: "seed-002",
    sampleId: "human-blood-smear",
    magnification: "1000x",
    marks: marks([null, "na", null, "na", "nucleus", "na", null, "na", null]),
    note: "红细胞占满视野，仅中央格见到一个白细胞的核。",
    createdAt: Date.now() - 2 * DAY,
  },
  {
    id: "seed-003",
    sampleId: "paramecium",
    magnification: "200x",
    marks: marks(["na", "cilia", "na", "cilia", "nucleus", "cilia", "na", "cilia", "na"]),
    note: "活体观察，边缘格纤毛摆动明显，中央为大核。",
    createdAt: Date.now() - DAY,
  },
];

export function emptyGrid(): GridMarks {
  return {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
  };
}

export function createInitialDraft(): DraftState {
  return {
    sampleId: SAMPLES[0].id,
    magnification: MAGNIFICATIONS[0],
    annotationsBySample: Object.fromEntries(
      SAMPLES.map((sample) => [sample.id, emptyGrid()])
    ),
    note: "",
  };
}
