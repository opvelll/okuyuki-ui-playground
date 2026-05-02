import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import { Color, MOUSE } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useUiStore } from "../store/uiStore";
import { FloorVisual } from "./scene/FloorVisual";
import { ObjectMoveController } from "./scene/ObjectMoveController";
import { SceneContents } from "./scene/SceneContents";

function PrototypeCameraController({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const setPrototypeCamera = useUiStore((state) => state.setPrototypeCamera);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const { prototypeCamera } = useUiStore.getState();

    camera.position.set(...prototypeCamera.position);
    controls.target.set(...prototypeCamera.target);
    controls.update();

    const syncCamera = () => {
      setPrototypeCamera({
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [controls.target.x, controls.target.y, controls.target.z],
      });
    };

    syncCamera();
    controls.addEventListener("change", syncCamera);

    return () => {
      syncCamera();
      controls.removeEventListener("change", syncCamera);
    };
  }, [camera, controlsRef, setPrototypeCamera]);

  return null;
}

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
      className="h-full min-h-0 w-full overflow-hidden border border-white/12 shadow-[0_18px_40px_rgba(3,10,20,0.22)]"
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
        <PrototypeCameraController controlsRef={controlsRef} />
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
