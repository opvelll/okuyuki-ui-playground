import { useEffect, useState } from "react";
import { useUiStore } from "../store/uiStore";

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
const ROTATE_TWIST_AXIS_LABELS = {
  "+x": "+X",
  "+y": "+Y",
  "+z": "+Z",
} as const;

export function SceneStatusHud() {
  const [fps, setFps] = useState(0);
  const axisMagnetTarget = useUiStore((state) => state.axisMagnetTarget);
  const interactionMode = useUiStore((state) => state.interactionMode);
  const interactionState = useUiStore((state) => state.interactionState);
  const moveDepthWheelDirection = useUiStore(
    (state) => state.moveDepthWheelDirection,
  );
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

  const helperText =
    interactionMode === "move"
      ? physicsEnabled
        ? selectedObjectId
          ? "Physics enabled: drag to move on the screen plane and use the wheel for depth. Released objects rejoin the simulation."
          : "Physics enabled: select an object to start screen-depth-drag editing."
        : selectedObjectId
          ? "Drag to move on screen plane. Wheel changes camera depth. Shift reduces wheel depth step, Ctrl snaps XYZ to the floor grid, and Shift + Ctrl magnetizes one axis to another object."
          : "Select an object to start screen-depth-drag editing."
      : selectedObjectId
        ? "Rotate mode: drag the sphere gizmo for arcball rotation, hold Ctrl to snap the arc to an XYZ ring, and use the wheel for twist. Selection is cleared by clicking empty space, pressing Escape, or switching to Move UI."
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
    <aside className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[min(24rem,calc(100vw-3rem))] rounded-[1.35rem] border border-white/12 bg-slate-950/68 px-4 py-3 text-slate-50 shadow-[0_18px_40px_rgba(3,10,20,0.3)] backdrop-blur-xl md:bottom-4 md:left-4 md:z-20">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sky-100/70">
        {interactionMode === "move" ? "Object Move" : "Object Rotate"}
      </p>
      <dl className="mt-2 grid gap-2 text-sm">
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <dt className="text-slate-300/70">Selected</dt>
          <dd>{selectedObjectId ?? "none"}</dd>
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <dt className="text-slate-300/70">State</dt>
          <dd>{interactionState}</dd>
        </div>
        {showFps ? (
          <div className="grid grid-cols-[5rem_1fr] gap-3">
            <dt className="text-slate-300/70">FPS</dt>
            <dd>{fps}</dd>
          </div>
        ) : null}
        {interactionMode === "move" ? (
          <>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Depth</dt>
              <dd>
                {moveDepthWheelStep.toFixed(2)} / {moveDepthWheelDirection}
              </dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Snap</dt>
              <dd>
                shift {movePrecisionStep.toFixed(2)} / ctrl{" "}
                {moveGridSnapStep.toFixed(2)}
              </dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Magnet</dt>
              <dd>
                {axisMagnetTarget
                  ? `${axisMagnetTarget.objectId} / ${axisMagnetTarget.axis}${AXIS_DIRECTION_LABELS[axisMagnetTarget.direction]}`
                  : "none"}
              </dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Overlay</dt>
              <dd>
                {OVERLAY_DISPLAY_LABELS[moveOverlayDisplayMode]} /{" "}
                {OVERLAY_MODE_LABELS[moveOverlayOrientationMode]}
              </dd>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Arcball</dt>
              <dd>{rotateArcballSensitivity.toFixed(2)}x</dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Radius</dt>
              <dd>{rotateUiRadiusPx.toFixed(0)} px</dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Strength</dt>
              <dd>{rotateUiOpacity.toFixed(2)}</dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Twist</dt>
              <dd>
                {rotateWheelRotateStepDeg.toFixed(0)} deg /{" "}
                {rotateWheelDirection}
              </dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Release</dt>
              <dd>{rotateDragReleaseBehavior}</dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-slate-300/70">Axis</dt>
              <dd>{ROTATE_TWIST_AXIS_LABELS[rotateTwistAxis]}</dd>
            </div>
          </>
        )}
      </dl>
      <p className="mt-3 text-sm text-slate-200/85">{helperText}</p>
    </aside>
  );
}
