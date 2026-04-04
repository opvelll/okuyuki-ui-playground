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

export function ObjectMoveController({
  controlsRef,
  physicsEnabled,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  physicsEnabled: boolean;
}) {
  const interactionMode = useUiStore((state) => state.interactionMode);
  const interactionState = useUiStore((state) => state.interactionState);
  const moveVerticalDropGuide = useUiStore(
    (state) => state.moveVerticalDropGuide,
  );
  const selectedObjectId = useUiStore((state) => state.selectedObjectId);
  const selectObject = useUiStore((state) => state.selectObject);
  const objectsById = useSceneStore((state) => state.objectsById);
  const { handlePointerDown, overlayState } = useObjectDragSession({
    controlsRef,
  });
  const handleSceneObjectPointerDown = (
    event: ThreeEvent<PointerEvent>,
    sceneObject: SceneObject,
  ) => {
    if (interactionMode === "rotate") {
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();
      selectObject(sceneObject.id);
      return;
    }

    handlePointerDown(event, sceneObject);
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
