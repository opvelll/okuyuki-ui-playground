const sceneFrameClasses =
  "h-full min-h-0 w-full overflow-hidden border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_32%),linear-gradient(180deg,#eff7ff_0%,#d3e2f2_100%)] shadow-[0_18px_40px_rgba(3,10,20,0.22)]";

export function PrototypeSceneFallback() {
  return (
    <div
      aria-busy="true"
      aria-label="Scene loading"
      className={`${sceneFrameClasses} flex items-center justify-center`}
    >
      <div className="border border-slate-800/10 bg-white/28 px-5 py-3 text-center text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.1)] backdrop-blur-sm">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-slate-700/70">
          Scene Loading
        </p>
        <p className="mt-1 text-[0.76rem] text-slate-700/85">
          Preparing the 3D prototype scene.
        </p>
      </div>
    </div>
  );
}
