import type { ThreeEvent } from "@react-three/fiber";
import { sceneObjectIds } from "../../data/sceneObjects";
import { useUiStore } from "../../store/uiStore";
import type { SceneObject } from "../../types/scene";
import { DynamicSceneObject } from "./DynamicSceneObject";
import { SelectableSceneObject } from "./SelectableSceneObject";

type SceneObjectLayerProps = {
  draggingObjectId: string | null;
  objectsById: Record<string, SceneObject>;
  onPointerDown: (
    event: ThreeEvent<PointerEvent>,
    sceneObject: SceneObject,
  ) => void;
  physicsEnabled: boolean;
  selectedObjectId: string | null;
};

export function SceneObjectLayer({
  draggingObjectId,
  objectsById,
  onPointerDown,
  physicsEnabled,
  selectedObjectId,
}: SceneObjectLayerProps) {
  const interactionMode = useUiStore((state) => state.interactionMode);

  return sceneObjectIds.map((objectId) => {
    const sceneObject = objectsById[objectId];

    if (!sceneObject) {
      return null;
    }

    if (physicsEnabled) {
      return (
        <DynamicSceneObject
          {...sceneObject}
          dragging={draggingObjectId === sceneObject.id}
          held={
            interactionMode === "rotate" && selectedObjectId === sceneObject.id
          }
          key={`${objectId}-dynamic`}
          onPointerDown={(event) => onPointerDown(event, sceneObject)}
          selected={selectedObjectId === sceneObject.id}
        />
      );
    }

    return (
      <SelectableSceneObject
        dragging={draggingObjectId === sceneObject.id}
        key={`${objectId}-static`}
        onPointerDown={onPointerDown}
        sceneObject={sceneObject}
        selected={selectedObjectId === sceneObject.id}
      />
    );
  });
}
