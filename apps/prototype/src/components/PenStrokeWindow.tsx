import { X } from "lucide-react";
import { useEffect } from "react";
import { useModelingStore } from "../store/modelingStore";
import { useUiStore } from "../store/uiStore";

function PenNumberField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max?: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="grid gap-1 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-slate-400">
      {label}
      <input
        className="h-8 border border-white/10 bg-slate-950/72 px-2 text-[0.72rem] font-semibold tracking-normal text-slate-100 outline-none transition focus:border-sky-300/55"
        max={max}
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

export function PenStrokeWindow() {
  const activePenStroke = useUiStore((state) => state.activePenStroke);
  const clearActivePenStroke = useUiStore(
    (state) => state.clearActivePenStroke,
  );
  const setActivePenStrokeParams = useUiStore(
    (state) => state.setActivePenStrokeParams,
  );
  const historyIndex = useModelingStore((state) => state.historyIndex);
  const updateLastPenStrokeFromPositions = useModelingStore(
    (state) => state.updateLastPenStrokeFromPositions,
  );

  useEffect(() => {
    if (activePenStroke && activePenStroke.historyIndex !== historyIndex) {
      clearActivePenStroke();
    }
  }, [activePenStroke, clearActivePenStroke, historyIndex]);

  if (!activePenStroke) {
    return null;
  }

  const setParams = (params: typeof activePenStroke.params) => {
    const updated = updateLastPenStrokeFromPositions(
      activePenStroke.rawPoints,
      params,
      activePenStroke.historyIndex,
    );

    if (updated) {
      setActivePenStrokeParams(params);
    }
  };

  return (
    <aside className="absolute bottom-20 right-3 z-20 w-64 border border-white/12 bg-slate-950/84 text-slate-100 shadow-[0_14px_28px_rgba(3,10,20,0.26)] backdrop-blur md:right-4">
      <div className="grid grid-cols-[1fr_auto] items-center border-b border-white/8 px-3 py-2">
        <h2 className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-slate-300">
          Pen Stroke
        </h2>
        <button
          aria-label="Close Pen Stroke"
          className="inline-flex h-7 w-7 items-center justify-center text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-50"
          onClick={clearActivePenStroke}
          type="button"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="grid gap-3 px-3 py-3">
        <PenNumberField
          label="Smoothing"
          max={5}
          min={0}
          onChange={(smoothingIterations) =>
            setParams({
              ...activePenStroke.params,
              smoothingIterations,
            })
          }
          step={1}
          value={activePenStroke.params.smoothingIterations}
        />
        <PenNumberField
          label="Simplify"
          min={0}
          onChange={(simplificationDistance) =>
            setParams({
              ...activePenStroke.params,
              simplificationDistance,
            })
          }
          step={0.005}
          value={activePenStroke.params.simplificationDistance}
        />
        <PenNumberField
          label="Resample"
          min={0}
          onChange={(resampleSpacing) =>
            setParams({
              ...activePenStroke.params,
              resampleSpacing,
            })
          }
          step={0.01}
          value={activePenStroke.params.resampleSpacing}
        />
        <label className="grid grid-cols-[1fr_auto] items-center gap-2 text-[0.68rem] font-semibold text-slate-200">
          <span>Merge Vertices</span>
          <span className="relative inline-flex items-center">
            <input
              aria-label="Merge Vertices"
              checked={activePenStroke.params.mergeVertices}
              className="peer sr-only"
              onChange={(event) =>
                setParams({
                  ...activePenStroke.params,
                  mergeVertices: event.target.checked,
                })
              }
              type="checkbox"
            />
            <span className="block h-4.5 w-8 rounded-full bg-slate-400/35 transition peer-checked:bg-sky-300" />
            <span className="pointer-events-none absolute left-[2px] h-3.5 w-3.5 rounded-full bg-slate-50 transition peer-checked:translate-x-[14px]" />
          </span>
        </label>
        <PenNumberField
          label="Merge Distance"
          min={0}
          onChange={(mergeDistance) =>
            setParams({
              ...activePenStroke.params,
              mergeDistance,
            })
          }
          step={0.01}
          value={activePenStroke.params.mergeDistance}
        />
      </div>
    </aside>
  );
}
