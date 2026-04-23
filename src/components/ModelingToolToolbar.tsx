import {
  Camera,
  CircleDashed,
  MousePointer2,
  PenLine,
  Plus,
  Redo2,
  Square,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useModelingStore } from "../store/modelingStore";
import {
  type ModelingRectangleMode,
  type MoveOverlayDisplayMode,
  getEffectiveModelingTool,
  useUiStore,
} from "../store/uiStore";

const selectionSubtools = [
  {
    description: "drag a screen-space lasso to select vertices",
    label: "Lasso",
    tool: "lasso",
  },
] as const;

const selectionSubtoolIcons: Record<
  (typeof selectionSubtools)[number]["tool"],
  () => ReactNode
> = {
  lasso: () => (
    <CircleDashed aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
  ),
};

const pointerSubtools = [
  {
    description: "place new vertex",
    label: "Vertex",
    tool: "vertex",
  },
  {
    description: "drag to create a line",
    label: "Line",
    tool: "line",
  },
  {
    description: "drag a diagonal to create a rectangle",
    label: "Rectangle",
    tool: "rectangle",
  },
] as const;

const pointerSubtoolIcons: Record<
  (typeof pointerSubtools)[number]["tool"],
  () => ReactNode
> = {
  vertex: () => (
    <Plus aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.3} />
  ),
  line: () => (
    <PenLine aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
  ),
  rectangle: () => (
    <Square aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
  ),
};

const overlayDisplayOptions = [
  { label: "1", value: "mode-1" },
  { label: "2", value: "mode-2" },
  { label: "3", value: "mode-3" },
  { label: "2 + 3", value: "modes-2-3" },
  { label: "1 + 2 + 3", value: "modes-1-2-3" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: MoveOverlayDisplayMode;
}>;

const lineAngleSnapStepOptions = [
  { label: "15 deg", value: 15 },
  { label: "30 deg", value: 30 },
  { label: "45 deg", value: 45 },
  { label: "90 deg", value: 90 },
] as const;

const rectangleModeOptions = [
  { label: "+Y 固定", value: "upright-up-fixed" },
  { label: "+X 固定", value: "upright-x-fixed" },
  { label: "+Z 固定", value: "upright-z-fixed" },
  { label: "左固定 / 正方形", value: "upright-left-square" },
  { label: "XZ 平面", value: "flat-xz" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: ModelingRectangleMode;
}>;

const fieldClasses =
  "h-7 border border-white/10 bg-slate-900/80 px-1 text-[0.68rem] text-slate-50 outline-none transition focus:border-sky-200/60 focus:ring-2 focus:ring-sky-300/30";

const propertyPanelClasses =
  "flex shrink-0 items-center gap-1.5 border border-white/12 bg-slate-950/80 px-2 py-1.5 shadow-[0_14px_28px_rgba(3,10,20,0.22)] backdrop-blur";

function ToolSettingNumberField({
  id,
  label,
  min,
  onChange,
  step,
  title,
  value,
}: {
  id: string;
  label: string;
  min?: string;
  onChange: (value: number) => void;
  step: string;
  title: string;
  value: number;
}) {
  return (
    <label
      className="flex items-center gap-1.5 text-[0.68rem] text-slate-100/88"
      htmlFor={id}
      title={title}
    >
      <span>{label}</span>
      <input
        className={`${fieldClasses} w-14`}
        id={id}
        min={min}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isFinite(nextValue)) {
            onChange(nextValue);
          }
        }}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function ToolSettingToggle({
  checked,
  label,
  onChange,
  title,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  title: string;
}) {
  return (
    <label
      className="grid grid-cols-[1fr_auto] items-center gap-2 text-[0.68rem] text-slate-100/88"
      title={title}
    >
      <span>{label}</span>
      <span className="relative inline-flex items-center">
        <input
          aria-label={label}
          checked={checked}
          className="peer sr-only"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="block h-4.5 w-8 rounded-full bg-slate-400/35 transition peer-checked:bg-sky-300" />
        <span className="pointer-events-none absolute left-[2px] h-3.5 w-3.5 rounded-full bg-slate-50 transition peer-checked:translate-x-[14px]" />
      </span>
    </label>
  );
}

function ToolSettingSelectField<T extends string | number>({
  id,
  label,
  onChange,
  options,
  title,
  value,
  widthClass = "w-20",
}: {
  id: string;
  label: string;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ label: string; value: T }>;
  title: string;
  value: T;
  widthClass?: string;
}) {
  return (
    <label
      className="flex items-center gap-1.5 text-[0.68rem] text-slate-100/88"
      htmlFor={id}
      title={title}
    >
      <span>{label}</span>
      <select
        className={`${fieldClasses} ${widthClass}`}
        id={id}
        onChange={(event) => {
          const matchingOption = options.find(
            (option) => String(option.value) === event.target.value,
          );
          if (matchingOption) {
            onChange(matchingOption.value);
          }
        }}
        value={String(value)}
      >
        {options.map((option) => (
          <option key={option.label} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ModelingToolToolbar() {
  const modelingTool = useUiStore((state) => state.modelingTool);
  const modelingCameraDragging = useUiStore(
    (state) => state.modelingCameraDragging,
  );
  const modelingCameraOverride = useUiStore(
    (state) => state.modelingCameraOverride,
  );
  const currentModelId = useModelingStore((state) => state.currentModelId);
  const history = useModelingStore((state) => state.history);
  const historyIndex = useModelingStore((state) => state.historyIndex);
  const modelsById = useModelingStore((state) => state.modelsById);
  const redo = useModelingStore((state) => state.redo);
  const selectedVertexIds = useModelingStore(
    (state) => state.selectedVertexIds,
  );
  const undo = useModelingStore((state) => state.undo);
  const setModelingTool = useUiStore((state) => state.setModelingTool);
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });
  const activeModel = modelsById[currentModelId];
  const canRedo = historyIndex < history.length - 1;
  const canUndo = historyIndex > 0;
  const selectionToolActive = modelingTool === "lasso";
  const pointerToolActive =
    modelingTool === "vertex" ||
    modelingTool === "line" ||
    modelingTool === "rectangle";

  return (
    <aside className="absolute left-3 top-3 z-20 w-52 border border-white/12 bg-slate-950/80 shadow-[0_14px_28px_rgba(3,10,20,0.22)] backdrop-blur md:left-4 md:top-4">
      <div className="border-b border-white/8 px-3 py-1.5">
        <p className="text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-slate-300">
          {effectiveTool === "camera" ? "Camera" : modelingTool}
        </p>
      </div>
      <div className="grid">
        <div className="grid grid-cols-2 border-b border-white/8">
          <button
            aria-label="Undo modeling action"
            className="inline-flex items-center justify-center gap-1.5 border-r border-white/8 px-2 py-1.5 text-[0.68rem] text-slate-200 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canUndo}
            onClick={undo}
            type="button"
          >
            <Undo2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Back</span>
          </button>
          <button
            aria-label="Redo modeling action"
            className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[0.68rem] text-slate-200 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canRedo}
            onClick={redo}
            type="button"
          >
            <Redo2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Forward</span>
          </button>
        </div>
        <div className="border-b border-white/8 px-3 py-2">
          <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-400">
            Active Model
          </p>
          <p className="mt-0.5 text-[0.76rem] font-semibold text-slate-50">
            {activeModel?.name ?? "none"}
          </p>
          <p className="mt-0.5 text-[0.58rem] uppercase tracking-[0.16em] text-slate-400">
            {activeModel?.vertexOrder.length ?? 0} verts /{" "}
            {activeModel?.edgeOrder.length ?? 0} edges /{" "}
            {activeModel?.faceOrder.length ?? 0} faces /{" "}
            {selectedVertexIds.length} selected
          </p>
        </div>
        <div
          className={`border-b border-white/8 transition ${
            selectionToolActive
              ? "bg-sky-300/10 text-slate-50"
              : "text-slate-300"
          }`}
        >
          <button
            aria-label="Switch to 2D Selection tool"
            aria-pressed={selectionToolActive}
            className="grid w-full grid-cols-[auto_1fr] items-center gap-2 border-b border-white/8 px-3 py-1.5 text-left text-[0.74rem]"
            onClick={() => setModelingTool("lasso")}
            title="selection parent tool"
            type="button"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center text-sky-200">
              <CircleDashed
                aria-hidden="true"
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
            </span>
            <span className="min-w-0 font-semibold">2D Selection</span>
          </button>
          <div className="grid gap-px bg-white/6 pl-4">
            {selectionSubtools.map((subtool) => {
              const active = modelingTool === subtool.tool;
              const Icon = selectionSubtoolIcons[subtool.tool];

              return (
                <button
                  aria-label={`Switch to ${subtool.label} tool`}
                  aria-pressed={active}
                  className={`grid grid-cols-[auto_1fr] items-center gap-2 border-l border-white/10 px-3 py-1.5 text-left text-[0.7rem] transition ${
                    active
                      ? "bg-sky-200/12 text-slate-50"
                      : "bg-slate-950/40 text-slate-300 hover:bg-white/[0.04]"
                  }`}
                  key={subtool.tool}
                  onClick={() => setModelingTool(subtool.tool)}
                  title={subtool.description}
                  type="button"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center text-sky-200">
                    <Icon />
                  </span>
                  <span className="min-w-0 font-semibold">{subtool.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div
          className={`border-b border-white/8 transition ${
            pointerToolActive ? "bg-sky-300/10 text-slate-50" : "text-slate-300"
          }`}
        >
          <button
            aria-label="Switch to 3D Pointer tool"
            aria-pressed={pointerToolActive}
            className="grid w-full grid-cols-[auto_1fr] items-center gap-2 border-b border-white/8 px-3 py-1.5 text-left text-[0.74rem]"
            onClick={() => setModelingTool("vertex")}
            title="3D pointer parent tool"
            type="button"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center text-sky-200">
              <MousePointer2
                aria-hidden="true"
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
            </span>
            <span className="min-w-0 font-semibold">3D Pointer</span>
          </button>
          <div className="grid gap-px bg-white/6 pl-4">
            {pointerSubtools.map((subtool) => {
              const active = modelingTool === subtool.tool;
              const Icon = pointerSubtoolIcons[subtool.tool];

              return (
                <button
                  aria-label={`Switch to ${subtool.label} tool`}
                  aria-pressed={active}
                  className={`grid grid-cols-[auto_1fr] items-center gap-2 border-l border-white/10 px-3 py-1.5 text-left text-[0.7rem] transition ${
                    active
                      ? "bg-sky-200/12 text-slate-50"
                      : "bg-slate-950/40 text-slate-300 hover:bg-white/[0.04]"
                  }`}
                  key={subtool.tool}
                  onClick={() => setModelingTool(subtool.tool)}
                  title={subtool.description}
                  type="button"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center text-sky-200">
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
          className={`grid grid-cols-[auto_1fr] items-center gap-2 px-3 py-1.5 text-left text-[0.74rem] transition ${
            effectiveTool === "camera"
              ? "bg-sky-300/10 text-slate-50"
              : "text-slate-300 hover:bg-white/[0.04]"
          }`}
          onClick={() => setModelingTool("camera")}
          title="camera move"
          type="button"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center text-sky-200">
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

export function ModelingToolHeaderProperties() {
  const modelingTool = useUiStore((state) => state.modelingTool);
  const modelingCameraDragging = useUiStore(
    (state) => state.modelingCameraDragging,
  );
  const modelingCameraOverride = useUiStore(
    (state) => state.modelingCameraOverride,
  );
  const modelingLineOverlayDisplayMode = useUiStore(
    (state) => state.modelingLineOverlayDisplayMode,
  );
  const modelingLineAngleSnapStepDeg = useUiStore(
    (state) => state.modelingLineAngleSnapStepDeg,
  );
  const modelingRectangleMode = useUiStore(
    (state) => state.modelingRectangleMode,
  );
  const modelingPointerAxisSnapEnabled = useUiStore(
    (state) => state.modelingPointerAxisSnapEnabled,
  );
  const modelingPointerAxisSnapDistance = useUiStore(
    (state) => state.modelingPointerAxisSnapDistance,
  );
  const modelingPointerGridSnapEnabled = useUiStore(
    (state) => state.modelingPointerGridSnapEnabled,
  );
  const modelingPointerGridSnapStep = useUiStore(
    (state) => state.modelingPointerGridSnapStep,
  );
  const modelingPointerVertexSnapDistance = useUiStore(
    (state) => state.modelingPointerVertexSnapDistance,
  );
  const modelingPointerVertexSnapEnabled = useUiStore(
    (state) => state.modelingPointerVertexSnapEnabled,
  );
  const setModelingLineOverlayDisplayMode = useUiStore(
    (state) => state.setModelingLineOverlayDisplayMode,
  );
  const setModelingLineAngleSnapStepDeg = useUiStore(
    (state) => state.setModelingLineAngleSnapStepDeg,
  );
  const setModelingRectangleMode = useUiStore(
    (state) => state.setModelingRectangleMode,
  );
  const setModelingPointerAxisSnapEnabled = useUiStore(
    (state) => state.setModelingPointerAxisSnapEnabled,
  );
  const setModelingPointerAxisSnapDistance = useUiStore(
    (state) => state.setModelingPointerAxisSnapDistance,
  );
  const setModelingPointerEdgeSnapEnabled = useUiStore(
    (state) => state.setModelingPointerEdgeSnapEnabled,
  );
  const setModelingPointerEdgeSnapDistance = useUiStore(
    (state) => state.setModelingPointerEdgeSnapDistance,
  );
  const setModelingPointerGridSnapEnabled = useUiStore(
    (state) => state.setModelingPointerGridSnapEnabled,
  );
  const setModelingPointerGridSnapStep = useUiStore(
    (state) => state.setModelingPointerGridSnapStep,
  );
  const setModelingPointerVertexSnapDistance = useUiStore(
    (state) => state.setModelingPointerVertexSnapDistance,
  );
  const setModelingPointerVertexSnapEnabled = useUiStore(
    (state) => state.setModelingPointerVertexSnapEnabled,
  );
  const modelingPointerEdgeSnapDistance = useUiStore(
    (state) => state.modelingPointerEdgeSnapDistance,
  );
  const modelingPointerEdgeSnapEnabled = useUiStore(
    (state) => state.modelingPointerEdgeSnapEnabled,
  );
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });

  if (effectiveTool !== "pointer" || modelingTool === "lasso") {
    return null;
  }

  return (
    <div className="absolute left-1/2 top-3 z-20 flex w-max max-w-[calc(100vw-8rem)] -translate-x-1/2 flex-nowrap items-start justify-center gap-1 overflow-x-auto px-1 pb-1">
      <div className={propertyPanelClasses}>
        <ToolSettingToggle
          checked={modelingPointerVertexSnapEnabled}
          label="Vertex Snap"
          onChange={setModelingPointerVertexSnapEnabled}
          title="Toggle 3D pointer snapping directly onto nearby existing vertices."
        />
        <ToolSettingNumberField
          id="pointer-vertex-snap-distance"
          label="Vertex Distance"
          min="0"
          onChange={setModelingPointerVertexSnapDistance}
          step="0.01"
          title="Maximum world-space distance used when snapping the 3D pointer onto a nearby vertex."
          value={modelingPointerVertexSnapDistance}
        />
        <ToolSettingToggle
          checked={modelingPointerAxisSnapEnabled}
          label="Axis Snap"
          onChange={setModelingPointerAxisSnapEnabled}
          title="Toggle 3D pointer snapping each XYZ component to nearby vertex coordinates."
        />
        <ToolSettingNumberField
          id="pointer-axis-snap-distance"
          label="Axis Distance"
          min="0"
          onChange={setModelingPointerAxisSnapDistance}
          step="0.01"
          title="Maximum world-space distance used when snapping each XYZ component to nearby vertex coordinates."
          value={modelingPointerAxisSnapDistance}
        />
        <ToolSettingToggle
          checked={modelingPointerEdgeSnapEnabled}
          label="Edge Snap"
          onChange={setModelingPointerEdgeSnapEnabled}
          title="Toggle 3D pointer snapping onto the nearest point along an existing edge."
        />
        <ToolSettingNumberField
          id="pointer-edge-snap-distance"
          label="Edge Distance"
          min="0"
          onChange={setModelingPointerEdgeSnapDistance}
          step="0.01"
          title="Maximum world-space distance used when snapping the 3D pointer onto an existing edge."
          value={modelingPointerEdgeSnapDistance}
        />
        <ToolSettingToggle
          checked={modelingPointerGridSnapEnabled}
          label="Grid Snap"
          onChange={setModelingPointerGridSnapEnabled}
          title="Toggle fixed world-interval snapping on axes that did not snap to another vertex."
        />
        <ToolSettingNumberField
          id="pointer-grid-snap-step"
          label="Grid Step"
          min="0.01"
          onChange={setModelingPointerGridSnapStep}
          step="0.01"
          title="Fixed world interval used on axes that did not snap to another vertex."
          value={modelingPointerGridSnapStep}
        />
      </div>
      {modelingTool === "line" ? (
        <div className={propertyPanelClasses}>
          <ToolSettingSelectField
            id="line-angle-snap-step"
            label="Angle Step"
            onChange={setModelingLineAngleSnapStepDeg}
            options={lineAngleSnapStepOptions}
            title="Angular step used while holding Ctrl during a line drag. The snap directions are generated on the XY, XZ, and YZ planes."
            value={modelingLineAngleSnapStepDeg}
            widthClass="w-18"
          />
          <ToolSettingSelectField
            id="line-overlay-display"
            label="Overlay"
            onChange={(value) =>
              setModelingLineOverlayDisplayMode(value as MoveOverlayDisplayMode)
            }
            options={overlayDisplayOptions}
            title="Preview panel display during drag. 1 uses camera-facing, 2 uses screen-vertical, 3 uses screen-horizontal."
            value={modelingLineOverlayDisplayMode}
            widthClass="w-14"
          />
        </div>
      ) : null}
      {modelingTool === "rectangle" ? (
        <div className={propertyPanelClasses}>
          <ToolSettingSelectField
            id="rectangle-mode"
            label="Mode"
            onChange={setModelingRectangleMode}
            options={rectangleModeOptions}
            title="Experimental rectangle generation modes for validation."
            value={modelingRectangleMode}
            widthClass="w-30"
          />
          <ToolSettingSelectField
            id="rectangle-overlay-display"
            label="Overlay"
            onChange={(value) =>
              setModelingLineOverlayDisplayMode(value as MoveOverlayDisplayMode)
            }
            options={overlayDisplayOptions}
            title="Preview panel display during drag. 1 uses camera-facing, 2 uses screen-vertical, 3 uses screen-horizontal."
            value={modelingLineOverlayDisplayMode}
            widthClass="w-14"
          />
        </div>
      ) : null}
    </div>
  );
}
