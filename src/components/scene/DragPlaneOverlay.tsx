import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { DoubleSide, Quaternion, Vector3 } from "three";
import { useSceneStore } from "../../store/sceneStore";
import { useUiStore } from "../../store/uiStore";
import {
  type DragPlaneOverlayState,
  calculateDragPlaneOverlayGeometry,
} from "./dragPlaneOverlay";
import { calculateAxisMagnetLinePoints } from "./moveDragModifiers";

const DEFAULT_PLANE_NORMAL = new Vector3(0, 0, 1);
const MARKER_RADIUS = 0.06;
const OVERLAY_COLORS = {
  "camera-facing": "#6ac4ff",
  "screen-horizontal": "#9be37a",
  "screen-vertical": "#ffb46a",
} as const;

function OverlayDisk({
  color,
  planeQuaternion,
  position,
  radius,
}: {
  color: string;
  planeQuaternion: Quaternion;
  position: Vector3;
  radius: number;
}) {
  return (
    <mesh position={position} quaternion={planeQuaternion} renderOrder={1}>
      <circleGeometry args={[radius, 96]} />
      <meshBasicMaterial
        color={color}
        depthTest={true}
        depthWrite={false}
        opacity={0.22}
        side={DoubleSide}
        transparent
      />
    </mesh>
  );
}

export function DragPlaneOverlay({
  overlayState,
}: {
  overlayState: DragPlaneOverlayState;
}) {
  const moveOverlayDisplayMode = useUiStore(
    (state) => state.moveOverlayDisplayMode,
  );
  const axisMagnetTarget = useUiStore((state) => state.axisMagnetTarget);
  const moveOverlayRadiusMultiplier = useUiStore(
    (state) => state.moveOverlayRadiusMultiplier,
  );
  const objectsById = useSceneStore((state) => state.objectsById);
  const overlayModes = useMemo(() => {
    switch (moveOverlayDisplayMode) {
      case "mode-2":
        return ["screen-vertical"] as const;
      case "mode-3":
        return ["screen-horizontal"] as const;
      case "modes-2-3":
        return ["screen-vertical", "screen-horizontal"] as const;
      case "modes-1-2-3":
        return [
          "camera-facing",
          "screen-vertical",
          "screen-horizontal",
        ] as const;
      default:
        return ["camera-facing"] as const;
    }
  }, [moveOverlayDisplayMode]);
  const overlayGeometries = useMemo(
    () =>
      overlayModes.map((orientationMode) => {
        const geometry = calculateDragPlaneOverlayGeometry(
          {
            ...overlayState,
            orientationMode,
          },
          {
            radiusMultiplier: moveOverlayRadiusMultiplier,
          },
        );
        const planeQuaternion = new Quaternion();

        planeQuaternion.setFromUnitVectors(
          DEFAULT_PLANE_NORMAL,
          geometry.surfaceNormal.clone().normalize(),
        );

        return {
          color: OVERLAY_COLORS[orientationMode],
          planeQuaternion,
          ...geometry,
          orientationMode,
        };
      }),
    [moveOverlayRadiusMultiplier, overlayModes, overlayState],
  );
  const { linePoints } = overlayGeometries[0];
  const axisMagnetLinePoints = useMemo(
    () =>
      calculateAxisMagnetLinePoints(
        axisMagnetTarget,
        objectsById,
        overlayState.currentPoint,
      ),
    [axisMagnetTarget, objectsById, overlayState.currentPoint],
  );

  return (
    <group raycast={() => null}>
      {overlayGeometries.map((geometry) => (
        <OverlayDisk
          color={geometry.color}
          key={geometry.orientationMode}
          planeQuaternion={geometry.planeQuaternion}
          position={geometry.center}
          radius={geometry.radius}
        />
      ))}
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
      {axisMagnetLinePoints ? (
        <Line
          color="#ffd166"
          depthTest={false}
          depthWrite={false}
          lineWidth={2.6}
          opacity={0.95}
          points={axisMagnetLinePoints}
          renderOrder={3}
          transparent
        />
      ) : null}
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
      <mesh position={overlayState.currentPoint} renderOrder={4}>
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
