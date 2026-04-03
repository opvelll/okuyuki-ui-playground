import type { ThreeEvent } from "@react-three/fiber";
import { sceneObjectIds } from "../../data/sceneObjects";
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
  return sceneObjectIds.map((objectId) => {
    const sceneObject = objectsById[objectId];

    if (!sceneObject) {
      return null;
    }

    if (physicsEnabled) {
      return (
        <DynamicSceneObject key={`${objectId}-dynamic`} {...sceneObject} />
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
