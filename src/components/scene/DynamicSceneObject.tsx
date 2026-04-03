import type { RapierRigidBody } from "@react-three/rapier";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState } from "react";
import { Euler, Quaternion, Vector3 } from "three";
import type { SceneObject } from "../../types/scene";
import { ShapeMesh } from "./ShapeMesh";

export function DynamicSceneObject({
  color,
  kind,
  position,
  rotation,
  scale,
}: SceneObject) {
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const [bodyType, setBodyType] =
    useState<NonNullable<RigidBodyProps["type"]>>("kinematicPosition");

  const translation = useMemo(
    () => new Vector3(position[0], position[1], position[2]),
    [position],
  );
  const quaternion = useMemo(
    () =>
      new Quaternion().setFromEuler(
        new Euler(rotation[0], rotation[1], rotation[2], "XYZ"),
      ),
    [rotation],
  );

  useEffect(() => {
    const rigidBody = rigidBodyRef.current;
    if (!rigidBody) {
      return;
    }

    rigidBody.setTranslation(translation, false);
    rigidBody.setRotation(quaternion, false);
    rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, false);
    rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, false);

    const releaseTimer = window.setTimeout(() => {
      setBodyType("dynamic");
    }, 160);

    return () => window.clearTimeout(releaseTimer);
  }, [quaternion, translation]);

  useEffect(() => {
    const rigidBody = rigidBodyRef.current;
    if (!rigidBody) {
      return;
    }

    rigidBody.setTranslation(translation, true);
    rigidBody.setRotation(quaternion, true);
    rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

    if (bodyType === "dynamic") {
      rigidBody.wakeUp();
      return;
    }

    rigidBody.sleep();
  }, [bodyType, quaternion, translation]);

  const rigidBodyProps: RigidBodyProps = {
    angularDamping: 5.4,
    canSleep: true,
    colliders: "hull",
    friction: 1.8,
    linearDamping: 3.6,
    position,
    restitution: 0.02,
    rotation,
    scale,
    type: bodyType,
  };

  return (
    <RigidBody ref={rigidBodyRef} {...rigidBodyProps}>
      <ShapeMesh color={color} kind={kind} />
    </RigidBody>
  );
}
