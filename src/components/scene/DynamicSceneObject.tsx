import { RigidBody, type RigidBodyProps } from "@react-three/rapier";
import { useMemo } from "react";
import type { SceneObject } from "../../types/scene";
import { ShapeMesh } from "./ShapeMesh";

export function DynamicSceneObject({
  color,
  kind,
  position,
  rotation,
  scale,
}: SceneObject) {
  const spawnPosition = useMemo<[number, number, number]>(
    () => [position[0], position[1] + 1.8, position[2]],
    [position],
  );

  const rigidBodyProps: RigidBodyProps = {
    angularDamping: 5.4,
    canSleep: true,
    colliders: "hull",
    friction: 1.8,
    linearDamping: 3.6,
    position: spawnPosition,
    restitution: 0.02,
    rotation,
    scale,
  };

  return (
    <RigidBody {...rigidBodyProps}>
      <ShapeMesh color={color} kind={kind} />
    </RigidBody>
  );
}
