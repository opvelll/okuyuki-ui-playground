import { useUiStore } from "../store/uiStore";

const OVERLAY_MODE_LABELS = {
  "camera-facing": "camera-fit",
  "screen-horizontal": "world-x plane",
  "screen-vertical": "world-y plane",
} as const;

export function SceneStatusHud() {
  const interactionState = useUiStore((state) => state.interactionState);
  const moveDepthWheelDirection = useUiStore(
    (state) => state.moveDepthWheelDirection,
  );
  const moveOverlayOrientationMode = useUiStore(
    (state) => state.moveOverlayOrientationMode,
  );
  const moveDepthWheelStep = useUiStore((state) => state.moveDepthWheelStep);
  const moveMode = useUiStore((state) => state.moveMode);
  const physicsEnabled = useUiStore((state) => state.physicsEnabled);
  const selectedObjectId = useUiStore((state) => state.selectedObjectId);

  const helperText = physicsEnabled
    ? "Physics enabled: object dragging is paused."
    : selectedObjectId
      ? "Drag to move on screen plane. Wheel changes camera depth. Key 1 is camera-facing, 2 uses world Y, 3 uses world X."
      : "Select an object to start screen-depth-drag editing.";

  return (
    <aside className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-[min(24rem,calc(100vw-3rem))] rounded-[1.35rem] border border-white/12 bg-slate-950/68 px-4 py-3 text-slate-50 shadow-[0_18px_40px_rgba(3,10,20,0.3)] backdrop-blur-xl md:bottom-4 md:left-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sky-100/70">
        Object Move
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
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <dt className="text-slate-300/70">Mode</dt>
          <dd>{moveMode}</dd>
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <dt className="text-slate-300/70">Depth</dt>
          <dd>
            {moveDepthWheelStep.toFixed(2)} / {moveDepthWheelDirection}
          </dd>
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <dt className="text-slate-300/70">Overlay</dt>
          <dd>{OVERLAY_MODE_LABELS[moveOverlayOrientationMode]}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-slate-200/85">{helperText}</p>
    </aside>
  );
}
