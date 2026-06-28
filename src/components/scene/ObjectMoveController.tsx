import { Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { RefObject } from "react";
import { useMemo } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useSceneStore } from "../../store/sceneStore";
import { useUiStore } from "../../store/uiStore";
import type { SceneObject } from "../../types/scene";
import { DragPlaneOverlay } from "./DragPlaneOverlay";
import { ObjectRotateController } from "./ObjectRotateController";
import { SceneObjectLayer } from "./SceneObjectLayer";
import { TransformActionHud } from "./TransformActionHud";
import { useObjectDragSession } from "./useObjectDragSession";

function MoveDropGuide({
  currentPoint,
}: {
  currentPoint: { x: number; y: number; z: number };
}) {
  const points = useMemo(() => {
    if (currentPoint.y <= 0) {
      return null;
    }

    return [
      new Vector3(currentPoint.x, currentPoint.y, currentPoint.z),
      new Vector3(currentPoint.x, 0, currentPoint.z),
    ];
  }, [currentPoint]);

  if (!points) {
    return null;
  }

  return (
    <Line
      color="#f8fafc"
      dashed
      dashScale={2}
      gapSize={0.14}
      lineWidth={1.5}
      opacity={0.9}
      points={points}
      transparent
    />
  );
}

function MoveCenterHandle({
  onPointerDown,
  selectedObject,
  visible,
}: {
  onPointerDown: (
    event: ThreeEvent<PointerEvent>,
    sceneObject: SceneObject,
  ) => void;
  selectedObject: SceneObject | null;
  visible: boolean;
}) {
  if (!visible || !selectedObject) {
    return null;
  }

  const hitRadius = Math.max(...selectedObject.scale) * 0.55 + 0.3;

  return (
    <group position={selectedObject.position} renderOrder={20}>
      <mesh onPointerDown={(event) => onPointerDown(event, selectedObject)}>
        <sphereGeometry args={[hitRadius, 24, 24]} />
        <meshBasicMaterial
          color="#0ea5e9"
          depthTest={false}
          opacity={0.001}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh onPointerDown={(event) => onPointerDown(event, selectedObject)}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial
          color="#0ea5e9"
          depthTest={false}
          opacity={0.95}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

export function ObjectMoveController({
  controlsRef,
  physicsEnabled,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  physicsEnabled: boolean;
}) {
  const interactionMode = useUiStore((state) => state.interactionMode);
  const interactionState = useUiStore((state) => state.interactionState);
  const transformStage = useUiStore((state) => state.transformStage);
  const moveVerticalDropGuide = useUiStore(
    (state) => state.moveVerticalDropGuide,
  );
  const selectedObjectId = useUiStore((state) => state.selectedObjectId);
  const beginMoveMode = useUiStore((state) => state.beginMoveMode);
  const beginRotateMode = useUiStore((state) => state.beginRotateMode);
  const selectObject = useUiStore((state) => state.selectObject);
  const objectsById = useSceneStore((state) => state.objectsById);
  const { overlayState, startMoveDrag } = useObjectDragSession({
    controlsRef,
  });
  const selectedObject = selectedObjectId
    ? (objectsById[selectedObjectId] ?? null)
    : null;
  const handleSceneObjectPointerDown = (
    event: ThreeEvent<PointerEvent>,
    sceneObject: SceneObject,
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
    selectObject(sceneObject.id);
  };
  const handleMoveHandlePointerDown = (
    event: ThreeEvent<PointerEvent>,
    sceneObject: SceneObject,
  ) => {
    if (event.button !== 0 || transformStage !== "move") {
      return;
    }

    event.stopPropagation();
    startMoveDrag(
      {
        button: event.button,
        clientX: event.nativeEvent.clientX,
        clientY: event.nativeEvent.clientY,
        pointerId: event.pointerId,
      },
      sceneObject,
    );
  };

  return (
    <>
      <SceneObjectLayer
        draggingObjectId={
          interactionState === "dragging" ? selectedObjectId : null
        }
        objectsById={objectsById}
        onPointerDown={handleSceneObjectPointerDown}
        physicsEnabled={physicsEnabled}
        selectedObjectId={selectedObjectId}
      />
      <ObjectRotateController
        controlsRef={controlsRef}
        interactionMode={interactionMode}
      />
      <MoveCenterHandle
        onPointerDown={handleMoveHandlePointerDown}
        selectedObject={selectedObject}
        visible={transformStage === "move" && interactionState !== "dragging"}
      />
      <TransformActionHud
        onMoveClick={beginMoveMode}
        onRotateClick={beginRotateMode}
        selectedObject={selectedObject}
        visible={transformStage === "selection"}
      />
      {interactionState === "dragging" &&
      overlayState &&
      moveVerticalDropGuide ? (
        <MoveDropGuide currentPoint={overlayState.currentPoint} />
      ) : null}
      {interactionState === "dragging" && overlayState ? (
        <DragPlaneOverlay overlayState={overlayState} />
      ) : null}
    </>
  );
}
