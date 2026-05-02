import { Euler, Quaternion, Vector3 } from "three";
import type {
  AxisMagnetTarget,
  MoveAlwaysSnapMode,
  MoveAxisMagnetReferenceFrame,
  MoveGridSnapPattern,
} from "../../store/uiStore";
import type { SceneObject } from "../../types/scene";

const AXES = ["x", "y", "z"] as const;
const DEFAULT_AXIS_MAGNET_THRESHOLD = 0.18;
const AXIS_MAGNET_STICKINESS_MULTIPLIER = 1.35;
const AXIS_DIRECTION_VECTORS = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
} as const;

type AxisName = (typeof AXES)[number];

type ApplyScreenDepthDragModifiersParams = {
  axisMagnetThreshold?: number;
  alwaysSnapMode?: MoveAlwaysSnapMode;
  axisMagnetReferenceFrame?: MoveAxisMagnetReferenceFrame;
  currentAxisMagnetTarget?: AxisMagnetTarget | null;
  ctrlKey: boolean;
  gridSnapPattern?: MoveGridSnapPattern;
  objectId: string;
  objectsById: Record<string, SceneObject>;
  position: Vector3;
  gridSnapStep: number;
  shiftKey: boolean;
};

type ApplyScreenDepthDragModifiersResult = {
  axisMagnetTarget: AxisMagnetTarget | null;
  position: Vector3;
};

const snapValueToStep = (value: number, step: number) => {
  if (!(step > 0)) {
    return value;
  }

  return Math.round(value / step) * step;
};

const snapPositionToGrid = (
  position: Vector3,
  step: number,
  pattern: MoveGridSnapPattern,
) =>
  new Vector3(
    snapValueToStep(position.x, step),
    pattern === "xyz" ? snapValueToStep(position.y, step) : position.y,
    snapValueToStep(position.z, step),
  );

const vectorFromTuple = ([x, y, z]: [number, number, number]) =>
  new Vector3(x, y, z);

const getSceneObjectQuaternion = (sceneObject: SceneObject) =>
  new Quaternion().setFromEuler(
    new Euler(
      sceneObject.rotation[0],
      sceneObject.rotation[1],
      sceneObject.rotation[2],
    ),
  );

const getAxisDirectionVector = (
  sceneObject: SceneObject,
  axis: AxisName,
  direction: AxisMagnetTarget["direction"],
  referenceFrame: MoveAxisMagnetReferenceFrame,
) => {
  const directionVector = AXIS_DIRECTION_VECTORS[axis].clone();

  if (referenceFrame === "local") {
    directionVector.applyQuaternion(getSceneObjectQuaternion(sceneObject));
  }

  directionVector.normalize();

  if (direction === "negative") {
    directionVector.negate();
  }

  return directionVector;
};

const snapPositionToAxisRay = (
  position: Vector3,
  origin: Vector3,
  directionVector: Vector3,
) => {
  const fromOrigin = position.clone().sub(origin);
  const projectedDistance = Math.max(0, fromOrigin.dot(directionVector));
  const snappedPosition = origin
    .clone()
    .add(directionVector.clone().multiplyScalar(projectedDistance));

  return {
    distance: position.distanceTo(snappedPosition),
    position: snappedPosition,
    projectedDistance,
  };
};

const snapPositionToSingleAxisMagnet = (
  position: Vector3,
  objectId: string,
  objectsById: Record<string, SceneObject>,
  referenceFrame: MoveAxisMagnetReferenceFrame,
  threshold: number,
  currentAxisMagnetTarget: AxisMagnetTarget | null,
): ApplyScreenDepthDragModifiersResult => {
  if (currentAxisMagnetTarget) {
    const stickyObject = objectsById[currentAxisMagnetTarget.objectId];
    if (stickyObject) {
      const stickyOrigin = vectorFromTuple(stickyObject.position);
      const stickyDirection = getAxisDirectionVector(
        stickyObject,
        currentAxisMagnetTarget.axis,
        currentAxisMagnetTarget.direction,
        referenceFrame,
      );
      const stickySnap = snapPositionToAxisRay(
        position,
        stickyOrigin,
        stickyDirection,
      );

      if (
        stickySnap.distance <=
        threshold * AXIS_MAGNET_STICKINESS_MULTIPLIER
      ) {
        return {
          axisMagnetTarget: currentAxisMagnetTarget,
          position: stickySnap.position,
        };
      }
    }
  }

  let bestAxis: AxisName | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestDirection: AxisMagnetTarget["direction"] | null = null;
  let bestObjectId: string | null = null;
  let bestPosition: Vector3 | null = null;

  for (const sceneObject of Object.values(objectsById)) {
    if (sceneObject.id === objectId) {
      continue;
    }

    const origin = vectorFromTuple(sceneObject.position);

    for (const axis of AXES) {
      for (const direction of ["positive", "negative"] as const) {
        const directionVector = getAxisDirectionVector(
          sceneObject,
          axis,
          direction,
          referenceFrame,
        );
        const snapped = snapPositionToAxisRay(
          position,
          origin,
          directionVector,
        );
        if (snapped.distance > threshold || snapped.distance >= bestDistance) {
          continue;
        }

        bestAxis = axis;
        bestDirection = direction;
        bestDistance = snapped.distance;
        bestObjectId = sceneObject.id;
        bestPosition = snapped.position;
      }
    }
  }

  if (!bestAxis || !bestDirection || !bestObjectId || !bestPosition) {
    return {
      axisMagnetTarget: null,
      position: position.clone(),
    };
  }

  return {
    axisMagnetTarget: {
      axis: bestAxis,
      direction: bestDirection,
      objectId: bestObjectId,
    },
    position: bestPosition,
  };
};

export function applyScreenDepthDragModifiers({
  axisMagnetThreshold = DEFAULT_AXIS_MAGNET_THRESHOLD,
  alwaysSnapMode = "off",
  axisMagnetReferenceFrame = "local",
  currentAxisMagnetTarget = null,
  ctrlKey,
  gridSnapPattern = "xyz",
  objectId,
  objectsById,
  position,
  gridSnapStep,
  shiftKey,
}: ApplyScreenDepthDragModifiersParams): ApplyScreenDepthDragModifiersResult {
  if (shiftKey && ctrlKey) {
    return {
      axisMagnetTarget: null,
      position: snapPositionToGrid(position, gridSnapStep, gridSnapPattern),
    };
  }

  if (ctrlKey) {
    return snapPositionToSingleAxisMagnet(
      position,
      objectId,
      objectsById,
      axisMagnetReferenceFrame,
      axisMagnetThreshold,
      currentAxisMagnetTarget,
    );
  }

  if (alwaysSnapMode === "axis-magnet") {
    return snapPositionToSingleAxisMagnet(
      position,
      objectId,
      objectsById,
      axisMagnetReferenceFrame,
      axisMagnetThreshold,
      currentAxisMagnetTarget,
    );
  }

  if (alwaysSnapMode === "grid") {
    return {
      axisMagnetTarget: null,
      position: snapPositionToGrid(position, gridSnapStep, gridSnapPattern),
    };
  }

  return {
    axisMagnetTarget: null,
    position: position.clone(),
  };
}

export function calculateAxisMagnetLinePoints(
  axisMagnetTarget: AxisMagnetTarget | null,
  axisMagnetReferenceFrame: MoveAxisMagnetReferenceFrame,
  objectsById: Record<string, SceneObject>,
  currentPoint: Vector3,
  minLength = 1.6,
) {
  if (!axisMagnetTarget) {
    return null;
  }

  const targetObject = objectsById[axisMagnetTarget.objectId];
  if (!targetObject) {
    return null;
  }

  const origin = vectorFromTuple(targetObject.position);
  const directionVector = getAxisDirectionVector(
    targetObject,
    axisMagnetTarget.axis,
    axisMagnetTarget.direction,
    axisMagnetReferenceFrame,
  );
  const length = Math.max(origin.distanceTo(currentPoint), minLength);

  return [
    origin,
    origin.clone().add(directionVector.multiplyScalar(length)),
  ] as const;
}
