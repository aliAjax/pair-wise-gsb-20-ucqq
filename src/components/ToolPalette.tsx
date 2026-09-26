import { STRUCTURES } from "../data/catalog";
import type { StructureId } from "../data/types";
import type { Tool } from "../rules/judgment";

interface ToolPaletteProps {
  tools: Tool[];
  active: Tool;
  onSelect: (tool: Tool) => void;
}

export function ToolPalette({ tools, active, onSelect }: ToolPaletteProps) {
  return (
    <div className="tool-palette" role="group" aria-label="登记工具">
      {tools.map((tool) => {
        const isNa = tool === "na";
        const label = isNa ? "与视野无关" : STRUCTURES[tool as StructureId].name;
        const hint = isNa
          ? "该格不在当前视野内"
          : STRUCTURES[tool as StructureId].hint;
        return (
          <button
            key={tool}
            type="button"
            className={`tool-btn ${isNa ? "tool-na" : `tool-${tool}`}${
              active === tool ? " active" : ""
            }`}
            onClick={() => onSelect(tool)}
            aria-pressed={active === tool}
          >
            <strong>{label}</strong>
            <span>{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
