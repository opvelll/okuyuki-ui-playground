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
  const scaleMultiplier = dragging ? 1.08 : selected ? 1.04 : 1;
  const scaledSize = sceneObject.scale.map(
    (value) => value * scaleMultiplier,
  ) as SceneObject["scale"];

  return (
    <group
      position={sceneObject.position}
      rotation={sceneObject.rotation}
      scale={scaledSize}
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
