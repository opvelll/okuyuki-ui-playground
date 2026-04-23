import { Vector3 } from "three";
import { compareVector3Tuple } from "../../lib/vector3Tuple";
import type { Vector3Tuple } from "../../types/scene";

export type ModelingPointerSnapConfig = {
  axisDistance: number;
  axisEnabled: boolean;
  gridEnabled: boolean;
  gridStep: number;
  vertexDistance: number;
  vertexEnabled: boolean;
};

export type ModelingPointerSnapResult = {
  position: Vector3Tuple;
  snappedAxes: [boolean, boolean, boolean];
  snappedAxisTargets: [
    Vector3Tuple | null,
    Vector3Tuple | null,
    Vector3Tuple | null,
  ];
  snappedVertexTarget: Vector3Tuple | null;
};

export const MODELING_POINTER_PRECISION_GRID_STEP_MIN = 0.001;

const AXIS_VECTORS: [Vector3Tuple, Vector3Tuple, Vector3Tuple] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

function snapToGrid(value: number, step: number) {
  if (step <= 0) {
    return value;
  }

  return Number((Math.round(value / step) * step).toFixed(6));
}

function normalizeCoordinate(value: number) {
  return Number(value.toFixed(6));
}

export function getEffectiveModelingPointerGridStep(
  gridStep: number,
  precisionScale: number,
  precisionMode: boolean,
) {
  const effectiveGridStep = precisionMode
    ? Math.max(
        MODELING_POINTER_PRECISION_GRID_STEP_MIN,
        gridStep * precisionScale,
      )
    : gridStep;

  return normalizeCoordinate(effectiveGridStep);
}

export function getModelingPointerSnapResult(
  position: Vector3Tuple,
  vertexPositions: Vector3Tuple[],
  snapConfig: ModelingPointerSnapConfig,
): ModelingPointerSnapResult {
  if (
    !snapConfig.vertexEnabled &&
    !snapConfig.axisEnabled &&
    !snapConfig.gridEnabled
  ) {
    return {
      position: [...position],
      snappedAxes: [false, false, false],
      snappedAxisTargets: [null, null, null],
      snappedVertexTarget: null,
    };
  }

  if (snapConfig.vertexEnabled && snapConfig.vertexDistance > 0) {
    let closestVertexPosition: Vector3Tuple | null = null;
    let closestDistance = snapConfig.vertexDistance;

    for (const vertexPosition of vertexPositions) {
      const distance = new Vector3(...position).distanceTo(
        new Vector3(...vertexPosition),
      );

      if (distance >= closestDistance) {
        continue;
      }

      closestDistance = distance;
      closestVertexPosition = vertexPosition;
    }

    if (closestVertexPosition) {
      return {
        position: [...closestVertexPosition],
        snappedAxes: [false, false, false],
        snappedAxisTargets: [null, null, null],
        snappedVertexTarget: [...closestVertexPosition],
      };
    }
  }

  if (!snapConfig.axisEnabled && !snapConfig.gridEnabled) {
    return {
      position: [...position],
      snappedAxes: [false, false, false],
      snappedAxisTargets: [null, null, null],
      snappedVertexTarget: null,
    };
  }

  const snappedPosition: Vector3Tuple = [...position];
  const snappedAxes = new Set<number>();
  const snappedAxisTargets: ModelingPointerSnapResult["snappedAxisTargets"] = [
    null,
    null,
    null,
  ];

  if (snapConfig.axisEnabled && snapConfig.axisDistance > 0) {
    let closestAxisIndex: 0 | 1 | 2 | null = null;
    let closestDistance = snapConfig.axisDistance;
    let closestPosition: Vector3Tuple | null = null;
    let closestVertexPosition: Vector3Tuple | null = null;

    for (const vertexPosition of vertexPositions) {
      const origin = new Vector3(...vertexPosition);
      const pointer = new Vector3(...position);

      for (const [axisIndex, axisVector] of AXIS_VECTORS.entries()) {
        const axis = new Vector3(...axisVector);
        const projectionLength = pointer.clone().sub(origin).dot(axis);
        const projectedPoint = origin
          .clone()
          .add(axis.multiplyScalar(projectionLength));
        const distance = pointer.distanceTo(projectedPoint);

        if (distance >= closestDistance) {
          continue;
        }

        closestAxisIndex = axisIndex as 0 | 1 | 2;
        closestDistance = distance;
        closestPosition = [
          normalizeCoordinate(projectedPoint.x),
          normalizeCoordinate(projectedPoint.y),
          normalizeCoordinate(projectedPoint.z),
        ];
        closestVertexPosition = vertexPosition;
      }
    }

    if (closestAxisIndex !== null && closestPosition && closestVertexPosition) {
      snappedPosition[0] = closestPosition[0];
      snappedPosition[1] = closestPosition[1];
      snappedPosition[2] = closestPosition[2];
      snappedAxes.add(closestAxisIndex);
      snappedAxisTargets[closestAxisIndex] = closestVertexPosition;
    }
  }

  if (snapConfig.gridEnabled && snapConfig.gridStep > 0) {
    for (let axisIndex = 0; axisIndex < 3; axisIndex += 1) {
      if (snappedAxes.size > 0 && snappedAxes.has(axisIndex)) {
        snappedPosition[axisIndex] = snapToGrid(
          snappedPosition[axisIndex],
          snapConfig.gridStep,
        );
        continue;
      }

      if (snappedAxes.size > 0) {
        continue;
      }

      snappedPosition[axisIndex] = snapToGrid(
        snappedPosition[axisIndex],
        snapConfig.gridStep,
      );
    }
  }

  return {
    position: snappedPosition,
    snappedAxes: [0, 1, 2].map((axisIndex) =>
      snappedAxes.has(axisIndex),
    ) as ModelingPointerSnapResult["snappedAxes"],
    snappedAxisTargets,
    snappedVertexTarget: null,
  };
}

export function getSnappedModelingPointerPosition(
  position: Vector3Tuple,
  vertexPositions: Vector3Tuple[],
  snapConfig: ModelingPointerSnapConfig,
): Vector3Tuple {
  return getModelingPointerSnapResult(position, vertexPositions, snapConfig)
    .position;
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
