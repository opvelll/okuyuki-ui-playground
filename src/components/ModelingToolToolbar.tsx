import { Camera, MousePointer2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  type ModelingTool,
  getEffectiveModelingTool,
  useUiStore,
} from "../store/uiStore";

const toolButtons = [
  {
    description: "3d pointer",
    label: "3D Pointer",
    tool: "pointer",
  },
  {
    description: "camera move",
    label: "Camera",
    tool: "camera",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  label: string;
  tool: ModelingTool;
}>;

const toolIcons: Record<ModelingTool, () => ReactNode> = {
  camera: () => (
    <Camera aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
  ),
  pointer: () => (
    <MousePointer2 aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
  ),
};

export function ModelingToolToolbar() {
  const modelingTool = useUiStore((state) => state.modelingTool);
  const modelingCameraDragging = useUiStore(
    (state) => state.modelingCameraDragging,
  );
  const modelingCameraOverride = useUiStore(
    (state) => state.modelingCameraOverride,
  );
  const setModelingTool = useUiStore((state) => state.setModelingTool);
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });

  return (
    <aside className="absolute left-3 top-3 z-20 rounded-[1.2rem] border border-white/15 bg-slate-950/72 p-2 shadow-[0_18px_40px_rgba(3,10,20,0.3)] backdrop-blur-xl md:left-4 md:top-4">
      <p className="px-2 pb-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sky-100/70">
        Tool
      </p>
      <div className="grid gap-2">
        {toolButtons.map((toolButton) => {
          const active = toolButton.tool === effectiveTool;
          const Icon = toolIcons[toolButton.tool];

          return (
            <button
              aria-label={
                toolButton.tool === "pointer"
                  ? "Switch to 3D Pointer tool"
                  : "Switch to Camera Move tool"
              }
              aria-pressed={active}
              className={`grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                active
                  ? "border-sky-300/45 bg-sky-300/12 text-slate-50"
                  : "border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
              }`}
              key={toolButton.tool}
              onClick={() => setModelingTool(toolButton.tool)}
              type="button"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/6 text-sky-200">
                <Icon />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {toolButton.label}
                </span>
                <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">
                  {toolButton.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
