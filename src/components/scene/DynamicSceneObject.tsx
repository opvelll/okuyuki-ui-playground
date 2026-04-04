import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState } from "react";
import { Euler, Quaternion, Vector3 } from "three";
import { useSceneStore } from "../../store/sceneStore";
import type { SceneObject } from "../../types/scene";
import { ShapeMesh } from "./ShapeMesh";

const ZERO_VELOCITY = { x: 0, y: 0, z: 0 };
const POSITION_SYNC_EPSILON = 0.0001;

type DynamicSceneObjectProps = SceneObject & {
  dragging?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  selected?: boolean;
};

const syncRigidBody = (
  wakeUp: boolean,
  rigidBody: RapierRigidBody,
  nextTranslation: Vector3,
  nextQuaternion: Quaternion,
) => {
  rigidBody.setTranslation(nextTranslation, wakeUp);
  rigidBody.setRotation(nextQuaternion, wakeUp);
  rigidBody.setLinvel(ZERO_VELOCITY, wakeUp);
  rigidBody.setAngvel(ZERO_VELOCITY, wakeUp);
};

export function DynamicSceneObject({
  color,
  dragging = false,
  id,
  kind,
  onPointerDown,
  position,
  rotation,
  scale,
  selected = false,
}: DynamicSceneObjectProps) {
  const updateObjectPosition = useSceneStore(
    (state) => state.updateObjectPosition,
  );
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const previousDraggingRef = useRef(dragging);
  const [bodyType, setBodyType] = useState<NonNullable<RigidBodyProps["type"]>>(
    dragging ? "kinematicPosition" : "dynamic",
  );
  const scaleMultiplier = dragging ? 1.08 : selected ? 1.04 : 1;
  const scaledSize = scale.map(
    (value) => value * scaleMultiplier,
  ) as SceneObject["scale"];

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

    if (dragging) {
      previousDraggingRef.current = true;
      setBodyType("kinematicPosition");
      syncRigidBody(true, rigidBody, translation, quaternion);
      return;
    }

    if (previousDraggingRef.current) {
      previousDraggingRef.current = false;
      syncRigidBody(true, rigidBody, translation, quaternion);
      setBodyType("dynamic");
      rigidBody.wakeUp();
    }
  }, [dragging, quaternion, translation]);

  useFrame(() => {
    const rigidBody = rigidBodyRef.current;
    if (!rigidBody || dragging || bodyType !== "dynamic") {
      return;
    }

    const currentTranslation = rigidBody.translation();
    if (
      Math.abs(currentTranslation.x - position[0]) < POSITION_SYNC_EPSILON &&
      Math.abs(currentTranslation.y - position[1]) < POSITION_SYNC_EPSILON &&
      Math.abs(currentTranslation.z - position[2]) < POSITION_SYNC_EPSILON
    ) {
      return;
    }

    updateObjectPosition(id, [
      currentTranslation.x,
      currentTranslation.y,
      currentTranslation.z,
    ]);
  });

  const rigidBodyProps: RigidBodyProps = {
    angularDamping: 0.9,
    canSleep: true,
    colliders: "hull",
    friction: 0.9,
    linearDamping: 0.45,
    position,
    restitution: 0.02,
    rotation,
    scale,
    type: bodyType,
  };

  return (
    <RigidBody ref={rigidBodyRef} {...rigidBodyProps}>
      <group scale={scaledSize} onPointerDown={onPointerDown}>
        <ShapeMesh
          color={color}
          dragging={dragging}
          kind={kind}
          selected={selected}
        />
      </group>
    </RigidBody>
  );
}
