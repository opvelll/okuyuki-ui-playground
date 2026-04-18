export function ModelingSceneFallback() {
  return (
    <div
      aria-label="Modeling scene loading"
      className="flex h-[calc(100vh-8rem)] min-h-[26.25rem] items-center justify-center overflow-hidden rounded-[2rem] border border-white/15 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.2),transparent_28%),linear-gradient(180deg,#0b1220_0%,#111827_50%,#172033_100%)] shadow-[0_30px_80px_rgba(3,10,20,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]"
    >
      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 px-6 py-5 text-center shadow-[0_20px_44px_rgba(3,10,20,0.28)] backdrop-blur-xl">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-sky-100/72">
          Modeling Workspace
        </p>
        <p className="mt-2 text-sm text-slate-200/80">
          Preparing the blender-like modeling view.
        </p>
      </div>
    </div>
  );
}
