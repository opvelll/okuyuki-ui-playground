import { useState } from "react";
import {
  type MoveDepthWheelDirection,
  type MoveOverlayDisplayMode,
  useUiStore,
} from "../store/uiStore";

const panelClasses =
  "absolute right-3 top-3 z-20 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-[1.4rem] border border-white/15 bg-slate-950/72 shadow-[0_22px_48px_rgba(3,10,20,0.34)] backdrop-blur-xl md:right-4 md:top-4";
const sectionHeadingClasses =
  "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-sky-100/70";
const fieldClasses =
  "min-h-11 w-full rounded-2xl border border-white/12 bg-slate-900/80 px-3 text-sm text-slate-50 outline-none transition focus:border-sky-200/60 focus:ring-2 focus:ring-sky-300/40";

const overlayDisplayOptions = [
  { label: "1", value: "mode-1" },
  { label: "2", value: "mode-2" },
  { label: "3", value: "mode-3" },
  { label: "2 + 3", value: "modes-2-3" },
  { label: "1 + 2 + 3", value: "modes-1-2-3" },
] as const;

const depthDirectionOptions = [
  { label: "normal", value: "normal" },
  { label: "inverted", value: "inverted" },
] as const;

const isOverlayDisplayMode = (value: string): value is MoveOverlayDisplayMode =>
  overlayDisplayOptions.some((option) => option.value === value);

const isDepthDirection = (value: string): value is MoveDepthWheelDirection =>
  depthDirectionOptions.some((option) => option.value === value);

const parseNumberInput = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export function SettingsWindow() {
  const [settingsOpen, setSettingsOpen] = useState(true);
  const physicsEnabled = useUiStore((state) => state.physicsEnabled);
  const moveDepthWheelDirection = useUiStore(
    (state) => state.moveDepthWheelDirection,
  );
  const moveGridSnapStep = useUiStore((state) => state.moveGridSnapStep);
  const moveOverlayDisplayMode = useUiStore(
    (state) => state.moveOverlayDisplayMode,
  );
  const moveOverlayRadiusMultiplier = useUiStore(
    (state) => state.moveOverlayRadiusMultiplier,
  );
  const moveDepthWheelStep = useUiStore((state) => state.moveDepthWheelStep);
  const movePrecisionStep = useUiStore((state) => state.movePrecisionStep);
  const setPhysicsEnabled = useUiStore((state) => state.setPhysicsEnabled);
  const setMoveDepthWheelDirection = useUiStore(
    (state) => state.setMoveDepthWheelDirection,
  );
  const setMoveGridSnapStep = useUiStore((state) => state.setMoveGridSnapStep);
  const setMoveOverlayDisplayMode = useUiStore(
    (state) => state.setMoveOverlayDisplayMode,
  );
  const setMoveOverlayRadiusMultiplier = useUiStore(
    (state) => state.setMoveOverlayRadiusMultiplier,
  );
  const setMoveDepthWheelStep = useUiStore(
    (state) => state.setMoveDepthWheelStep,
  );
  const setMovePrecisionStep = useUiStore(
    (state) => state.setMovePrecisionStep,
  );

  const handleNumberChange =
    (setter: (value: number) => void) => (value: string) => {
      const parsedValue = parseNumberInput(value);
      if (parsedValue !== null) {
        setter(parsedValue);
      }
    };

  return (
    <aside aria-label="Settings window" className={panelClasses}>
      <button
        aria-expanded={settingsOpen}
        aria-label={settingsOpen ? "Collapse settings" : "Expand settings"}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-50 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-sky-300/50"
        onClick={() => setSettingsOpen((currentValue) => !currentValue)}
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
              htmlFor="overlay-display-mode"
            >
              <span>Overlay Display</span>
              <select
                className={fieldClasses}
                id="overlay-display-mode"
                onChange={(event) => {
                  const nextDisplayMode = event.target.value;
                  if (isOverlayDisplayMode(nextDisplayMode)) {
                    setMoveOverlayDisplayMode(nextDisplayMode);
                  }
                }}
                value={moveOverlayDisplayMode}
              >
                {overlayDisplayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label
              className="grid gap-2 text-sm text-slate-100/90"
              htmlFor="precision-step"
            >
              <span>Shift Depth Step</span>
              <input
                className={fieldClasses}
                id="precision-step"
                max="2"
                min="0.01"
                onChange={(event) =>
                  handleNumberChange(setMovePrecisionStep)(event.target.value)
                }
                step="0.01"
                type="number"
                value={movePrecisionStep}
              />
            </label>
            <label
              className="grid gap-2 text-sm text-slate-100/90"
              htmlFor="grid-snap-step"
            >
              <span>Ctrl Grid Snap Step</span>
              <input
                className={fieldClasses}
                id="grid-snap-step"
                max="4"
                min="0.01"
                onChange={(event) =>
                  handleNumberChange(setMoveGridSnapStep)(event.target.value)
                }
                step="0.01"
                type="number"
                value={moveGridSnapStep}
              />
            </label>
            <label
              className="grid gap-2 text-sm text-slate-100/90"
              htmlFor="overlay-radius-multiplier"
            >
              <span>Overlay Radius Multiplier</span>
              <input
                className={fieldClasses}
                id="overlay-radius-multiplier"
                max="4"
                min="1"
                onChange={(event) =>
                  handleNumberChange(setMoveOverlayRadiusMultiplier)(
                    event.target.value,
                  )
                }
                step="0.1"
                type="number"
                value={moveOverlayRadiusMultiplier}
              />
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
                onChange={(event) =>
                  handleNumberChange(setMoveDepthWheelStep)(event.target.value)
                }
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
                  if (isDepthDirection(nextDirection)) {
                    setMoveDepthWheelDirection(nextDirection);
                  }
                }}
                value={moveDepthWheelDirection}
              >
                {depthDirectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>
      ) : null}
    </aside>
  );
}
