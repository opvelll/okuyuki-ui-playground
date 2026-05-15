import { Vector3 } from "three";
import type { MoveOverlayOrientationMode } from "../../store/uiStore";

export type DragPlaneOverlayState = {
  currentPoint: Vector3;
  orientationMode: MoveOverlayOrientationMode;
  planeNormal: Vector3;
  previousSurfaceNormal: Vector3 | null;
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

function projectReferenceAxisOntoOverlayPlane(
  movementDirection: Vector3,
  referenceAxis: Vector3,
) {
  const projectedAxis = referenceAxis.clone().projectOnPlane(movementDirection);
  if (projectedAxis.lengthSq() > SURFACE_NORMAL_EPSILON) {
    return projectedAxis.normalize();
  }

  return null;
}

function projectPreviousNormalOntoOverlayPlane(
  movementDirection: Vector3,
  previousSurfaceNormal: Vector3 | null,
) {
  if (!previousSurfaceNormal) {
    return null;
  }

  const projectedNormal = previousSurfaceNormal
    .clone()
    .projectOnPlane(movementDirection);
  if (projectedNormal.lengthSq() > SURFACE_NORMAL_EPSILON) {
    return projectedNormal.normalize();
  }

  return null;
}

function calculateCameraFacingSurfaceNormal(
  overlayState: DragPlaneOverlayState,
  movementDirection: Vector3 | null,
) {
  if (!movementDirection) {
    return overlayState.planeNormal.clone().normalize();
  }

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

function orientNormalTowardsHemisphere(
  normal: Vector3,
  primaryHemisphere: Vector3,
  previousSurfaceNormal: Vector3 | null,
) {
  if (previousSurfaceNormal) {
    const flippedNormal = normal.clone().negate();
    return normal.dot(previousSurfaceNormal) >=
      flippedNormal.dot(previousSurfaceNormal)
      ? normal
      : flippedNormal;
  }

  if (normal.dot(primaryHemisphere) < 0) {
    return normal.negate();
  }

  return normal;
}

function calculateAxisAlignedSurfaceNormal(
  overlayState: DragPlaneOverlayState,
  movementDirection: Vector3 | null,
  referenceAxis: Vector3,
  fallbackAxis: Vector3,
  primaryHemisphere: Vector3,
) {
  if (!movementDirection) {
    const fallbackNormal = referenceAxis.clone().cross(fallbackAxis);
    if (fallbackNormal.lengthSq() > SURFACE_NORMAL_EPSILON) {
      return orientNormalTowardsHemisphere(
        fallbackNormal.normalize(),
        primaryHemisphere,
        overlayState.previousSurfaceNormal,
      );
    }

    return calculateCameraFacingSurfaceNormal(overlayState, null);
  }

  const planeAxis = projectReferenceAxisOntoOverlayPlane(
    movementDirection,
    referenceAxis,
  );
  if (planeAxis) {
    return orientNormalTowardsHemisphere(
      movementDirection.clone().cross(planeAxis).normalize(),
      primaryHemisphere,
      overlayState.previousSurfaceNormal,
    );
  }

  const previousNormal = projectPreviousNormalOntoOverlayPlane(
    movementDirection,
    overlayState.previousSurfaceNormal,
  );
  if (previousNormal) {
    return orientNormalTowardsHemisphere(
      previousNormal,
      primaryHemisphere,
      overlayState.previousSurfaceNormal,
    );
  }

  const fallbackPlaneAxis = projectReferenceAxisOntoOverlayPlane(
    movementDirection,
    fallbackAxis,
  );
  if (fallbackPlaneAxis) {
    return orientNormalTowardsHemisphere(
      movementDirection.clone().cross(fallbackPlaneAxis).normalize(),
      primaryHemisphere,
      overlayState.previousSurfaceNormal,
    );
  }

  return calculateCameraFacingSurfaceNormal(overlayState, movementDirection);
}

function calculateUpFacingSurfaceNormal(
  overlayState: DragPlaneOverlayState,
  movementDirection: Vector3 | null,
) {
  if (!movementDirection) {
    return WORLD_UP.clone();
  }

  const candidateNormal = WORLD_UP.clone().projectOnPlane(movementDirection);
  if (candidateNormal.lengthSq() > SURFACE_NORMAL_EPSILON) {
    return orientNormalTowardsHemisphere(
      candidateNormal.normalize(),
      WORLD_UP,
      overlayState.previousSurfaceNormal,
    );
  }

  const previousNormal = projectPreviousNormalOntoOverlayPlane(
    movementDirection,
    overlayState.previousSurfaceNormal,
  );
  if (previousNormal) {
    return orientNormalTowardsHemisphere(
      previousNormal,
      WORLD_UP,
      overlayState.previousSurfaceNormal,
    );
  }

  const fallbackNormal = WORLD_RIGHT.clone().projectOnPlane(movementDirection);
  if (fallbackNormal.lengthSq() > SURFACE_NORMAL_EPSILON) {
    return orientNormalTowardsHemisphere(
      fallbackNormal.normalize(),
      WORLD_UP,
      overlayState.previousSurfaceNormal,
    );
  }

  return WORLD_UP.clone();
}

function calculateOverlaySurfaceNormal(overlayState: DragPlaneOverlayState) {
  const movementVector = overlayState.currentPoint
    .clone()
    .sub(overlayState.startPoint);
  const movementDirection =
    movementVector.lengthSq() > SURFACE_NORMAL_EPSILON
      ? movementVector.clone().normalize()
      : null;

  switch (overlayState.orientationMode) {
    case "screen-vertical":
      return calculateAxisAlignedSurfaceNormal(
        overlayState,
        movementDirection,
        WORLD_UP,
        WORLD_RIGHT,
        WORLD_RIGHT,
      );
    case "screen-horizontal":
      return calculateUpFacingSurfaceNormal(overlayState, movementDirection);
    default:
      return calculateCameraFacingSurfaceNormal(
        overlayState,
        movementDirection,
      );
  }
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
