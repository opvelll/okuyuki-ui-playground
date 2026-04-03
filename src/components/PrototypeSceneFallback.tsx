const sceneFrameClasses =
  "h-[calc(100vh-5.25rem)] min-h-[26.25rem] overflow-hidden rounded-[2rem] border border-white/15 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_32%),linear-gradient(180deg,#eff7ff_0%,#d3e2f2_100%)] shadow-[0_30px_80px_rgba(3,10,20,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] md:h-[calc(100vh-5.5rem)]";

export function PrototypeSceneFallback() {
  return (
    <div
      aria-busy="true"
      aria-label="Scene loading"
      className={`${sceneFrameClasses} flex items-center justify-center`}
    >
      <div className="rounded-[1.6rem] border border-slate-800/10 bg-white/30 px-6 py-4 text-center text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-slate-700/70">
          Scene Loading
        </p>
        <p className="mt-2 text-sm text-slate-700/85">
          Preparing the 3D prototype scene.
        </p>
      </div>
    </div>
  );
}
