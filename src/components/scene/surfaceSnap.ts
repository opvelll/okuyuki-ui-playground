import { Plane, type Ray, Vector3 } from "three";

export const GUIDE_SURFACE = {
  center: new Vector3(0, 1.5, -3.6),
  height: 3,
  normal: new Vector3(0, 0, 1),
  width: 5,
} as const;

export type SurfaceSnapHit = {
  objectPosition: Vector3;
  pointerPoint: Vector3;
};

export function applySurfaceDepthOffset(
  surfacePosition: Vector3,
  depthOffset: Vector3,
) {
  return surfacePosition.clone().add(depthOffset);
}

export function intersectRayWithGuideSurface(
  ray: Ray,
  pointerOffset: Vector3,
): SurfaceSnapHit | null {
  const plane = new Plane().setFromNormalAndCoplanarPoint(
    GUIDE_SURFACE.normal,
    GUIDE_SURFACE.center,
  );
  const pointerPoint = ray.intersectPlane(plane, new Vector3());

  if (!pointerPoint) {
    return null;
  }

  const parallelPointerOffset = pointerOffset
    .clone()
    .addScaledVector(
      GUIDE_SURFACE.normal,
      -pointerOffset.dot(GUIDE_SURFACE.normal),
    );
  const objectPosition = pointerPoint.clone().add(parallelPointerOffset);
  const relativePointerPosition = pointerPoint
    .clone()
    .sub(GUIDE_SURFACE.center);

  if (
    Math.abs(relativePointerPosition.x) > GUIDE_SURFACE.width / 2 ||
    Math.abs(relativePointerPosition.y) > GUIDE_SURFACE.height / 2
  ) {
    return null;
  }

  objectPosition.z = GUIDE_SURFACE.center.z;

  return {
    objectPosition,
    pointerPoint,
  };
}
