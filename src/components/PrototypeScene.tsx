import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useUiStore } from "../store/uiStore";
import { FloorVisual } from "./scene/FloorVisual";
import { ObjectMoveController } from "./scene/ObjectMoveController";
import { SceneContents } from "./scene/SceneContents";

export function PrototypeScene() {
  const interactionState = useUiStore((state) => state.interactionState);
  const physicsEnabled = useUiStore((state) => state.physicsEnabled);
  const clearSelection = useUiStore((state) => state.clearSelection);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <div className="h-[calc(100vh-5.25rem)] min-h-[26.25rem] overflow-hidden rounded-[2rem] border border-white/15 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_32%),linear-gradient(180deg,#eff7ff_0%,#d3e2f2_100%)] shadow-[0_30px_80px_rgba(3,10,20,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] md:h-[calc(100vh-5.5rem)]">
      <Canvas
        camera={{ fov: 44, position: [6.4, 4.5, 7.8] }}
        dpr={[1, 1.8]}
        onPointerMissed={() => {
          if (useUiStore.getState().interactionState !== "dragging") {
            clearSelection();
          }
        }}
        shadows
      >
        <color attach="background" args={["#dbe7f3"]} />
        <fog attach="fog" args={["#dbe7f3", 10, 20]} />
        <ambientLight intensity={1.4} />
        <directionalLight
          castShadow
          intensity={2.1}
          position={[7, 10, 6]}
          shadow-mapSize-height={2048}
          shadow-mapSize-width={2048}
        />
        <FloorVisual position={[0, 0, 0]} />
        <SceneContents physicsEnabled={physicsEnabled}>
          <ObjectMoveController
            controlsRef={controlsRef}
            physicsEnabled={physicsEnabled}
          />
        </SceneContents>
        <ContactShadows
          blur={2.6}
          color="#6b7b93"
          frames={Number.POSITIVE_INFINITY}
          opacity={interactionState === "dragging" ? 0.54 : 0.42}
          position={[0, 0.001, 0]}
          scale={14}
        />
        <OrbitControls
          ref={controlsRef}
          enableDamping={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
