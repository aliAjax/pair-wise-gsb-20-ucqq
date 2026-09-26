import {
  MAGNIFICATIONS,
  SAMPLES,
  STRUCTURES,
  type MagnificationId,
} from "../data/observation";
import {
  structureBlockReason,
  type AnnotationTool,
} from "../rules/observationRules";
import type { Sample, StructureId } from "../data/observation";

interface ControlPanelProps {
  sample: Sample;
  magnification: MagnificationId;
  tool: AnnotationTool;
  onSampleChange: (sampleId: string) => void;
  onMagnificationChange: (magnification: MagnificationId) => void;
  onToolChange: (tool: AnnotationTool) => void;
  savedAtText: string;
}

export function ControlPanel({
  sample,
  magnification,
  tool,
  onSampleChange,
  onMagnificationChange,
  onToolChange,
  savedAtText,
}: ControlPanelProps) {
  return (
    <section className="panel control-panel" aria-label="观察设置">
      <div className="panel-head">
        <p className="eyebrow">第一步</p>
        <h2>选定样本与倍率</h2>
      </div>

      <label className="field">
        <span>样本</span>
        <select value={sample.id} onChange={(event) => onSampleChange(event.target.value)}>
          {SAMPLES.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}（{entry.typeLabel}）
            </option>
          ))}
        </select>
      </label>

      <div className="sample-meta">
        <span>{sample.stain}</span>
      </div>

      <div className="field">
        <span>放大倍率</span>
        <div className="segmented" role="group" aria-label="放大倍率">
          {MAGNIFICATIONS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={entry.id === magnification ? "is-active" : ""}
              aria-pressed={entry.id === magnification}
              title={entry.detail}
              onClick={() => onMagnificationChange(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <p className="field-hint">{MAGNIFICATIONS.find((entry) => entry.id === magnification)?.detail}</p>
      </div>

      <div className="field">
        <span>登记结构（先选结构，再点格子）</span>
        <div className="tool-row" role="group" aria-label="登记结构">
          {STRUCTURES.map((structure) => {
            const reason = structureBlockReason(sample, structure.id as StructureId);
            const active = tool === structure.id;
            return (
              <button
                key={structure.id}
                type="button"
                className={`tool-button mark-${structure.id} ${active ? "is-active" : ""}`}
                aria-pressed={active}
                disabled={Boolean(reason)}
                title={reason ?? `${structure.name}：点击后在格内登记`}
                onClick={() => onToolChange(structure.id)}
              >
                <b>{structure.short}</b>
                {structure.name}
              </button>
            );
          })}
          <button
            type="button"
            className={`tool-button tool-erase ${tool === "erase" ? "is-active" : ""}`}
            aria-pressed={tool === "erase"}
            title="橡皮擦：清除格内判断（含视野外沿用的标注）"
            onClick={() => onToolChange("erase")}
          >
            <b>擦</b>
            橡皮擦
          </button>
        </div>
        <p className="field-hint">
          {sample.typeLabel}可登记：
          {STRUCTURES.filter((structure) => !structureBlockReason(sample, structure.id)).map(
            (structure) => structure.name,
          ).join("、")}
          ；同一格只能保留一种判断。
        </p>
      </div>

      <p className="save-state">本机草稿：{savedAtText}</p>
    </section>
  );
}
