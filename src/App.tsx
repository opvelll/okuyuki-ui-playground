import { Suspense, lazy } from "react";
import { InteractionModeHotkeys } from "./components/InteractionModeHotkeys";
import { InteractionModeToolbar } from "./components/InteractionModeToolbar";
import { ModelingSceneFallback } from "./components/ModelingSceneFallback";
import { ModelingToolHotkeys } from "./components/ModelingToolHotkeys";
import { ModelingToolToolbar } from "./components/ModelingToolToolbar";
import { PrototypeSceneFallback } from "./components/PrototypeSceneFallback";
import { SceneStatusHud } from "./components/SceneStatusHud";
import { SettingsWindow } from "./components/SettingsWindow";
import { type AppScreen, useUiStore } from "./store/uiStore";

const PrototypeScene = lazy(async () => {
  const module = await import("./components/PrototypeScene");
  return { default: module.PrototypeScene };
});

const ModelingScene = lazy(async () => {
  const module = await import("./components/ModelingScene");
  return { default: module.ModelingScene };
});

const screenButtons = [
  {
    description: "current editing prototype",
    label: "Prototype",
    screen: "prototype",
  },
  {
    description: "blender-like workspace",
    label: "Modeling",
    screen: "modeling",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  label: string;
  screen: AppScreen;
}>;

export default function App() {
  const currentScreen = useUiStore((state) => state.currentScreen);
  const setCurrentScreen = useUiStore((state) => state.setCurrentScreen);

  return (
    <main className="flex min-h-screen flex-col gap-3 p-4 md:gap-4 md:p-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="m-0 text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-slate-50/90">
            Okuyuki-UI-Playground
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-200/70">
            Screen-depth-drag driven object editing prototype for React Three
            Fiber.
          </p>
        </div>
        <nav
          aria-label="Screen navigation"
          className="flex flex-wrap items-center gap-2"
        >
          {screenButtons.map((screenButton) => {
            const active = currentScreen === screenButton.screen;

            return (
              <button
                aria-label={`Switch to ${screenButton.label} screen`}
                aria-pressed={active}
                className={`min-w-36 rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-sky-300/50 bg-sky-300/15 text-slate-50"
                    : "border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/[0.06]"
                }`}
                key={screenButton.screen}
                onClick={() => setCurrentScreen(screenButton.screen)}
                type="button"
              >
                <span className="block text-sm font-semibold">
                  {screenButton.label}
                </span>
                <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">
                  {screenButton.description}
                </span>
              </button>
            );
          })}
        </nav>
      </header>
      <section className="relative flex-1">
        {currentScreen === "prototype" ? <InteractionModeHotkeys /> : null}
        {currentScreen === "modeling" ? <ModelingToolHotkeys /> : null}
        {currentScreen === "prototype" ? (
          <Suspense fallback={<PrototypeSceneFallback />}>
            <PrototypeScene />
          </Suspense>
        ) : (
          <Suspense fallback={<ModelingSceneFallback />}>
            <ModelingScene />
          </Suspense>
        )}
        {currentScreen === "prototype" ? <InteractionModeToolbar /> : null}
        {currentScreen === "modeling" ? <ModelingToolToolbar /> : null}
        <SettingsWindow />
        <SceneStatusHud />
      </section>
    </main>
  );
}
