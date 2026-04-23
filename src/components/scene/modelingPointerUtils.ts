import { type Camera, Vector3 } from "three";
import { compareVector3Tuple } from "../../lib/vector3Tuple";
import type { Vector3Tuple } from "../../types/scene";

export type ModelingPointerSnapConfig = {
  axisSnapPositions?: Vector3Tuple[];
  axisDistance: number;
  axisEnabled: boolean;
  edgeSnapTargets?: ModelingPointerEdgeSnapTarget[];
  edgeDistance: number;
  edgeEnabled: boolean;
  gridEnabled: boolean;
  gridStep: number;
  vertexDistance: number;
  vertexEnabled: boolean;
};

export type ModelingPointerEdgeSnapTarget = {
  edgeId: string;
  start: Vector3Tuple;
  end: Vector3Tuple;
  vertexIds: [string, string];
};

export type ModelingPointerSnapResult = {
  position: Vector3Tuple;
  snappedAxes: [boolean, boolean, boolean];
  snappedAxisTargets: [
    Vector3Tuple | null,
    Vector3Tuple | null,
    Vector3Tuple | null,
  ];
  snappedEdgeTarget: {
    edgeId: string;
    position: Vector3Tuple;
    vertexIds: [string, string];
  } | null;
  snappedVertexTarget: Vector3Tuple | null;
};

export type ModelingPointerDepthHint = {
  farCount: number;
  nearCount: number;
  pointerScreenPosition: {
    x: number;
    y: number;
  };
};

export const MODELING_POINTER_PRECISION_GRID_STEP_MIN = 0.001;

const AXIS_VECTORS: [Vector3Tuple, Vector3Tuple, Vector3Tuple] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
const FULL_CIRCLE_DEG = 360;

function getLineDirectionSnapVectors(stepDeg: number) {
  if (!(stepDeg > 0 && stepDeg <= 180)) {
    return AXIS_VECTORS;
  }

  const uniqueDirections = new Map<string, Vector3Tuple>();
  const registerDirection = (vector: Vector3Tuple) => {
    const length = Math.hypot(vector[0], vector[1], vector[2]);
    if (length <= 0) {
      return;
    }

    const normalized: Vector3Tuple = [
      normalizeCoordinate(vector[0] / length),
      normalizeCoordinate(vector[1] / length),
      normalizeCoordinate(vector[2] / length),
    ];
    uniqueDirections.set(normalized.join(":"), normalized);
  };

  for (
    let angleDeg = 0;
    angleDeg < FULL_CIRCLE_DEG;
    angleDeg += Math.max(1, stepDeg)
  ) {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cosine = Math.cos(angleRad);
    const sine = Math.sin(angleRad);

    registerDirection([cosine, sine, 0]);
    registerDirection([cosine, 0, sine]);
    registerDirection([0, cosine, sine]);
  }

  return [...uniqueDirections.values()];
}

function snapToGrid(value: number, step: number) {
  if (step <= 0) {
    return value;
  }

  return Number((Math.round(value / step) * step).toFixed(6));
}

function normalizeCoordinate(value: number) {
  return Number(value.toFixed(6));
}

function normalizeVector3Tuple(
  vector: Pick<Vector3, "x" | "y" | "z">,
): Vector3Tuple {
  return [
    normalizeCoordinate(vector.x),
    normalizeCoordinate(vector.y),
    normalizeCoordinate(vector.z),
  ];
}

function projectWorldPointToScreen(
  point: Vector3Tuple,
  camera: Camera,
  viewportSize: { height: number; width: number },
) {
  const projectedPoint = new Vector3(...point).project(camera);
  if (
    !Number.isFinite(projectedPoint.x) ||
    !Number.isFinite(projectedPoint.y) ||
    !Number.isFinite(projectedPoint.z) ||
    projectedPoint.z < -1 ||
    projectedPoint.z > 1
  ) {
    return null;
  }

  return {
    x: ((projectedPoint.x + 1) * viewportSize.width) / 2,
    y: ((1 - projectedPoint.y) * viewportSize.height) / 2,
  };
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

export function getLineDirectionSnapPosition(
  startPosition: Vector3Tuple,
  currentPosition: Vector3Tuple,
  stepDeg = 45,
) {
  const delta = new Vector3(...currentPosition).sub(
    new Vector3(...startPosition),
  );

  if (delta.lengthSq() === 0) {
    return [...startPosition] as Vector3Tuple;
  }

  let bestPosition = [...currentPosition] as Vector3Tuple;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const directionVector of getLineDirectionSnapVectors(stepDeg)) {
    const direction = new Vector3(...directionVector);
    const projectedLength = delta.dot(direction);

    if (projectedLength < 0) {
      continue;
    }

    const snappedPosition = new Vector3(...startPosition).add(
      direction.multiplyScalar(projectedLength),
    );
    const distance = snappedPosition.distanceTo(
      new Vector3(...currentPosition),
    );

    if (distance >= bestDistance) {
      continue;
    }

    bestDistance = distance;
    bestPosition = normalizeVector3Tuple(snappedPosition);
  }

  return bestPosition;
}

export function getModelingPointerSnapResult(
  position: Vector3Tuple,
  vertexPositions: Vector3Tuple[],
  snapConfig: ModelingPointerSnapConfig,
): ModelingPointerSnapResult {
  if (
    !snapConfig.vertexEnabled &&
    !snapConfig.edgeEnabled &&
    !snapConfig.axisEnabled &&
    !snapConfig.gridEnabled
  ) {
    return {
      position: [...position],
      snappedAxes: [false, false, false],
      snappedAxisTargets: [null, null, null],
      snappedEdgeTarget: null,
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
        snappedEdgeTarget: null,
        snappedVertexTarget: [...closestVertexPosition],
      };
    }
  }

  if (snapConfig.edgeEnabled && snapConfig.edgeDistance > 0) {
    let closestEdgeTarget: ModelingPointerSnapResult["snappedEdgeTarget"] =
      null;
    let closestDistance = snapConfig.edgeDistance;
    const pointer = new Vector3(...position);

    for (const edgeSnapTarget of snapConfig.edgeSnapTargets ?? []) {
      const start = new Vector3(...edgeSnapTarget.start);
      const end = new Vector3(...edgeSnapTarget.end);
      const edgeVector = end.clone().sub(start);
      const edgeLengthSquared = edgeVector.lengthSq();

      if (edgeLengthSquared === 0) {
        continue;
      }

      const projection = pointer.clone().sub(start).dot(edgeVector);
      const t = Math.max(0, Math.min(1, projection / edgeLengthSquared));
      const projectedPoint = start.add(edgeVector.multiplyScalar(t));
      const distance = pointer.distanceTo(projectedPoint);

      if (distance >= closestDistance) {
        continue;
      }

      closestDistance = distance;
      closestEdgeTarget = {
        edgeId: edgeSnapTarget.edgeId,
        position: normalizeVector3Tuple(projectedPoint),
        vertexIds: [...edgeSnapTarget.vertexIds],
      };
    }

    if (closestEdgeTarget) {
      return {
        position: [...closestEdgeTarget.position],
        snappedAxes: [false, false, false],
        snappedAxisTargets: [null, null, null],
        snappedEdgeTarget: closestEdgeTarget,
        snappedVertexTarget: null,
      };
    }
  }

  if (!snapConfig.axisEnabled && !snapConfig.gridEnabled) {
    return {
      position: [...position],
      snappedAxes: [false, false, false],
      snappedAxisTargets: [null, null, null],
      snappedEdgeTarget: null,
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
  const axisSnapPositions = snapConfig.axisSnapPositions ?? vertexPositions;

  if (snapConfig.axisEnabled && snapConfig.axisDistance > 0) {
    let closestAxisIndex: 0 | 1 | 2 | null = null;
    let closestDistance = snapConfig.axisDistance;
    let closestPosition: Vector3Tuple | null = null;
    let closestVertexPosition: Vector3Tuple | null = null;

    for (const vertexPosition of axisSnapPositions) {
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
    snappedEdgeTarget: null,
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

export function getModelingPointerDepthHint(
  pointerPosition: Vector3Tuple,
  vertexPositions: Vector3Tuple[],
  camera: Camera,
  viewportSize: { height: number; width: number },
  options: {
    depthDistance: number;
    screenDistancePx: number;
  },
): ModelingPointerDepthHint | null {
  if (options.depthDistance <= 0 || options.screenDistancePx <= 0) {
    return null;
  }

  const pointerScreenPosition = projectWorldPointToScreen(
    pointerPosition,
    camera,
    viewportSize,
  );
  if (!pointerScreenPosition) {
    return null;
  }

  const pointerVector = new Vector3(...pointerPosition);
  const cameraForward = new Vector3();
  camera.getWorldDirection(cameraForward);
  let nearCount = 0;
  let farCount = 0;

  for (const vertexPosition of vertexPositions) {
    const vertexScreenPosition = projectWorldPointToScreen(
      vertexPosition,
      camera,
      viewportSize,
    );
    if (!vertexScreenPosition) {
      continue;
    }

    const screenDistance = Math.hypot(
      vertexScreenPosition.x - pointerScreenPosition.x,
      vertexScreenPosition.y - pointerScreenPosition.y,
    );
    if (screenDistance > options.screenDistancePx) {
      continue;
    }

    const depthOffset = new Vector3(...vertexPosition)
      .sub(pointerVector)
      .dot(cameraForward);
    if (depthOffset <= -options.depthDistance) {
      nearCount += 1;
      continue;
    }

    if (depthOffset >= options.depthDistance) {
      farCount += 1;
    }
  }

  if (nearCount === 0 && farCount === 0) {
    return null;
  }

  return {
    farCount,
    nearCount,
    pointerScreenPosition,
  };
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
