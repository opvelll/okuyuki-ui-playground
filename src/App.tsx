import { PrototypeScene } from "./components/PrototypeScene";
import { SceneStatusHud } from "./components/SceneStatusHud";
import { SettingsWindow } from "./components/SettingsWindow";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col gap-3 p-4 md:gap-4 md:p-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-slate-50/90">
            Okuyuki-UI-Playground
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-200/70">
            Screen-depth-drag driven object editing prototype for React Three
            Fiber.
          </p>
        </div>
      </header>
      <section className="relative flex-1">
        <PrototypeScene />
        <SettingsWindow />
        <SceneStatusHud />
      </section>
    </main>
  );
}
