import { MathUtils, Quaternion, Vector3 } from "three";

const AXIS_EPSILON = 0.000001;

export const snapAngleToStep = (angleRad: number, stepRad: number) => {
  if (!(stepRad > 0)) {
    return angleRad;
  }

  return Math.round(angleRad / stepRad) * stepRad;
};

export const snapAxisRotationQuaternion = (
  quaternion: Quaternion,
  axisWorld: Vector3,
  stepRad: number,
) => {
  if (!(stepRad > 0)) {
    return quaternion.clone();
  }

  const normalized = quaternion.clone().normalize();
  const vectorLength = Math.sqrt(
    normalized.x * normalized.x +
      normalized.y * normalized.y +
      normalized.z * normalized.z,
  );
  if (vectorLength <= AXIS_EPSILON) {
    return new Quaternion();
  }

  const quaternionAxis = new Vector3(
    normalized.x / vectorLength,
    normalized.y / vectorLength,
    normalized.z / vectorLength,
  );
  const axisDirection = Math.sign(quaternionAxis.dot(axisWorld)) || 1;
  const signedAngle =
    2 *
    Math.atan2(vectorLength, MathUtils.clamp(normalized.w, -1, 1)) *
    axisDirection;
  const snappedAngle = snapAngleToStep(signedAngle, stepRad);

  return new Quaternion()
    .setFromAxisAngle(axisWorld.clone().normalize(), snappedAngle)
    .normalize();
};
