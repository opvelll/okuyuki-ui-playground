import { Fragment, useEffect, useState } from "react";
import { useModelingStore } from "../store/modelingStore";
import { getEffectiveModelingTool, useUiStore } from "../store/uiStore";

const OVERLAY_DISPLAY_LABELS = {
  "mode-1": "1",
  "mode-2": "2",
  "mode-3": "3",
  "modes-1-2-3": "1 + 2 + 3",
  "modes-2-3": "2 + 3",
} as const;
const OVERLAY_MODE_LABELS = {
  "camera-facing": "camera-fit",
  "screen-horizontal": "up-facing",
  "screen-vertical": "world-y plane",
} as const;
const AXIS_DIRECTION_LABELS = {
  negative: "-",
  positive: "+",
} as const;
const AXIS_REFERENCE_FRAME_LABELS = {
  local: "local",
  world: "world",
} as const;
const ALWAYS_SNAP_MODE_LABELS = {
  "axis-magnet": "axis",
  grid: "interval",
  off: "off",
} as const;
const GRID_SNAP_PATTERN_LABELS = {
  xyz: "xyz",
  xz: "xz",
} as const;
const ROTATE_TWIST_AXIS_LABELS = {
  "+x": "+X",
  "+y": "+Y",
  "+z": "+Z",
} as const;

export function SceneStatusHud() {
  const [fps, setFps] = useState(0);
  const axisMagnetTarget = useUiStore((state) => state.axisMagnetTarget);
  const currentScreen = useUiStore((state) => state.currentScreen);
  const interactionMode = useUiStore((state) => state.interactionMode);
  const interactionState = useUiStore((state) => state.interactionState);
  const modelingCurrentModelId = useModelingStore(
    (state) => state.currentModelId,
  );
  const modelingHistory = useModelingStore((state) => state.history);
  const modelingHistoryIndex = useModelingStore((state) => state.historyIndex);
  const modelingModelsById = useModelingStore((state) => state.modelsById);
  const modelingSelectedVertexIds = useModelingStore(
    (state) => state.selectedVertexIds,
  );
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
  const modelingPointerVisibleInCameraTool = useUiStore(
    (state) => state.modelingPointerVisibleInCameraTool,
  );
  const modelingTool = useUiStore((state) => state.modelingTool);
  const moveDepthWheelDirection = useUiStore(
    (state) => state.moveDepthWheelDirection,
  );
  const moveAlwaysSnapMode = useUiStore((state) => state.moveAlwaysSnapMode);
  const moveAxisMagnetReferenceFrame = useUiStore(
    (state) => state.moveAxisMagnetReferenceFrame,
  );
  const moveGridSnapPattern = useUiStore((state) => state.moveGridSnapPattern);
  const moveGridSnapStep = useUiStore((state) => state.moveGridSnapStep);
  const moveOverlayDisplayMode = useUiStore(
    (state) => state.moveOverlayDisplayMode,
  );
  const moveOverlayOrientationMode = useUiStore(
    (state) => state.moveOverlayOrientationMode,
  );
  const moveDepthWheelStep = useUiStore((state) => state.moveDepthWheelStep);
  const movePrecisionStep = useUiStore((state) => state.movePrecisionStep);
  const physicsEnabled = useUiStore((state) => state.physicsEnabled);
  const rotateTwistAxis = useUiStore((state) => state.rotateTwistAxis);
  const rotateArcballSensitivity = useUiStore(
    (state) => state.rotateArcballSensitivity,
  );
  const rotateDragReleaseBehavior = useUiStore(
    (state) => state.rotateDragReleaseBehavior,
  );
  const rotateAngleSnapStepDeg = useUiStore(
    (state) => state.rotateAngleSnapStepDeg,
  );
  const rotateUiOpacity = useUiStore((state) => state.rotateUiOpacity);
  const rotateUiRadiusPx = useUiStore((state) => state.rotateUiRadiusPx);
  const rotateWheelDirection = useUiStore(
    (state) => state.rotateWheelDirection,
  );
  const rotateWheelRotateStepDeg = useUiStore(
    (state) => state.rotateWheelRotateStepDeg,
  );
  const selectedObjectId = useUiStore((state) => state.selectedObjectId);
  const showFps = useUiStore((state) => state.showFps);
  const effectiveModelingTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });
  const activeModel = modelingModelsById[modelingCurrentModelId];
  const hudItems =
    currentScreen === "modeling"
      ? [
          ["screen", currentScreen],
          ["model", activeModel?.name ?? "none"],
          [
            "tool",
            `${effectiveModelingTool === "camera" ? "camera" : modelingTool}${
              effectiveModelingTool === "pointer" && modelingCameraOverride
                ? " (space)"
                : ""
            }`,
          ],
          [
            "mesh",
            `${activeModel?.vertexOrder.length ?? 0}v / ${
              activeModel?.edgeOrder.length ?? 0
            }e / ${activeModel?.faceOrder.length ?? 0}f`,
          ],
          ["select", `${modelingSelectedVertexIds.length} vertices`],
          ["depth", modelingPointer.depth.toFixed(2)],
          ["plane", modelingPointer.plane],
          [
            "pointer",
            modelingPointer.hovered &&
            (effectiveModelingTool === "pointer" ||
              modelingPointerVisibleInCameraTool)
              ? "visible"
              : "hidden",
          ],
          [
            "history",
            `${modelingHistoryIndex + 1} / ${modelingHistory.length}`,
          ],
          [
            "pos",
            modelingPointer.position
              .map((value) => value.toFixed(2))
              .join(", "),
          ],
          ["state", interactionState],
        ]
      : interactionMode === "move"
        ? [
            ["screen", currentScreen],
            ["selected", selectedObjectId ?? "none"],
            [
              "depth",
              `${moveDepthWheelStep.toFixed(2)} / ${moveDepthWheelDirection}`,
            ],
            [
              "snap",
              `shift ${movePrecisionStep.toFixed(2)} / interval ${moveGridSnapStep.toFixed(
                2,
              )} (${GRID_SNAP_PATTERN_LABELS[moveGridSnapPattern]})`,
            ],
            [
              "magnet",
              axisMagnetTarget
                ? `${axisMagnetTarget.objectId} / ${
                    AXIS_REFERENCE_FRAME_LABELS[moveAxisMagnetReferenceFrame]
                  } ${axisMagnetTarget.axis}${
                    AXIS_DIRECTION_LABELS[axisMagnetTarget.direction]
                  }`
                : `none / ${ALWAYS_SNAP_MODE_LABELS[moveAlwaysSnapMode]} / ${
                    AXIS_REFERENCE_FRAME_LABELS[moveAxisMagnetReferenceFrame]
                  }`,
            ],
            [
              "overlay",
              `${OVERLAY_DISPLAY_LABELS[moveOverlayDisplayMode]} / ${
                OVERLAY_MODE_LABELS[moveOverlayOrientationMode]
              }`,
            ],
          ]
        : [
            ["screen", currentScreen],
            ["selected", selectedObjectId ?? "none"],
            ["arcball", `${rotateArcballSensitivity.toFixed(2)}x`],
            ["radius", `${rotateUiRadiusPx.toFixed(0)} px`],
            ["strength", rotateUiOpacity.toFixed(2)],
            [
              "twist",
              `${rotateWheelRotateStepDeg.toFixed(0)} deg / ${rotateWheelDirection}`,
            ],
            ["snap", `ctrl + shift ${rotateAngleSnapStepDeg.toFixed(0)} deg`],
            ["release", rotateDragReleaseBehavior],
            ["axis", ROTATE_TWIST_AXIS_LABELS[rotateTwistAxis]],
          ];

  const helperText =
    currentScreen === "modeling"
      ? effectiveModelingTool === "camera"
        ? "Camera tool: left drag rotates, wheel dollies, right drag slides, and releasing Space after starting a drag keeps camera control until the drag ends."
        : modelingTool === "vertex"
          ? `Vertex tool: click to place vertices at the 3D pointer, use the wheel for cursor depth, hold Shift for ${modelingPointerDepthPrecisionScale.toFixed(2)}x depth and grid precision, switch cursor planes with 1, 2, 3, and let the pointer snap to nearby vertices or edges when enabled.`
          : modelingTool === "line"
            ? `Line tool: drag and drop to create a vertex, edge, and vertex, use Shift for ${modelingPointerDepthPrecisionScale.toFixed(2)}x depth and grid precision, and reuse or split existing geometry when the 3D pointer is snapped onto vertices or edges.`
            : `Select tool: click near a vertex to select it, hold Shift for multi-select and ${modelingPointerDepthPrecisionScale.toFixed(2)}x depth and grid precision, press Delete to remove selected vertices, press E for an edge, press F for a face, and hold Space for temporary camera control.`
      : interactionMode === "move"
        ? physicsEnabled
          ? selectedObjectId
            ? "Physics enabled: drag to move on the screen plane and use the wheel for depth. Released objects rejoin the simulation."
            : "Physics enabled: select an object to start screen-depth-drag editing."
          : selectedObjectId
            ? "Drag to move on screen plane. Wheel changes camera depth. Shift reduces wheel depth step, Ctrl magnetizes one axis to another object, and Shift + Ctrl applies interval snap. Move UI settings can keep either axis or interval snapping always on."
            : "Select an object to start screen-depth-drag editing."
        : selectedObjectId
          ? "Rotate mode: drag the sphere gizmo for arcball rotation, hold Ctrl to snap the arc to an XYZ ring, hold Ctrl + Shift for fixed-angle snap, and use the wheel for twist. Selection is cleared by clicking empty space, pressing Escape, or switching to Move UI."
          : "Rotate mode: select an object to show the sphere gizmo.";

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
    <aside className="pointer-events-none absolute bottom-3 left-3 z-20 w-[min(24rem,calc(100%-1.5rem))] border border-white/12 bg-slate-950/82 px-3 py-3 text-slate-50 shadow-[0_16px_32px_rgba(3,10,20,0.22)] backdrop-blur md:bottom-4 md:left-4 md:w-[22rem]">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-sky-100/62">
        {currentScreen === "modeling"
          ? "Modeling Screen"
          : interactionMode === "move"
            ? "Object Move"
            : "Object Rotate"}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.8rem] leading-5">
        {showFps ? (
          <Fragment>
            <dt className="text-slate-300/62">fps</dt>
            <dd>{fps}</dd>
          </Fragment>
        ) : null}
        {hudItems.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="text-slate-300/62">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </Fragment>
        ))}
      </dl>
      <p className="mt-2 border-t border-white/8 pt-2 text-[0.74rem] leading-5 text-slate-200/78">
        {helperText}
      </p>
    </aside>
  );
}
