import { useEffect, useState } from "react";
import { useModelingStore } from "../store/modelingStore";
import { getEffectiveModelingTool, useUiStore } from "../store/uiStore";

const RECTANGLE_MODE_LABELS = {
  "flat-xz": "xz-plane",
  "upright-left-square": "left-square",
  "upright-up-fixed": "+y-fixed",
  "upright-x-fixed": "+x-fixed",
  "upright-z-fixed": "+z-fixed",
} as const;

const HUD_VALUE_WIDTH_CLASSES: Partial<Record<string, string>> = {
  depth: "w-[10ch]",
  fps: "w-[3ch]",
  history: "w-[5ch]",
  plane: "w-[6ch]",
  pointer: "w-[6ch]",
  pos: "w-[14ch]",
  rect: "w-[8ch]",
  screen: "w-[8ch]",
  snap: "w-[18ch]",
  state: "w-[6ch]",
  tool: "w-[10ch]",
};

function formatAngleSnapStepDeg(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

export function SceneStatusHud() {
  const [fps, setFps] = useState(0);
  const modelingHistory = useModelingStore((state) => state.history);
  const modelingHistoryIndex = useModelingStore((state) => state.historyIndex);
  const interactionState = useUiStore((state) => state.interactionState);
  const modelingCameraDragging = useUiStore(
    (state) => state.modelingCameraDragging,
  );
  const modelingCameraOverride = useUiStore(
    (state) => state.modelingCameraOverride,
  );
  const modelingPointer = useUiStore((state) => state.modelingPointer);
  const modelingPointerDepthPrecisionScale = useUiStore(
    (state) => state.modelingPointerDepthPrecisionScale,
  );
  const modelingLineAngleSnapStepDeg = useUiStore(
    (state) => state.modelingLineAngleSnapStepDeg,
  );
  const modelingRectangleMode = useUiStore(
    (state) => state.modelingRectangleMode,
  );
  const modelingPointerVisibleInCameraTool = useUiStore(
    (state) => state.modelingPointerVisibleInCameraTool,
  );
  const modelingTool = useUiStore((state) => state.modelingTool);
  const showFps = useUiStore((state) => state.showFps);
  const effectiveModelingTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });
  const hudItems = [
    ["screen", "modeling"],
    [
      "tool",
      `${effectiveModelingTool === "camera" ? "camera" : modelingTool}${
        effectiveModelingTool === "pointer" && modelingCameraOverride
          ? " (space)"
          : ""
      }`,
    ],
    ["depth", modelingPointer.depth.toFixed(2)],
    ["plane", modelingPointer.plane],
    ...(modelingTool === "rectangle"
      ? [["rect", RECTANGLE_MODE_LABELS[modelingRectangleMode]] as const]
      : []),
    [
      "pointer",
      modelingPointer.hovered &&
      modelingTool !== "lasso" &&
      (effectiveModelingTool === "pointer" ||
        modelingPointerVisibleInCameraTool)
        ? "visible"
        : "hidden",
    ],
    [
      "snap",
      modelingPointer.snappedVertexTarget
        ? "vertex"
        : modelingPointer.snappedEdgeTarget
          ? "edge"
          : modelingPointer.snappedFaceTarget
            ? "face"
            : modelingPointer.snappedAxes.some(Boolean)
              ? "axis"
              : "none",
    ],
    ["history", `${modelingHistoryIndex + 1} / ${modelingHistory.length}`],
    [
      "pos",
      modelingPointer.position.map((value) => value.toFixed(2)).join(", "),
    ],
    ["state", interactionState],
  ] as const;
  const hudEntries = showFps
    ? ([["fps", String(fps)] as const, ...hudItems] as const)
    : hudItems;

  const helperText =
    effectiveModelingTool === "camera"
      ? "Camera tool: left drag rotates, wheel dollies, right drag slides, and releasing Space after starting a drag keeps camera control until the drag ends."
      : modelingTool === "lasso"
        ? "Lasso tool: drag a screen-space loop to select enabled vertices, edges, or face center dots, hold Shift to add to the current selection, press Delete to remove selected elements, press E for an edge, press F for a face, and hold Space for temporary camera control."
        : modelingTool === "move"
          ? "Move tool: hover a vertex to lock the 3D pointer onto it, click to select that vertex, hold Shift while clicking to add it to the current selection, and drag to move the selected vertices together with the pointer."
          : modelingTool === "rotate"
            ? "Rotate tool: select one or more vertices, then drag the sphere gizmo to rotate them around their average center. Press M for Move or R for Rotate."
            : modelingTool === "vertex"
              ? `Vertex tool: click to place vertices at the 3D pointer, use the wheel for cursor depth, hold Shift for ${modelingPointerDepthPrecisionScale.toFixed(2)}x depth and snap precision, switch cursor planes with 1, 2, 3, and let the pointer snap to nearby vertices, edges, or faces when enabled.`
              : modelingTool === "line"
                ? `Line tool: drag and drop to create a vertex, edge, and vertex, use Shift for ${modelingPointerDepthPrecisionScale.toFixed(2)}x depth and snap precision, hold Ctrl while dragging to constrain the line to world ${formatAngleSnapStepDeg(modelingLineAngleSnapStepDeg)} degree directions on the main planes, and reuse or split existing geometry when the 3D pointer is snapped onto vertices or edges.`
                : modelingTool === "rectangle"
                  ? `Rectangle tool: drag a diagonal to create a shape, use Shift for ${modelingPointerDepthPrecisionScale.toFixed(2)}x depth and snap precision, and compare the experimental modes: +Y fixed keeps world up fixed, +X fixed keeps world +X fixed, +Z fixed keeps world +Z fixed, left-square makes a square from the diagonal plus a fixed left direction, and XZ plane lays the shape on the XZ plane.`
                  : modelingTool === "box"
                    ? "Box tool: drag a diagonal to create an axis-aligned cuboid. The generated edges stay parallel to the world X, Y, and Z axes, and nearby snapped vertices or edges are reused or split at the drag endpoints."
                    : "";

  useEffect(() => {
    let animationFrameId = 0;
    let frameCount = 0;
    let windowStart = performance.now();

    const updateFps = (timestamp: number) => {
      frameCount += 1;
      const elapsed = timestamp - windowStart;

      if (elapsed >= 250) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        windowStart = timestamp;
      }

      animationFrameId = window.requestAnimationFrame(updateFps);
    };

    animationFrameId = window.requestAnimationFrame(updateFps);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <aside className="pointer-events-none absolute inset-x-3 bottom-3 z-20 border border-white/12 bg-slate-950/82 px-3 py-3 text-slate-50 shadow-[0_16px_32px_rgba(3,10,20,0.22)] backdrop-blur md:inset-x-4 md:bottom-4">
      <div className="flex flex-nowrap items-center gap-3 overflow-hidden text-[0.76rem] leading-5 whitespace-nowrap">
        {hudEntries.map(([label, value]) => (
          <div
            className="grid shrink-0 grid-cols-[4rem_auto] items-baseline gap-1.5"
            key={label}
          >
            <span className="w-[4rem] text-slate-300/62">{label}</span>
            <span
              className={`overflow-hidden text-ellipsis font-medium tabular-nums text-slate-50 ${
                HUD_VALUE_WIDTH_CLASSES[label] ?? "w-[10ch]"
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 border-t border-white/8 pt-2 text-[0.72rem] leading-5 text-slate-200/78">
        {helperText}
      </p>
    </aside>
  );
}
