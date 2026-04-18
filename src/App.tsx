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
    <main className="flex min-h-screen flex-col gap-3 px-3 py-3 md:gap-4 md:px-4 md:py-4">
      <header className="border-b border-white/10 pb-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-6">
        <div>
          <h1 className="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-slate-50/90">
            Okuyuki-UI-Playground
          </h1>
          <p className="mt-1 max-w-xl text-[0.78rem] leading-5 text-slate-200/62">
            Screen-depth-drag driven object editing prototype for React Three
            Fiber.
          </p>
        </div>
        <nav
          aria-label="Screen navigation"
          className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0"
        >
          {screenButtons.map((screenButton) => {
            const active = currentScreen === screenButton.screen;

            return (
              <button
                aria-label={`Switch to ${screenButton.label} screen`}
                aria-pressed={active}
                className={`min-w-28 border px-3 py-2 text-left text-[0.76rem] font-semibold tracking-[0.08em] transition ${
                  active
                    ? "border-sky-300/50 bg-sky-300/10 text-slate-50"
                    : "border-white/10 bg-slate-950/30 text-slate-300 hover:bg-white/[0.04]"
                }`}
                key={screenButton.screen}
                onClick={() => setCurrentScreen(screenButton.screen)}
                title={screenButton.description}
                type="button"
              >
                <span className="block">{screenButton.label}</span>
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
