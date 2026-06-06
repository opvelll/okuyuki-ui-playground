import { useUiStore } from "../store/uiStore";

export function SurfaceSnapToggle() {
  const interactionMode = useUiStore((state) => state.interactionMode);
  const surfaceSnapEnabled = useUiStore((state) => state.surfaceSnapEnabled);
  const setSurfaceSnapEnabled = useUiStore(
    (state) => state.setSurfaceSnapEnabled,
  );

  if (interactionMode !== "move") {
    return null;
  }

  return (
    <label className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 cursor-pointer items-center gap-3 rounded-full border border-white/15 bg-slate-950/72 px-4 py-2 text-sm font-semibold text-slate-100 shadow-[0_18px_40px_rgba(3,10,20,0.3)] backdrop-blur-xl md:top-4">
      <input
        checked={surfaceSnapEnabled}
        className="h-4 w-4 accent-sky-300"
        onChange={(event) => setSurfaceSnapEnabled(event.target.checked)}
        type="checkbox"
      />
      <span>面に吸着</span>
    </label>
  );
}
