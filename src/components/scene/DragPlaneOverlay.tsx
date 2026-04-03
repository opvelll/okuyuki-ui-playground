import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { DoubleSide, Quaternion, Vector3 } from "three";
import { useUiStore } from "../../store/uiStore";
import {
  type DragPlaneOverlayState,
  calculateDragPlaneOverlayGeometry,
} from "./dragPlaneOverlay";

const DEFAULT_PLANE_NORMAL = new Vector3(0, 0, 1);
const MARKER_RADIUS = 0.06;

export function DragPlaneOverlay({
  overlayState,
}: {
  overlayState: DragPlaneOverlayState;
}) {
  const moveOverlayRadiusMultiplier = useUiStore(
    (state) => state.moveOverlayRadiusMultiplier,
  );
  const { center, linePoints, radius, surfaceNormal } = useMemo(
    () =>
      calculateDragPlaneOverlayGeometry(overlayState, {
        radiusMultiplier: moveOverlayRadiusMultiplier,
      }),
    [moveOverlayRadiusMultiplier, overlayState],
  );
  const planeQuaternion = useMemo(() => {
    const nextQuaternion = new Quaternion();

    nextQuaternion.setFromUnitVectors(
      DEFAULT_PLANE_NORMAL,
      surfaceNormal.clone().normalize(),
    );

    return nextQuaternion;
  }, [surfaceNormal]);

  return (
    <group raycast={() => null}>
      <mesh position={center} quaternion={planeQuaternion} renderOrder={1}>
        <circleGeometry args={[radius, 96]} />
        <meshBasicMaterial
          color="#6ac4ff"
          depthTest={true}
          depthWrite={false}
          opacity={0.25}
          side={DoubleSide}
          transparent
        />
      </mesh>
      <Line
        color="#2d8fd6"
        depthTest={false}
        depthWrite={false}
        lineWidth={1.8}
        opacity={0.92}
        points={linePoints}
        renderOrder={2}
        transparent
      />
      <mesh position={overlayState.startPoint} renderOrder={3}>
        <sphereGeometry args={[MARKER_RADIUS, 20, 20]} />
        <meshBasicMaterial
          color="#f8fbff"
          depthTest={false}
          depthWrite={false}
          opacity={0.94}
          transparent
        />
      </mesh>
      <mesh position={overlayState.currentPoint} renderOrder={3}>
        <sphereGeometry args={[MARKER_RADIUS, 20, 20]} />
        <meshBasicMaterial
          color="#0c7fcd"
          depthTest={false}
          depthWrite={false}
          opacity={0.94}
          transparent
        />
      </mesh>
    </group>
  );
}
