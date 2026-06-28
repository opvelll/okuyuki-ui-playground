import type { ThreeEvent } from "@react-three/fiber";
import type { SceneObject } from "../../types/scene";
import { ShapeMesh } from "./ShapeMesh";

type SelectableSceneObjectProps = {
  dragging: boolean;
  onPointerDown: (
    event: ThreeEvent<PointerEvent>,
    sceneObject: SceneObject,
  ) => void;
  sceneObject: SceneObject;
  selected: boolean;
};

export function SelectableSceneObject({
  dragging,
  onPointerDown,
  sceneObject,
  selected,
}: SelectableSceneObjectProps) {
  return (
    <group
      position={sceneObject.position}
      rotation={sceneObject.rotation}
      scale={sceneObject.scale}
      onPointerDown={(event) => onPointerDown(event, sceneObject)}
    >
      <ShapeMesh
        color={sceneObject.color}
        dragging={dragging}
        kind={sceneObject.kind}
        selected={selected}
      />
    </group>
  );
}
