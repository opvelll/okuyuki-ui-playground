import { Environment, Float, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function TilePreview() {
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh castShadow receiveShadow rotation={[0.35, 0.65, 0]}>
        <boxGeometry args={[1.6, 1.6, 0.16]} />
        <meshStandardMaterial
          color="#f5efe4"
          metalness={0.15}
          roughness={0.3}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <div className="scene-shell">
      <Canvas camera={{ position: [2.8, 2.1, 3.6], fov: 42 }} shadows>
        <color attach="background" args={["#f3ede3"]} />
        <ambientLight intensity={1.2} />
        <directionalLight
          castShadow
          intensity={2.4}
          position={[4, 6, 3]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <group position={[0, -0.3, 0]}>
          <TilePreview />
          <mesh
            receiveShadow
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1.1, 0]}
          >
            <circleGeometry args={[4.5, 64]} />
            <meshStandardMaterial color="#d1b58a" roughness={0.92} />
          </mesh>
        </group>
        <Environment preset="sunset" />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}

export default function App() {
  return (
    <main className="min-h-screen bg-[var(--color-ink)] text-[var(--color-paper)]">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1.1fr_1fr] lg:px-10">
        <div className="flex flex-col justify-between rounded-[2rem] border border-white/15 bg-white/6 p-8 backdrop-blur-sm">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-200/75">
              Naname UI
            </p>
            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-balance">
                React / Three.js の制作環境をそのまま触り始められる土台
              </h1>
              <p className="max-w-lg text-base leading-7 text-stone-200/78">
                TypeScript、Tailwind CSS、Vitest、Playwright
                を揃えた最小構成です。右の 3Dビューを差し替えれば、そのまま UI
                試作に入れます。
              </p>
            </div>
          </div>
          <dl className="grid gap-4 text-sm text-stone-100/80 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <dt className="text-xs uppercase tracking-[0.24em] text-amber-200/70">
                Stack
              </dt>
              <dd className="mt-2">Vite + React 19 + Three.js + Tailwind 4</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <dt className="text-xs uppercase tracking-[0.24em] text-amber-200/70">
                Testing
              </dt>
              <dd className="mt-2">Vitest + Testing Library + Playwright</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[2rem] border border-black/10 bg-[var(--color-sand)] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.28)]">
          <Scene />
        </div>
      </section>
    </main>
  );
}
