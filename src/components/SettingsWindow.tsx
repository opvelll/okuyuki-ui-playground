import { useUiStore } from "../store/uiStore";

const panelClasses =
  "absolute right-3 top-3 z-20 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-[1.4rem] border border-white/15 bg-slate-950/72 shadow-[0_22px_48px_rgba(3,10,20,0.34)] backdrop-blur-xl md:right-4 md:top-4";
const sectionHeadingClasses =
  "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-sky-100/70";
const fieldClasses =
  "min-h-11 w-full rounded-2xl border border-white/12 bg-slate-900/80 px-3 text-sm text-slate-50 outline-none transition focus:border-sky-200/60 focus:ring-2 focus:ring-sky-300/40";

export function SettingsWindow() {
  const physicsEnabled = useUiStore((state) => state.physicsEnabled);
  const moveDepthWheelDirection = useUiStore(
    (state) => state.moveDepthWheelDirection,
  );
  const moveDepthWheelStep = useUiStore((state) => state.moveDepthWheelStep);
  const moveMode = useUiStore((state) => state.moveMode);
  const settingsOpen = useUiStore((state) => state.settingsOpen);
  const setPhysicsEnabled = useUiStore((state) => state.setPhysicsEnabled);
  const setMoveDepthWheelDirection = useUiStore(
    (state) => state.setMoveDepthWheelDirection,
  );
  const setMoveDepthWheelStep = useUiStore(
    (state) => state.setMoveDepthWheelStep,
  );
  const setMoveMode = useUiStore((state) => state.setMoveMode);
  const toggleSettingsOpen = useUiStore((state) => state.toggleSettingsOpen);

  const handleDepthStepChange = (value: string) => {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) {
      setMoveDepthWheelStep(parsedValue);
    }
  };

  return (
    <aside aria-label="Settings window" className={panelClasses}>
      <button
        aria-expanded={settingsOpen}
        aria-label={settingsOpen ? "Collapse settings" : "Expand settings"}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-50 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-sky-300/50"
        onClick={toggleSettingsOpen}
        type="button"
      >
        <span>Settings</span>
        <span className="inline-flex w-6 justify-center text-base leading-none text-sky-300">
          {settingsOpen ? "−" : "+"}
        </span>
      </button>
      {settingsOpen ? (
        <div className="grid gap-4 px-4 pb-4">
          <section aria-labelledby="scene-settings" className="grid gap-2 pt-1">
            <h2 className={sectionHeadingClasses} id="scene-settings">
              Scene
            </h2>
            <label
              className="grid grid-cols-[1fr_auto] items-center gap-4 text-sm text-slate-100/90"
              htmlFor="physics-toggle"
            >
              <span>Physics</span>
              <span className="relative inline-flex items-center">
                <input
                  aria-label="Physics"
                  checked={physicsEnabled}
                  className="peer sr-only"
                  id="physics-toggle"
                  onChange={(event) => setPhysicsEnabled(event.target.checked)}
                  type="checkbox"
                />
                <span className="block h-6 w-11 rounded-full bg-slate-400/35 transition peer-checked:bg-sky-300" />
                <span className="pointer-events-none absolute left-[3px] h-[18px] w-[18px] rounded-full bg-slate-50 transition peer-checked:translate-x-[18px]" />
              </span>
            </label>
          </section>
          <section aria-labelledby="move-settings" className="grid gap-3 pt-1">
            <h2 className={sectionHeadingClasses} id="move-settings">
              Move UI
            </h2>
            <label
              className="grid gap-2 text-sm text-slate-100/90"
              htmlFor="move-mode"
            >
              <span>Mode</span>
              <select
                className={fieldClasses}
                id="move-mode"
                onChange={(event) => {
                  const nextMode = event.target.value;
                  if (nextMode === "screen-depth-drag") {
                    setMoveMode(nextMode);
                  }
                }}
                value={moveMode}
              >
                <option value="screen-depth-drag">screen-depth-drag</option>
              </select>
            </label>
            <label
              className="grid gap-2 text-sm text-slate-100/90"
              htmlFor="depth-step"
            >
              <span>Depth Wheel Step</span>
              <input
                className={fieldClasses}
                id="depth-step"
                max="2"
                min="0.01"
                onChange={(event) => handleDepthStepChange(event.target.value)}
                step="0.01"
                type="number"
                value={moveDepthWheelStep}
              />
            </label>
            <label
              className="grid gap-2 text-sm text-slate-100/90"
              htmlFor="depth-direction"
            >
              <span>Depth Direction</span>
              <select
                className={fieldClasses}
                id="depth-direction"
                onChange={(event) => {
                  const nextDirection = event.target.value;
                  if (
                    nextDirection === "normal" ||
                    nextDirection === "inverted"
                  ) {
                    setMoveDepthWheelDirection(nextDirection);
                  }
                }}
                value={moveDepthWheelDirection}
              >
                <option value="normal">normal</option>
                <option value="inverted">inverted</option>
              </select>
            </label>
          </section>
        </div>
      ) : null}
    </aside>
  );
}
