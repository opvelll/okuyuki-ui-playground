import { MathUtils, Quaternion, Vector3 } from "three";

const ARC_BALL_IDENTITY_EPSILON = 0.000001;
const WORLD_RIGHT = new Vector3(1, 0, 0);
const WORLD_UP = new Vector3(0, 1, 0);
const WORLD_FORWARD = new Vector3(0, 0, 1);

export type ArcballSnapRingAxis = "x" | "y" | "z";

export const mapPointerToArcballVector = (
  clientX: number,
  clientY: number,
  centerClientX: number,
  centerClientY: number,
  radiusPx: number,
) => {
  const safeRadius = Math.max(radiusPx, ARC_BALL_IDENTITY_EPSILON);
  let x = (clientX - centerClientX) / safeRadius;
  let y = (centerClientY - clientY) / safeRadius;
  const lengthSq = x * x + y * y;

  if (lengthSq > 1) {
    const inverseLength = 1 / Math.sqrt(lengthSq);
    x *= inverseLength;
    y *= inverseLength;

    return new Vector3(x, y, 0);
  }

  return new Vector3(x, y, Math.sqrt(1 - lengthSq));
};

const getOrthogonalAxis = (vector: Vector3) => {
  const fallbackAxis =
    Math.abs(vector.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0);

  return fallbackAxis.cross(vector).normalize();
};

const getSnapRingAxisVector = (axis: ArcballSnapRingAxis) => {
  if (axis === "x") {
    return WORLD_RIGHT;
  }
  if (axis === "z") {
    return WORLD_FORWARD;
  }
  return WORLD_UP;
};

const projectVectorToSnapRing = (
  vectorWorld: Vector3,
  axis: ArcballSnapRingAxis,
) => {
  const axisVector = getSnapRingAxisVector(axis);
  const projected = vectorWorld
    .clone()
    .sub(axisVector.clone().multiplyScalar(vectorWorld.dot(axisVector)));

  if (projected.lengthSq() > ARC_BALL_IDENTITY_EPSILON) {
    return projected.normalize();
  }

  const fallback =
    axis === "x"
      ? Math.abs(vectorWorld.y) >= Math.abs(vectorWorld.z)
        ? new Vector3(0, Math.sign(vectorWorld.y || 1), 0)
        : new Vector3(0, 0, Math.sign(vectorWorld.z || 1))
      : axis === "y"
        ? Math.abs(vectorWorld.x) >= Math.abs(vectorWorld.z)
          ? new Vector3(Math.sign(vectorWorld.x || 1), 0, 0)
          : new Vector3(0, 0, Math.sign(vectorWorld.z || 1))
        : Math.abs(vectorWorld.x) >= Math.abs(vectorWorld.y)
          ? new Vector3(Math.sign(vectorWorld.x || 1), 0, 0)
          : new Vector3(0, Math.sign(vectorWorld.y || 1), 0);

  return fallback.normalize();
};

export const selectClosestArcballSnapRingAxis = (vectorWorld: Vector3) => {
  const candidates: ArcballSnapRingAxis[] = ["x", "y", "z"];

  return candidates.reduce((bestAxis, candidateAxis) =>
    Math.abs(vectorWorld[candidateAxis]) < Math.abs(vectorWorld[bestAxis])
      ? candidateAxis
      : bestAxis,
  );
};

export const selectArcballSnapRingAxisFromDrag = ({
  cameraQuaternion,
  currentVector,
  startVector,
}: {
  cameraQuaternion: Quaternion;
  currentVector: Vector3;
  startVector: Vector3;
}) => {
  const normalizedStart = startVector.clone().normalize();
  const normalizedCurrent = currentVector.clone().normalize();
  const axisCamera = normalizedStart.clone().cross(normalizedCurrent);

  if (axisCamera.lengthSq() <= ARC_BALL_IDENTITY_EPSILON) {
    return selectClosestArcballSnapRingAxis(
      startVector.clone().applyQuaternion(cameraQuaternion).normalize(),
    );
  }

  axisCamera.normalize();
  const axisWorld = axisCamera.applyQuaternion(cameraQuaternion).normalize();
  const candidates: ArcballSnapRingAxis[] = ["x", "y", "z"];

  return candidates.reduce((bestAxis, candidateAxis) => {
    return Math.abs(axisWorld[candidateAxis]) > Math.abs(axisWorld[bestAxis])
      ? candidateAxis
      : bestAxis;
  });
};

export const createArcballQuaternion = (
  startVector: Vector3,
  currentVector: Vector3,
  cameraQuaternion: Quaternion,
  sensitivityMultiplier = 1,
) => {
  const normalizedStart = startVector.clone().normalize();
  const normalizedCurrent = currentVector.clone().normalize();
  const dot = MathUtils.clamp(normalizedStart.dot(normalizedCurrent), -1, 1);

  if (dot > 1 - ARC_BALL_IDENTITY_EPSILON) {
    return new Quaternion();
  }

  let axisCamera = normalizedStart.clone().cross(normalizedCurrent);
  if (axisCamera.lengthSq() <= ARC_BALL_IDENTITY_EPSILON) {
    axisCamera = getOrthogonalAxis(normalizedStart);
  } else {
    axisCamera.normalize();
  }

  const axisWorld = axisCamera.applyQuaternion(cameraQuaternion).normalize();
  const angle = Math.acos(dot) * sensitivityMultiplier;

  return new Quaternion().setFromAxisAngle(axisWorld, angle).normalize();
};

export const createSnapRingQuaternion = (
  startVector: Vector3,
  currentVector: Vector3,
  cameraQuaternion: Quaternion,
  snapRingAxis: ArcballSnapRingAxis,
  sensitivityMultiplier = 1,
) => {
  const axisWorld = getSnapRingAxisVector(snapRingAxis);
  const startWorld = startVector.clone().applyQuaternion(cameraQuaternion);
  const currentWorld = currentVector.clone().applyQuaternion(cameraQuaternion);
  const snappedStart = projectVectorToSnapRing(startWorld, snapRingAxis);
  const snappedCurrent = projectVectorToSnapRing(currentWorld, snapRingAxis);
  const dot = MathUtils.clamp(snappedStart.dot(snappedCurrent), -1, 1);

  if (dot > 1 - ARC_BALL_IDENTITY_EPSILON) {
    return new Quaternion();
  }

  const angle =
    Math.atan2(axisWorld.dot(snappedStart.clone().cross(snappedCurrent)), dot) *
    sensitivityMultiplier;

  return new Quaternion().setFromAxisAngle(axisWorld, angle).normalize();
};
