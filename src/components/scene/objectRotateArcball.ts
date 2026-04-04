import { MathUtils, Quaternion, Vector3 } from "three";

const ARC_BALL_IDENTITY_EPSILON = 0.000001;

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
