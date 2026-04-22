import { Vector3 } from "three";
import { compareVector3Tuple } from "../../lib/vector3Tuple";
import type { Vector3Tuple } from "../../types/scene";

export type ModelingPointerSnapConfig = {
  axisDistance: number;
  enabled: boolean;
  gridStep: number;
};

function snapToGrid(value: number, step: number) {
  if (step <= 0) {
    return value;
  }

  return Number((Math.round(value / step) * step).toFixed(6));
}

export function getSnappedModelingPointerPosition(
  position: Vector3Tuple,
  vertexPositions: Vector3Tuple[],
  snapConfig: ModelingPointerSnapConfig,
): Vector3Tuple {
  if (!snapConfig.enabled) {
    return [...position];
  }

  const snappedPosition: Vector3Tuple = [...position];
  const snappedAxes = new Set<number>();

  if (snapConfig.axisDistance > 0) {
    for (let axisIndex = 0; axisIndex < 3; axisIndex += 1) {
      let closestCoordinate: number | null = null;
      let closestDistance = snapConfig.axisDistance;

      for (const vertexPosition of vertexPositions) {
        const axisDistance = Math.abs(
          vertexPosition[axisIndex] - position[axisIndex],
        );

        if (axisDistance >= closestDistance) {
          continue;
        }

        closestCoordinate = vertexPosition[axisIndex];
        closestDistance = axisDistance;
      }

      if (closestCoordinate === null) {
        continue;
      }

      snappedPosition[axisIndex] = closestCoordinate;
      snappedAxes.add(axisIndex);
    }
  }

  if (snapConfig.gridStep > 0) {
    for (let axisIndex = 0; axisIndex < 3; axisIndex += 1) {
      if (snappedAxes.has(axisIndex)) {
        continue;
      }

      snappedPosition[axisIndex] = snapToGrid(
        snappedPosition[axisIndex],
        snapConfig.gridStep,
      );
    }
  }

  return snappedPosition;
}

export function modelingPointerPositionsMatch(
  a: Vector3Tuple,
  b: Vector3Tuple,
) {
  return compareVector3Tuple(a, b);
}

export function getVertexSelectionDistance(
  cameraPosition: Vector3,
  pointerPosition: Vector3Tuple,
) {
  const pointerVector = new Vector3(...pointerPosition);
  return Math.max(
    0.28,
    Math.min(cameraPosition.distanceTo(pointerVector) * 0.04, 0.8),
  );
}
