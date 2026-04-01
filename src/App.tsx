import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { ComponentProps } from "react";

type ShapeSpec = {
  color: string;
  kind: "box" | "capsule" | "cone" | "cylinder" | "sphere" | "torus";
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

const shapes: ShapeSpec[] = [
  {
    kind: "box",
    color: "#ff8a5b",
    position: [-2.3, 0.45, -0.8],
    rotation: [0.12, 0.5, 0.08],
  },
  {
    kind: "sphere",
    color: "#f7c948",
    position: [-0.9, 0.52, 1.1],
  },
  {
    kind: "cone",
    color: "#ef5da8",
    position: [0.45, 0.55, -1.15],
    rotation: [0, -0.35, 0],
  },
  {
    kind: "cylinder",
    color: "#44c2fd",
    position: [1.8, 0.6, 0.65],
    rotation: [0.18, 0.12, 0],
  },
  {
    kind: "torus",
    color: "#b794f4",
    position: [2.8, 0.78, -0.35],
    rotation: [1.1, 0.28, 0.24],
    scale: [0.9, 0.9, 0.9],
  },
  {
    kind: "capsule",
    color: "#4fd1c5",
    position: [-3.15, 0.75, 1.4],
    rotation: [0.28, -0.4, 0.1],
  },
];

function SceneObject({
  color,
  kind,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: ShapeSpec) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow>
        {kind === "box" ? <boxGeometry args={[0.9, 0.9, 0.9]} /> : null}
        {kind === "sphere" ? <sphereGeometry args={[0.55, 48, 48]} /> : null}
        {kind === "cone" ? <coneGeometry args={[0.52, 1.08, 48]} /> : null}
        {kind === "cylinder" ? (
          <cylinderGeometry args={[0.4, 0.4, 1.15, 48]} />
        ) : null}
        {kind === "torus" ? <torusGeometry args={[0.5, 0.18, 24, 72]} /> : null}
        {kind === "capsule" ? (
          <capsuleGeometry args={[0.3, 0.75, 10, 20]} />
        ) : null}
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.38} />
      </mesh>
    </group>
  );
}

function Floor(props: ComponentProps<"group">) {
  return (
    <group {...props}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 18, 1, 1]} />
        <meshStandardMaterial color="#d9dee7" roughness={0.92} />
      </mesh>
      <gridHelper
        args={[18, 18, "#8d99ae", "#c5cedb"]}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}

function PrototypeScene() {
  return (
    <div className="viewport-frame">
      <Canvas
        camera={{ position: [6.4, 4.5, 7.8], fov: 44 }}
        shadows
        dpr={[1, 1.8]}
      >
        <color attach="background" args={["#dbe7f3"]} />
        <fog attach="fog" args={["#dbe7f3", 10, 20]} />
        <ambientLight intensity={1.4} />
        <directionalLight
          castShadow
          intensity={2.1}
          position={[7, 10, 6]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Floor position={[0, -0.02, 0]} />
        {shapes.map((shape) => (
          <SceneObject key={shape.kind + shape.position.join("-")} {...shape} />
        ))}
        <ContactShadows
          blur={2.6}
          color="#6b7b93"
          frames={1}
          opacity={0.42}
          position={[0, 0.001, 0]}
          scale={14}
        />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}

export default function App() {
  return (
    <main className="app-shell">
      <section className="prototype-panel">
        <div className="prototype-copy">
          <p className="eyebrow">Three React Prototype</p>
          <h1>3D UI Playground</h1>
          <p>
            中央に床と複数オブジェクトを置いた試作シーンです。各オブジェクトは個別に配置しているので、このまま動作追加の土台にできます。
          </p>
        </div>
        <PrototypeScene />
      </section>
    </main>
  );
}
