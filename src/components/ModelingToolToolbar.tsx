import {
  Camera,
  CircleDot,
  MousePointer2,
  Plus,
  Redo2,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useModelingStore } from "../store/modelingStore";
import { getEffectiveModelingTool, useUiStore } from "../store/uiStore";

const pointerSubtools = [
  {
    description: "pick nearby vertex",
    label: "Select",
    tool: "select",
  },
  {
    description: "place new vertex",
    label: "Vertex",
    tool: "vertex",
  },
] as const;

const pointerSubtoolIcons: Record<
  (typeof pointerSubtools)[number]["tool"],
  () => ReactNode
> = {
  select: () => (
    <CircleDot aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
  ),
  vertex: () => (
    <Plus aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.3} />
  ),
};

export function ModelingToolToolbar() {
  const currentModelId = useModelingStore((state) => state.currentModelId);
  const history = useModelingStore((state) => state.history);
  const historyIndex = useModelingStore((state) => state.historyIndex);
  const modelsById = useModelingStore((state) => state.modelsById);
  const redo = useModelingStore((state) => state.redo);
  const selectedVertexIds = useModelingStore(
    (state) => state.selectedVertexIds,
  );
  const undo = useModelingStore((state) => state.undo);
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
  const activeModel = modelsById[currentModelId];
  const canRedo = historyIndex < history.length - 1;
  const canUndo = historyIndex > 0;

  return (
    <aside className="absolute left-3 top-3 z-20 w-52 border border-white/12 bg-slate-950/78 shadow-[0_14px_28px_rgba(3,10,20,0.22)] backdrop-blur md:left-4 md:top-4">
      <p className="border-b border-white/8 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-sky-100/62">
        Tool
      </p>
      <div className="grid">
        <div className="grid grid-cols-2 border-b border-white/8">
          <button
            aria-label="Undo modeling action"
            className="inline-flex items-center justify-center gap-1.5 border-r border-white/8 px-2 py-2 text-[0.72rem] text-slate-200 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canUndo}
            onClick={undo}
            type="button"
          >
            <Undo2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Back</span>
          </button>
          <button
            aria-label="Redo modeling action"
            className="inline-flex items-center justify-center gap-1.5 px-2 py-2 text-[0.72rem] text-slate-200 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canRedo}
            onClick={redo}
            type="button"
          >
            <Redo2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Forward</span>
          </button>
        </div>
        <div className="border-b border-white/8 px-3 py-2.5">
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.22em] text-slate-400">
            Active Model
          </p>
          <p className="mt-1 text-[0.78rem] font-semibold text-slate-50">
            {activeModel?.name ?? "none"}
          </p>
          <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-slate-400">
            {activeModel?.vertexOrder.length ?? 0} verts /{" "}
            {activeModel?.edgeOrder.length ?? 0} edges /{" "}
            {activeModel?.faceOrder.length ?? 0} faces /{" "}
            {selectedVertexIds.length} selected
          </p>
        </div>
        <div
          className={`border-b border-white/8 transition ${
            effectiveTool === "pointer"
              ? "bg-sky-300/10 text-slate-50"
              : "text-slate-300"
          }`}
        >
          <button
            aria-label="Switch to 3D Pointer tool"
            aria-pressed={effectiveTool === "pointer"}
            className="grid w-full grid-cols-[auto_1fr] items-center gap-2 border-b border-white/8 px-3 py-2 text-left text-[0.76rem]"
            onClick={() => setModelingTool("select")}
            title="3D pointer parent tool"
            type="button"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center text-sky-200">
              <MousePointer2
                aria-hidden="true"
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
            </span>
            <span className="min-w-0 font-semibold">3D Pointer</span>
          </button>
          <div className="grid">
            {pointerSubtools.map((subtool) => {
              const active = modelingTool === subtool.tool;
              const Icon = pointerSubtoolIcons[subtool.tool];

              return (
                <button
                  aria-label={`Switch to ${subtool.label} tool`}
                  aria-pressed={active}
                  className={`grid grid-cols-[auto_1fr] items-center gap-2 border-b border-white/8 px-4 py-2 text-left text-[0.72rem] transition last:border-b-0 ${
                    active
                      ? "bg-sky-200/12 text-slate-50"
                      : "text-slate-300 hover:bg-white/[0.04]"
                  }`}
                  key={subtool.tool}
                  onClick={() => setModelingTool(subtool.tool)}
                  title={subtool.description}
                  type="button"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center text-sky-200">
                    <Icon />
                  </span>
                  <span className="min-w-0 font-semibold">{subtool.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <button
          aria-label="Switch to Camera Move tool"
          aria-pressed={effectiveTool === "camera"}
          className={`grid grid-cols-[auto_1fr] items-center gap-2 px-3 py-2 text-left text-[0.76rem] transition ${
            effectiveTool === "camera"
              ? "bg-sky-300/10 text-slate-50"
              : "text-slate-300 hover:bg-white/[0.04]"
          }`}
          onClick={() => setModelingTool("camera")}
          title="camera move"
          type="button"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center text-sky-200">
            <Camera
              aria-hidden="true"
              className="h-3.5 w-3.5"
              strokeWidth={2}
            />
          </span>
          <span className="min-w-0 font-semibold">Camera</span>
        </button>
      </div>
    </aside>
  );
}
