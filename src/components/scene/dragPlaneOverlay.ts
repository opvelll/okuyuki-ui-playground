import { Vector3 } from "three";

export type DragPlaneOverlayState = {
  currentPoint: Vector3;
  planeNormal: Vector3;
  startPoint: Vector3;
};

export type DragPlaneOverlayGeometry = {
  center: Vector3;
  linePoints: [Vector3, Vector3];
  radius: number;
  surfaceNormal: Vector3;
};

const DEFAULT_MIN_RADIUS = 0.58;
const DEFAULT_RADIUS_MULTIPLIER = 1.15;
const SURFACE_NORMAL_EPSILON = 1e-6;
const WORLD_RIGHT = new Vector3(1, 0, 0);
const WORLD_UP = new Vector3(0, 1, 0);

function calculateOverlaySurfaceNormal(overlayState: DragPlaneOverlayState) {
  const movementVector = overlayState.currentPoint
    .clone()
    .sub(overlayState.startPoint);
  if (movementVector.lengthSq() <= SURFACE_NORMAL_EPSILON) {
    return overlayState.planeNormal.clone().normalize();
  }

  const movementDirection = movementVector.clone().normalize();
  const cameraFacingNormal = overlayState.planeNormal.clone().normalize();
  const candidateSurfaceNormal = cameraFacingNormal
    .clone()
    .projectOnPlane(movementDirection);

  if (candidateSurfaceNormal.lengthSq() > SURFACE_NORMAL_EPSILON) {
    return candidateSurfaceNormal.normalize();
  }

  const cameraRight = WORLD_UP.clone().cross(cameraFacingNormal);
  if (cameraRight.lengthSq() > SURFACE_NORMAL_EPSILON) {
    return cameraRight.cross(movementDirection).normalize();
  }

  return WORLD_RIGHT.clone().cross(movementDirection).normalize();
}

export function calculateDragPlaneOverlayGeometry(
  overlayState: DragPlaneOverlayState,
  {
    minRadius = DEFAULT_MIN_RADIUS,
    radiusMultiplier = DEFAULT_RADIUS_MULTIPLIER,
  }: {
    minRadius?: number;
    radiusMultiplier?: number;
  } = {},
): DragPlaneOverlayGeometry {
  const center = overlayState.startPoint.clone();
  const radius = Math.max(
    overlayState.startPoint.distanceTo(overlayState.currentPoint) *
      radiusMultiplier,
    minRadius,
  );

  return {
    center,
    linePoints: [
      overlayState.startPoint.clone(),
      overlayState.currentPoint.clone(),
    ],
    radius,
    surfaceNormal: calculateOverlaySurfaceNormal(overlayState),
  };
}
