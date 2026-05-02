export function ModelingSceneFallback() {
  return (
    <div
      aria-label="Modeling scene loading"
      className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden border border-white/12 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.2),transparent_28%),linear-gradient(180deg,#0b1220_0%,#111827_50%,#172033_100%)] shadow-[0_18px_40px_rgba(3,10,20,0.22)]"
    >
      <div className="border border-white/10 bg-slate-950/55 px-5 py-4 text-center shadow-[0_12px_24px_rgba(3,10,20,0.18)] backdrop-blur">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-sky-100/72">
          Modeling Workspace
        </p>
        <p className="mt-1 text-[0.76rem] text-slate-200/80">
          Preparing the blender-like modeling view.
        </p>
      </div>
    </div>
  );
}
