import { type Camera, Vector3 } from "three";
import type { Vector3Tuple } from "../../types/scene";

const LASSO_POINT_MIN_DISTANCE_PX = 6;

export function appendLassoPoint(
  points: Array<[number, number]>,
  nextPoint: [number, number],
) {
  const lastPoint = points.at(-1);
  if (
    lastPoint &&
    Math.hypot(nextPoint[0] - lastPoint[0], nextPoint[1] - lastPoint[1]) <
      LASSO_POINT_MIN_DISTANCE_PX
  ) {
    return points;
  }

  return [...points, nextPoint];
}

export function isPointInsideLasso(
  point: [number, number],
  polygon: Array<[number, number]>,
) {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;

  for (
    let currentIndex = 0, previousIndex = polygon.length - 1;
    currentIndex < polygon.length;
    previousIndex = currentIndex++
  ) {
    const [currentX, currentY] = polygon[currentIndex];
    const [previousX, previousY] = polygon[previousIndex];
    const intersects =
      currentY > point[1] !== previousY > point[1] &&
      point[0] <
        ((previousX - currentX) * (point[1] - currentY)) /
          (previousY - currentY) +
          currentX;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function projectVertexToScreenPoint(
  position: Vector3Tuple,
  camera: Camera,
  viewport: { width: number; height: number },
) {
  const projected = new Vector3(...position).project(camera);
  if (
    Number.isNaN(projected.x) ||
    Number.isNaN(projected.y) ||
    Number.isNaN(projected.z) ||
    projected.z < -1 ||
    projected.z > 1
  ) {
    return null;
  }

  return {
    point: [
      ((projected.x + 1) * viewport.width) / 2,
      ((1 - projected.y) * viewport.height) / 2,
    ] as [number, number],
    projectedZ: projected.z,
  };
}
