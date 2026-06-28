import { Move3d, Rotate3d } from "lucide-react";
import type { ComponentType } from "react";
import { type InteractionMode, useUiStore } from "../store/uiStore";

const toolButtons = [
  {
    description: "screen-depth drag",
    label: "Move",
    mode: "move",
  },
  {
    description: "arcball rotate",
    label: "Rotate",
    mode: "rotate",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  label: string;
  mode: InteractionMode;
}>;

const modeIcons: Record<
  InteractionMode,
  ComponentType<{ "aria-hidden"?: boolean; className?: string }>
> = {
  move: Move3d,
  rotate: Rotate3d,
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
                  ? "Switch to Move tool"
                  : "Switch to Rotate tool"
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
                <Icon aria-hidden={true} className="h-4 w-4" />
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
