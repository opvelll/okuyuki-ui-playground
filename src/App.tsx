import { Suspense, lazy, useEffect } from "react";
import { InteractionModeHotkeys } from "./components/InteractionModeHotkeys";
import { PrototypeSceneFallback } from "./components/PrototypeSceneFallback";
import { SceneStatusHud } from "./components/SceneStatusHud";
import { SettingsWindow } from "./components/SettingsWindow";
import { SurfaceSnapToggle } from "./components/SurfaceSnapToggle";
import { useUiStore } from "./store/uiStore";

const PrototypeScene = lazy(async () => {
  const module = await import("./components/PrototypeScene");
  return { default: module.PrototypeScene };
});

function E2eStateBridge() {
  const selectObject = useUiStore((state) => state.selectObject);

  useEffect(() => {
    if (import.meta.env.VITE_E2E !== "true") {
      return;
    }

    window.__OKUYUKI_E2E__ = { selectObject };

    return () => {
      window.__OKUYUKI_E2E__ = undefined;
    };
  }, [selectObject]);

  return null;
}

export default function App() {
  return (
    <main className="flex min-h-screen flex-col gap-3 p-4 md:gap-4 md:p-5">
      <E2eStateBridge />
      <header>
        <h1 className="m-0 text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-slate-50/90">
          Okuyuki-UI-Playground
        </h1>
      </header>
      <section className="relative flex-1">
        <InteractionModeHotkeys />
        <Suspense fallback={<PrototypeSceneFallback />}>
          <PrototypeScene />
        </Suspense>
        <SurfaceSnapToggle />
        <SettingsWindow />
        <SceneStatusHud />
      </section>
    </main>
  );
}
