import type { ReactNode } from "react";
import { type InteractionMode, useUiStore } from "../store/uiStore";

const toolButtons = [
  {
    description: "screen-depth drag",
    label: "Move UI",
    mode: "move",
  },
  {
    description: "arcball rotate",
    label: "Rotate UI",
    mode: "rotate",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  label: string;
  mode: InteractionMode;
}>;

function MoveIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8.5 6.5A7 7 0 1 1 5 12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 7v5h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const modeIcons: Record<InteractionMode, () => ReactNode> = {
  move: MoveIcon,
  rotate: RotateIcon,
};

export function InteractionModeToolbar() {
  const interactionMode = useUiStore((state) => state.interactionMode);
  const setInteractionMode = useUiStore((state) => state.setInteractionMode);

  return (
    <aside className="absolute left-3 top-3 z-20 rounded-[1.2rem] border border-white/15 bg-slate-950/72 p-2 shadow-[0_18px_40px_rgba(3,10,20,0.3)] backdrop-blur-xl md:left-4 md:top-4">
      <p className="px-2 pb-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sky-100/70">
        Tool
      </p>
      <div className="grid gap-2">
        {toolButtons.map((toolButton) => {
          const active = toolButton.mode === interactionMode;
          const Icon = modeIcons[toolButton.mode];

          return (
            <button
              aria-label={
                toolButton.mode === "move"
                  ? "Switch to Move UI tool"
                  : "Switch to Rotate UI tool"
              }
              aria-pressed={active}
              className={`grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                active
                  ? "border-sky-300/45 bg-sky-300/12 text-slate-50"
                  : "border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
              }`}
              key={toolButton.mode}
              onClick={() => setInteractionMode(toolButton.mode)}
              type="button"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/6 text-sky-200">
                <Icon />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {toolButton.label}
                </span>
                <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">
                  {toolButton.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
