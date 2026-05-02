import { Settings2 } from "lucide-react";
import { Suspense, lazy } from "react";
import { InteractionModeHotkeys } from "./components/InteractionModeHotkeys";
import { InteractionModeToolbar } from "./components/InteractionModeToolbar";
import { PrototypeSceneFallback } from "./components/PrototypeSceneFallback";
import { SceneStatusHud } from "./components/SceneStatusHud";
import { SettingsWindow } from "./components/SettingsWindow";
import { useUiStore } from "./store/uiStore";

const PrototypeScene = lazy(async () => {
  const module = await import("./components/PrototypeScene");
  return { default: module.PrototypeScene };
});

export default function App() {
  const settingsOpen = useUiStore((state) => state.settingsOpen);
  const setSettingsOpen = useUiStore((state) => state.setSettingsOpen);

  return (
    <main className="flex h-screen min-h-screen flex-col gap-3 overflow-hidden px-3 py-3 md:gap-4 md:px-4 md:py-4">
      <header className="shrink-0 border-b border-white/10 pb-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-6">
        <div>
          <h1 className="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-slate-50/90">
            Okuyuki Prototype
          </h1>
          <p className="mt-1 max-w-xl text-[0.78rem] leading-5 text-slate-200/62">
            Screen-depth-drag driven object editing prototype for React Three
            Fiber.
          </p>
        </div>
        <button
          aria-expanded={settingsOpen}
          aria-label={settingsOpen ? "Close settings" : "Open settings"}
          className={`mt-3 inline-flex h-11 w-11 items-center justify-center border transition lg:mt-0 ${
            settingsOpen
              ? "border-sky-300/50 bg-sky-300/12 text-slate-50"
              : "border-white/10 bg-slate-950/30 text-slate-300 hover:bg-white/[0.04]"
          }`}
          onClick={() => setSettingsOpen(!settingsOpen)}
          type="button"
        >
          <Settings2 aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </button>
      </header>
      <section className="relative flex min-h-0 flex-1">
        <InteractionModeHotkeys />
        <Suspense fallback={<PrototypeSceneFallback />}>
          <PrototypeScene />
        </Suspense>
        <InteractionModeToolbar />
        <SettingsWindow />
        <SceneStatusHud />
      </section>
    </main>
  );
}
