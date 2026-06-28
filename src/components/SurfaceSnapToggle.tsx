import { useUiStore } from "../store/uiStore";

const checkboxClasses = "h-4 w-4 accent-sky-300";
const optionClasses =
  "flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-semibold text-slate-100";

export function SurfaceSnapToggle() {
  const interactionMode = useUiStore((state) => state.interactionMode);
  const transformStage = useUiStore((state) => state.transformStage);
  const moveAlwaysSnapMode = useUiStore((state) => state.moveAlwaysSnapMode);
  const rotateArcballSensitivity = useUiStore(
    (state) => state.rotateArcballSensitivity,
  );
  const surfaceSnapEnabled = useUiStore((state) => state.surfaceSnapEnabled);
  const setMoveAlwaysSnapMode = useUiStore(
    (state) => state.setMoveAlwaysSnapMode,
  );
  const setRotateArcballSensitivity = useUiStore(
    (state) => state.setRotateArcballSensitivity,
  );
  const setSurfaceSnapEnabled = useUiStore(
    (state) => state.setSurfaceSnapEnabled,
  );

  if (transformStage !== "move" && transformStage !== "rotate") {
    return null;
  }

  return (
    <aside
      aria-label={
        interactionMode === "move"
          ? "Move quick settings"
          : "Rotate quick settings"
      }
      className="absolute left-1/2 top-44 z-30 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-4 overflow-x-auto rounded-2xl border border-white/15 bg-slate-950/72 px-4 py-3 shadow-[0_18px_40px_rgba(3,10,20,0.3)] backdrop-blur-xl md:left-[calc(50%-8.5rem)] md:top-4"
    >
      <span className="whitespace-nowrap text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sky-100/70">
        {interactionMode === "move" ? "Move" : "Rotate"}
      </span>
      {interactionMode === "move" ? (
        <div className="flex items-center gap-4">
          <label className={optionClasses}>
            <input
              checked={surfaceSnapEnabled}
              className={checkboxClasses}
              onChange={(event) => setSurfaceSnapEnabled(event.target.checked)}
              type="checkbox"
            />
            <span>面に吸着</span>
          </label>
          <label className={optionClasses}>
            <input
              checked={moveAlwaysSnapMode === "axis-magnet"}
              className={checkboxClasses}
              onChange={(event) =>
                setMoveAlwaysSnapMode(
                  event.target.checked ? "axis-magnet" : "off",
                )
              }
              type="checkbox"
            />
            <span>軸に吸着</span>
          </label>
          <label className={optionClasses}>
            <input
              checked={moveAlwaysSnapMode === "grid"}
              className={checkboxClasses}
              onChange={(event) =>
                setMoveAlwaysSnapMode(event.target.checked ? "grid" : "off")
              }
              type="checkbox"
            />
            <span>一定間隔に吸着</span>
          </label>
        </div>
      ) : (
        <label
          className="flex min-w-56 items-center gap-3 text-sm font-semibold text-slate-100"
          htmlFor="rotate-quick-sensitivity"
        >
          <span className="whitespace-nowrap">ドラッグ感度</span>
          <input
            aria-label="ドラッグ感度"
            className="w-28 accent-sky-300"
            id="rotate-quick-sensitivity"
            max="4"
            min="0.1"
            onChange={(event) =>
              setRotateArcballSensitivity(Number(event.target.value))
            }
            step="0.05"
            type="range"
            value={rotateArcballSensitivity}
          />
          <output
            className="w-12 text-right tabular-nums text-sky-200"
            htmlFor="rotate-quick-sensitivity"
          >
            {rotateArcballSensitivity.toFixed(2)}x
          </output>
        </label>
      )}
    </aside>
  );
}
