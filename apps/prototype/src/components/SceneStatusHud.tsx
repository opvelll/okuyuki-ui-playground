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

const HUD_VALUE_WIDTH_CLASSES: Partial<Record<string, string>> = {
  arcball: "w-[5ch]",
  axis: "w-[6ch]",
  depth: "w-[10ch]",
  fps: "w-[3ch]",
  magnet: "w-[14ch]",
  overlay: "w-[12ch]",
  radius: "w-[7ch]",
  release: "w-[10ch]",
  screen: "w-[8ch]",
  selected: "w-[10ch]",
  snap: "w-[18ch]",
  strength: "w-[6ch]",
  twist: "w-[11ch]",
};

export function SceneStatusHud() {
  const [fps, setFps] = useState(0);
  const axisMagnetTarget = useUiStore((state) => state.axisMagnetTarget);
  const interactionMode = useUiStore((state) => state.interactionMode);
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
  const hudItems =
    interactionMode === "move"
      ? [
          ["screen", "prototype"],
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
          ["screen", "prototype"],
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
  const hudEntries = showFps
    ? ([["fps", String(fps)] as const, ...hudItems] as const)
    : hudItems;

  const helperText =
    interactionMode === "move"
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
