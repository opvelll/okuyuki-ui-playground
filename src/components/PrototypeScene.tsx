import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MOUSE } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useUiStore } from "../store/uiStore";
import { FloorVisual } from "./scene/FloorVisual";
import { ObjectMoveController } from "./scene/ObjectMoveController";
import { SceneContents } from "./scene/SceneContents";

export function PrototypeScene() {
  const interactionState = useUiStore((state) => state.interactionState);
  const interactionMode = useUiStore((state) => state.interactionMode);
  const fogColor = useUiStore((state) => state.fogColor);
  const physicsEnabled = useUiStore((state) => state.physicsEnabled);
  const sceneBackgroundColor = useUiStore(
    (state) => state.sceneBackgroundColor,
  );
  const clearSelection = useUiStore((state) => state.clearSelection);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const sceneShellBackground = useMemo(() => {
    const base = new Color(sceneBackgroundColor);
    const topGlow = base.clone().lerp(new Color("#ffffff"), 0.42);
    const bottom = base.clone().offsetHSL(0, -0.08, -0.08);

    return `radial-gradient(circle at top, rgba(${Math.round(
      topGlow.r * 255,
    )}, ${Math.round(topGlow.g * 255)}, ${Math.round(
      topGlow.b * 255,
    )}, 0.58), transparent 32%), linear-gradient(180deg, ${sceneBackgroundColor} 0%, #${bottom.getHexString()} 100%)`;
  }, [sceneBackgroundColor]);

  return (
    <div
      className="h-[calc(100vh-5.25rem)] min-h-[26.25rem] overflow-hidden rounded-[2rem] border border-white/15 shadow-[0_30px_80px_rgba(3,10,20,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] md:h-[calc(100vh-5.5rem)]"
      style={{ background: sceneShellBackground }}
    >
      <Canvas
        camera={{ fov: 44, position: [6.4, 4.5, 7.8] }}
        dpr={[1, 1.8]}
        onPointerMissed={() => {
          if (useUiStore.getState().interactionState !== "dragging") {
            if (interactionMode === "rotate") {
              clearSelection();
            }
          }
        }}
        shadows
      >
        <color attach="background" args={[sceneBackgroundColor]} />
        <fog attach="fog" args={[fogColor, 10, 20]} />
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
          enablePan
          maxPolarAngle={Math.PI / 2.1}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN,
          }}
        />
      </Canvas>
    </div>
  );
}
