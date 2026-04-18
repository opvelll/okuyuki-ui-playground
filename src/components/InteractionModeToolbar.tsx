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
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
    >
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
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
    >
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
    <aside className="absolute left-3 top-3 z-20 w-48 border border-white/12 bg-slate-950/78 shadow-[0_14px_28px_rgba(3,10,20,0.22)] backdrop-blur md:left-4 md:top-4">
      <p className="border-b border-white/8 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-sky-100/62">
        Tool
      </p>
      <div className="grid">
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
              className={`grid grid-cols-[auto_1fr] items-center gap-2 border-b border-white/8 px-3 py-2 text-left text-[0.76rem] transition last:border-b-0 ${
                active
                  ? "bg-sky-300/10 text-slate-50"
                  : "text-slate-300 hover:bg-white/[0.04]"
              }`}
              key={toolButton.mode}
              onClick={() => setInteractionMode(toolButton.mode)}
              title={toolButton.description}
              type="button"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center text-sky-200">
                <Icon />
              </span>
              <span className="min-w-0 font-semibold">{toolButton.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
