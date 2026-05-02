import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import {
  BallCollider,
  CapsuleCollider,
  ConeCollider,
  CuboidCollider,
  CylinderCollider,
  RigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState } from "react";
import { Euler, Quaternion, Vector3 } from "three";
import { useSceneStore } from "../../store/sceneStore";
import { useUiStore } from "../../store/uiStore";
import type { SceneObject } from "../../types/scene";
import { ShapeMesh } from "./ShapeMesh";

const ZERO_VELOCITY = { x: 0, y: 0, z: 0 };
const POSITION_SYNC_EPSILON = 0.0001;
const ROTATION_SYNC_EPSILON = 0.0001;
const COLLIDER_CONTACT_SKIN = 0.005;
const TORUS_COLLIDER_SEGMENTS = 8;

function ShapeCollider({
  friction,
  kind,
  restitution,
  scale,
}: Pick<SceneObject, "kind" | "scale"> & {
  friction: number;
  restitution: number;
}) {
  const [scaleX, scaleY, scaleZ] = scale;
  const radialScale = Math.max(scaleX, scaleZ);
  const sharedColliderProps = {
    contactSkin: COLLIDER_CONTACT_SKIN,
    friction,
    restitution,
  };

  if (kind === "box") {
    return (
      <CuboidCollider
        args={[0.45 * scaleX, 0.45 * scaleY, 0.45 * scaleZ]}
        {...sharedColliderProps}
      />
    );
  }

  if (kind === "sphere") {
    return (
      <BallCollider args={[0.55 * radialScale]} {...sharedColliderProps} />
    );
  }

  if (kind === "cone") {
    return (
      <ConeCollider
        args={[0.54 * scaleY, 0.52 * radialScale]}
        {...sharedColliderProps}
      />
    );
  }

  if (kind === "cylinder") {
    return (
      <CylinderCollider
        args={[0.575 * scaleY, 0.4 * radialScale]}
        {...sharedColliderProps}
      />
    );
  }

  if (kind === "torus") {
    const majorRadiusX = 0.5 * scaleX;
    const majorRadiusY = 0.5 * scaleY;
    const tubeRadius = 0.18 * Math.max(scaleX, scaleY, scaleZ);

    return (
      <>
        {Array.from({ length: TORUS_COLLIDER_SEGMENTS }, (_, index) => {
          const angle = (index / TORUS_COLLIDER_SEGMENTS) * Math.PI * 2;

          return (
            <BallCollider
              args={[tubeRadius]}
              key={angle}
              position={[
                Math.cos(angle) * majorRadiusX,
                Math.sin(angle) * majorRadiusY,
                0,
              ]}
              {...sharedColliderProps}
            />
          );
        })}
      </>
    );
  }

  return (
    <CapsuleCollider
      args={[0.375 * scaleY, 0.3 * radialScale]}
      {...sharedColliderProps}
    />
  );
}

type DynamicSceneObjectProps = SceneObject & {
  dragging?: boolean;
  held?: boolean;
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
  held = false,
  id,
  kind,
  onPointerDown,
  position,
  rotation,
  scale,
  selected = false,
}: DynamicSceneObjectProps) {
  const updateObjectTransform = useSceneStore(
    (state) => state.updateObjectTransform,
  );
  const objectAngularDamping = useUiStore(
    (state) => state.objectAngularDamping,
  );
  const objectFriction = useUiStore((state) => state.objectFriction);
  const objectLinearDamping = useUiStore((state) => state.objectLinearDamping);
  const objectRestitution = useUiStore((state) => state.objectRestitution);
  const physicsRigidBodyType = useUiStore(
    (state) => state.physicsRigidBodyType,
  );
  const suppressObjectRotation = useUiStore(
    (state) => state.suppressObjectRotation,
  );
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
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const latestTransformRef = useRef({ quaternion, translation });
  const previousDraggingRef = useRef(dragging);
  const [bodyType, setBodyType] = useState<NonNullable<RigidBodyProps["type"]>>(
    dragging || held ? "kinematicPosition" : physicsRigidBodyType,
  );
  const scaleMultiplier = dragging ? 1.08 : selected ? 1.04 : 1;
  const scaledSize = scale.map(
    (value) => value * scaleMultiplier,
  ) as SceneObject["scale"];

  latestTransformRef.current = { quaternion, translation };

  useEffect(() => {
    const rigidBody = rigidBodyRef.current;
    const nextBodyType =
      dragging || held ? "kinematicPosition" : physicsRigidBodyType;
    const { quaternion: latestQuaternion, translation: latestTranslation } =
      latestTransformRef.current;

    if (!rigidBody) {
      return;
    }

    if (dragging || held) {
      previousDraggingRef.current = true;
      setBodyType(nextBodyType);
      syncRigidBody(true, rigidBody, latestTranslation, latestQuaternion);
      return;
    }

    setBodyType(nextBodyType);
    syncRigidBody(true, rigidBody, latestTranslation, latestQuaternion);

    if (previousDraggingRef.current) {
      previousDraggingRef.current = false;
      if (nextBodyType === "dynamic") {
        rigidBody.wakeUp();
      }
      return;
    }

    if (nextBodyType === "dynamic") {
      rigidBody.wakeUp();
    }
  }, [dragging, held, physicsRigidBodyType]);

  useFrame(() => {
    const rigidBody = rigidBodyRef.current;
    if (!rigidBody || dragging || held || bodyType !== "dynamic") {
      return;
    }

    const currentTranslation = rigidBody.translation();
    const currentRotation = rigidBody.rotation();
    const nextRotation = new Euler().setFromQuaternion(
      new Quaternion(
        currentRotation.x,
        currentRotation.y,
        currentRotation.z,
        currentRotation.w,
      ),
      "XYZ",
    );
    const rotationTuple = [
      nextRotation.x,
      nextRotation.y,
      nextRotation.z,
    ] as SceneObject["rotation"];

    if (
      Math.abs(currentTranslation.x - position[0]) < POSITION_SYNC_EPSILON &&
      Math.abs(currentTranslation.y - position[1]) < POSITION_SYNC_EPSILON &&
      Math.abs(currentTranslation.z - position[2]) < POSITION_SYNC_EPSILON &&
      Math.abs(rotationTuple[0] - rotation[0]) < ROTATION_SYNC_EPSILON &&
      Math.abs(rotationTuple[1] - rotation[1]) < ROTATION_SYNC_EPSILON &&
      Math.abs(rotationTuple[2] - rotation[2]) < ROTATION_SYNC_EPSILON
    ) {
      return;
    }

    updateObjectTransform(id, {
      position: [
        currentTranslation.x,
        currentTranslation.y,
        currentTranslation.z,
      ],
      rotation: rotationTuple,
    });
  });

  const rigidBodyProps: RigidBodyProps = {
    additionalSolverIterations: 4,
    angularDamping: objectAngularDamping,
    canSleep: true,
    ccd: true,
    colliders: false,
    friction: objectFriction,
    linearDamping: objectLinearDamping,
    lockRotations: suppressObjectRotation,
    position,
    restitution: objectRestitution,
    rotation,
    scale,
    type: bodyType,
  };

  return (
    <RigidBody ref={rigidBodyRef} {...rigidBodyProps}>
      <ShapeCollider
        friction={objectFriction}
        kind={kind}
        restitution={objectRestitution}
        scale={scale}
      />
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
