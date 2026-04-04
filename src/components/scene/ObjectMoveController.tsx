import type { RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useSceneStore } from "../../store/sceneStore";
import { useUiStore } from "../../store/uiStore";
import { DragPlaneOverlay } from "./DragPlaneOverlay";
import { ObjectRotateController } from "./ObjectRotateController";
import { SceneObjectLayer } from "./SceneObjectLayer";
import { useObjectDragSession } from "./useObjectDragSession";

export function ObjectMoveController({
  controlsRef,
  physicsEnabled,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  physicsEnabled: boolean;
}) {
  const interactionMode = useUiStore((state) => state.interactionMode);
  const interactionState = useUiStore((state) => state.interactionState);
  const selectedObjectId = useUiStore((state) => state.selectedObjectId);
  const objectsById = useSceneStore((state) => state.objectsById);
  const { handlePointerDown, overlayState } = useObjectDragSession({
    controlsRef,
  });

  if (interactionMode === "rotate") {
    return (
      <ObjectRotateController
        controlsRef={controlsRef}
        physicsEnabled={physicsEnabled}
      />
    );
  }

  return (
    <>
      <SceneObjectLayer
        draggingObjectId={
          interactionState === "dragging" ? selectedObjectId : null
        }
        objectsById={objectsById}
        onPointerDown={handlePointerDown}
        physicsEnabled={physicsEnabled}
        selectedObjectId={selectedObjectId}
      />
      {interactionState === "dragging" && overlayState ? (
        <DragPlaneOverlay overlayState={overlayState} />
      ) : null}
    </>
  );
}
