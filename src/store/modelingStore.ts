import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  getBoxVerticesFromDiagonal,
  getRectangleVerticesFromDiagonal,
} from "../components/scene/modelingPointerUtils";
import {
  type PenStrokeParams,
  processPenStrokePoints,
} from "../components/scene/penStrokeProcessing";
import { compareVector3Tuple } from "../lib/vector3Tuple";
import type { Vector3Tuple } from "../types/scene";
import type { ModelingRectangleMode } from "./uiStore";

export type ModelingVertex = {
  id: string;
  position: Vector3Tuple;
};

export type ModelingEdge = {
  id: string;
  vertexIds: [string, string];
};

export type ModelingFace = {
  id: string;
  vertexIds: [string, string, string];
};

export type ModelingModel = {
  edgeOrder: string[];
  edgesById: Record<string, ModelingEdge>;
  faceOrder: string[];
  facesById: Record<string, ModelingFace>;
  id: string;
  name: string;
  rootPosition: Vector3Tuple;
  rootRotation: Vector3Tuple;
  vertexOrder: string[];
  verticesById: Record<string, ModelingVertex>;
};

export type ModelingSnapshot = {
  currentModelId: string;
  modelsById: Record<string, ModelingModel>;
  selectedEdgeIds: string[];
  selectedFaceIds: string[];
  selectedRoot: boolean;
  selectedVertexIds: string[];
};

type ModelingState = ModelingSnapshot & {
  activeVertexMoveDrag: {
    anchorVertexId: string;
    snapshot: ModelingSnapshot;
    vertexIds: string[];
  } | null;
  autoNameIndex: number;
  createEdgeFromPositions: (
    startPosition: Vector3Tuple,
    endPosition: Vector3Tuple,
    options?:
      | number
      | {
          endEdgeTarget?: {
            edgeId: string;
            position: Vector3Tuple;
            vertexIds: [string, string];
          } | null;
          endVertexId?: string | null;
          snapDistance?: number;
          startEdgeTarget?: {
            edgeId: string;
            position: Vector3Tuple;
            vertexIds: [string, string];
          } | null;
          startVertexId?: string | null;
        },
  ) => boolean;
  history: ModelingSnapshot[];
  historyIndex: number;
  addVertex: (
    position: Vector3Tuple,
    options?: {
      edgeTarget?: {
        edgeId: string;
        position: Vector3Tuple;
        vertexIds: [string, string];
      } | null;
    },
  ) => ModelingVertex | null;
  clearVertexSelection: () => void;
  connectSelectedVerticesAsEdge: () => boolean;
  createFaceFromSelectedVertices: () => boolean;
  createRectangleFromDiagonal: (
    startPosition: Vector3Tuple,
    endPosition: Vector3Tuple,
    options: {
      mode: ModelingRectangleMode;
      endEdgeTarget?: {
        edgeId: string;
        position: Vector3Tuple;
        vertexIds: [string, string];
      } | null;
      endVertexId?: string | null;
      startEdgeTarget?: {
        edgeId: string;
        position: Vector3Tuple;
        vertexIds: [string, string];
      } | null;
      startVertexId?: string | null;
    },
  ) => boolean;
  createBoxFromDiagonal: (
    startPosition: Vector3Tuple,
    endPosition: Vector3Tuple,
    options?: {
      endEdgeTarget?: {
        edgeId: string;
        position: Vector3Tuple;
        vertexIds: [string, string];
      } | null;
      endVertexId?: string | null;
      startEdgeTarget?: {
        edgeId: string;
        position: Vector3Tuple;
        vertexIds: [string, string];
      } | null;
      startVertexId?: string | null;
    },
  ) => boolean;
  createPenStrokeFromPositions: (
    rawPoints: Vector3Tuple[],
    params: PenStrokeParams,
  ) => boolean;
  deleteSelectedVertices: () => boolean;
  findNearestVertex: (
    pointerPosition: Vector3Tuple,
    maxDistance?: number,
  ) => ModelingVertex | null;
  beginVertexMoveDrag: (
    anchorVertexId: string,
    vertexIds?: string[],
  ) => boolean;
  cancelVertexMoveDrag: () => void;
  commitVertexMoveDrag: () => boolean;
  redo: () => void;
  renameCurrentModel: (name: string) => void;
  replaceModelingProject: (
    snapshot: ModelingSnapshot,
    options?: { autoNameIndex?: number },
  ) => void;
  resetModeling: () => void;
  selectRoot: () => void;
  selectNearestVertex: (
    pointerPosition: Vector3Tuple,
    appendToSelection?: boolean,
    maxDistance?: number,
  ) => ModelingVertex | null;
  selectModelingElements: (
    selection: {
      edgeIds?: string[];
      faceIds?: string[];
      vertexIds?: string[];
    },
    appendToSelection?: boolean,
  ) => void;
  selectEdges: (edgeIds: string[], appendToSelection?: boolean) => void;
  selectFaces: (faceIds: string[], appendToSelection?: boolean) => void;
  selectVertices: (vertexIds: string[], appendToSelection?: boolean) => void;
  selectVertex: (vertexId: string, appendToSelection?: boolean) => void;
  undo: () => void;
  updateCurrentModelRootPosition: (position: Vector3Tuple) => void;
  updateCurrentModelRootRotation: (rotation: Vector3Tuple) => void;
  updateSelectedVerticesCenter: (position: Vector3Tuple) => void;
  updateLastPenStrokeFromPositions: (
    rawPoints: Vector3Tuple[],
    params: PenStrokeParams,
    historyIndex: number,
  ) => boolean;
  updateVertexPosition: (vertexId: string, position: Vector3Tuple) => void;
  updateVertexMoveDrag: (targetPosition: Vector3Tuple) => boolean;
};

const DEFAULT_MODEL_NAME_PREFIX = "Model";
const DEFAULT_SELECTION_DISTANCE = 0.45;

function createModelName(index: number) {
  return `${DEFAULT_MODEL_NAME_PREFIX} ${String(index).padStart(3, "0")}`;
}

function createNextId(prefix: "edge" | "vertex", existingIds: string[]) {
  const maxIndex = existingIds.reduce((currentMax, id) => {
    const suffix = Number(id.slice(prefix.length + 1));
    return Number.isFinite(suffix) ? Math.max(currentMax, suffix) : currentMax;
  }, 0);

  return `${prefix}-${maxIndex + 1}`;
}

function createEmptyModel(index: number): ModelingModel {
  return {
    edgeOrder: [],
    edgesById: {},
    faceOrder: [],
    facesById: {},
    id: `model-${index}`,
    name: createModelName(index),
    rootPosition: [0, 0, 0],
    rootRotation: [0, 0, 0],
    vertexOrder: [],
    verticesById: {},
  };
}

function cloneModel(model: ModelingModel): ModelingModel {
  return {
    edgeOrder: [...model.edgeOrder],
    edgesById: Object.fromEntries(
      Object.entries(model.edgesById).map(([edgeId, edge]) => [
        edgeId,
        {
          ...edge,
          vertexIds: [...edge.vertexIds] as [string, string],
        },
      ]),
    ),
    faceOrder: [...model.faceOrder],
    facesById: Object.fromEntries(
      Object.entries(model.facesById).map(([faceId, face]) => [
        faceId,
        {
          ...face,
          vertexIds: [...face.vertexIds] as [string, string, string],
        },
      ]),
    ),
    id: model.id,
    name: model.name,
    rootPosition: [...(model.rootPosition ?? [0, 0, 0])] as Vector3Tuple,
    rootRotation: [...(model.rootRotation ?? [0, 0, 0])] as Vector3Tuple,
    vertexOrder: [...model.vertexOrder],
    verticesById: Object.fromEntries(
      Object.entries(model.verticesById).map(([vertexId, vertex]) => [
        vertexId,
        {
          ...vertex,
          position: [...vertex.position] as Vector3Tuple,
        },
      ]),
    ),
  };
}

function normalizeModel(model: ModelingModel): ModelingModel {
  return {
    ...model,
    rootPosition: [...(model.rootPosition ?? [0, 0, 0])] as Vector3Tuple,
    rootRotation: [...(model.rootRotation ?? [0, 0, 0])] as Vector3Tuple,
  };
}

type SnapshotInput = Omit<
  ModelingSnapshot,
  "selectedEdgeIds" | "selectedFaceIds"
> &
  Partial<Pick<ModelingSnapshot, "selectedEdgeIds" | "selectedFaceIds">>;

function cloneSnapshot(snapshot: SnapshotInput): ModelingSnapshot {
  return {
    currentModelId: snapshot.currentModelId,
    modelsById: Object.fromEntries(
      Object.entries(snapshot.modelsById).map(([modelId, model]) => [
        modelId,
        normalizeModel(cloneModel(model)),
      ]),
    ),
    selectedEdgeIds: [...(snapshot.selectedEdgeIds ?? [])],
    selectedFaceIds: [...(snapshot.selectedFaceIds ?? [])],
    selectedRoot: snapshot.selectedRoot ?? false,
    selectedVertexIds: [...snapshot.selectedVertexIds],
  };
}

function createInitialSnapshot(): ModelingSnapshot {
  const initialModel = createEmptyModel(1);
  return {
    currentModelId: initialModel.id,
    modelsById: {
      [initialModel.id]: initialModel,
    },
    selectedEdgeIds: [],
    selectedFaceIds: [],
    selectedRoot: true,
    selectedVertexIds: [],
  };
}

function createInitialState() {
  const snapshot = createInitialSnapshot();
  return {
    activeVertexMoveDrag: null,
    ...cloneSnapshot(snapshot),
    autoNameIndex: 1,
    history: [cloneSnapshot(snapshot)],
    historyIndex: 0,
  };
}

function getVertexDistance(
  vertexPosition: Vector3Tuple,
  pointerPosition: Vector3Tuple,
) {
  const deltaX = vertexPosition[0] - pointerPosition[0];
  const deltaY = vertexPosition[1] - pointerPosition[1];
  const deltaZ = vertexPosition[2] - pointerPosition[2];
  return Math.hypot(deltaX, deltaY, deltaZ);
}

function getEdgeKey(vertexIds: [string, string]) {
  return [...vertexIds].sort().join(":");
}

function getFaceKey(vertexIds: [string, string, string]) {
  return [...vertexIds].sort().join(":");
}

function hasEdge(model: ModelingModel, vertexIds: [string, string]) {
  const edgeKey = getEdgeKey(vertexIds);

  return model.edgeOrder.some(
    (edgeId) => getEdgeKey(model.edgesById[edgeId].vertexIds) === edgeKey,
  );
}

function hasFace(model: ModelingModel, vertexIds: [string, string, string]) {
  const faceKey = getFaceKey(vertexIds);

  return model.faceOrder.some(
    (faceId) => getFaceKey(model.facesById[faceId].vertexIds) === faceKey,
  );
}

function findNearestVertexInModel(
  model: ModelingModel,
  pointerPosition: Vector3Tuple,
  maxDistance: number,
) {
  return model.vertexOrder
    .map((vertexId) => model.verticesById[vertexId])
    .reduce<{ distance: number; vertex: ModelingVertex | null }>(
      (nearest, vertex) => {
        const distance = getVertexDistance(vertex.position, pointerPosition);
        if (distance >= nearest.distance) {
          return nearest;
        }

        return {
          distance,
          vertex,
        };
      },
      {
        distance: maxDistance,
        vertex: null,
      },
    ).vertex;
}

function findVertexById(
  model: ModelingModel,
  vertexId: string | null | undefined,
) {
  if (!vertexId) {
    return null;
  }

  return model.verticesById[vertexId] ?? null;
}

function findVertexAtPosition(model: ModelingModel, position: Vector3Tuple) {
  return (
    model.vertexOrder
      .map((vertexId) => model.verticesById[vertexId])
      .find((vertex) => compareVector3Tuple(vertex.position, position)) ?? null
  );
}

function getPointToSegmentDistance(
  point: Vector3Tuple,
  start: Vector3Tuple,
  end: Vector3Tuple,
) {
  const segmentX = end[0] - start[0];
  const segmentY = end[1] - start[1];
  const segmentZ = end[2] - start[2];
  const segmentLengthSquared =
    segmentX * segmentX + segmentY * segmentY + segmentZ * segmentZ;

  if (segmentLengthSquared === 0) {
    return getVertexDistance(start, point);
  }

  const pointX = point[0] - start[0];
  const pointY = point[1] - start[1];
  const pointZ = point[2] - start[2];
  const t = Math.max(
    0,
    Math.min(
      1,
      (pointX * segmentX + pointY * segmentY + pointZ * segmentZ) /
        segmentLengthSquared,
    ),
  );
  const projectedPoint: Vector3Tuple = [
    start[0] + segmentX * t,
    start[1] + segmentY * t,
    start[2] + segmentZ * t,
  ];

  return getVertexDistance(projectedPoint, point);
}

function findEdgeForSplit(
  model: ModelingModel,
  edgeTarget: {
    edgeId: string;
    position: Vector3Tuple;
    vertexIds: [string, string];
  },
) {
  const candidateEdgeIds = [
    edgeTarget.edgeId,
    ...model.edgeOrder.filter((edgeId) => edgeId !== edgeTarget.edgeId),
  ];

  for (const edgeId of candidateEdgeIds) {
    const edge = model.edgesById[edgeId];

    if (!edge) {
      continue;
    }

    const startVertex = model.verticesById[edge.vertexIds[0]];
    const endVertex = model.verticesById[edge.vertexIds[1]];

    if (!startVertex || !endVertex) {
      continue;
    }

    const distance = getPointToSegmentDistance(
      edgeTarget.position,
      startVertex.position,
      endVertex.position,
    );

    if (distance <= 0.0005) {
      return edge;
    }
  }

  return null;
}

function splitEdgeAtPosition(
  model: ModelingModel,
  edgeTarget:
    | {
        edgeId: string;
        position: Vector3Tuple;
        vertexIds: [string, string];
      }
    | null
    | undefined,
) {
  if (!edgeTarget) {
    return null;
  }

  const existingVertex = findVertexAtPosition(model, edgeTarget.position);
  if (existingVertex) {
    return existingVertex;
  }

  const edge = findEdgeForSplit(model, edgeTarget);
  if (!edge) {
    return null;
  }

  const startVertex = model.verticesById[edge.vertexIds[0]];
  const endVertex = model.verticesById[edge.vertexIds[1]];

  if (!startVertex || !endVertex) {
    return null;
  }

  if (compareVector3Tuple(startVertex.position, edgeTarget.position)) {
    return startVertex;
  }

  if (compareVector3Tuple(endVertex.position, edgeTarget.position)) {
    return endVertex;
  }

  const nextVertexId = createNextId("vertex", model.vertexOrder);
  model.vertexOrder.push(nextVertexId);
  model.verticesById[nextVertexId] = {
    id: nextVertexId,
    position: [...edgeTarget.position],
  };

  model.edgeOrder = model.edgeOrder.filter((edgeId) => edgeId !== edge.id);
  delete model.edgesById[edge.id];

  const nextEdgeIdA = createNextId("edge", model.edgeOrder);
  model.edgeOrder.push(nextEdgeIdA);
  model.edgesById[nextEdgeIdA] = {
    id: nextEdgeIdA,
    vertexIds: [startVertex.id, nextVertexId],
  };

  const nextEdgeIdB = createNextId("edge", model.edgeOrder);
  model.edgeOrder.push(nextEdgeIdB);
  model.edgesById[nextEdgeIdB] = {
    id: nextEdgeIdB,
    vertexIds: [nextVertexId, endVertex.id],
  };

  return model.verticesById[nextVertexId];
}

function ensureVertexInModel(
  model: ModelingModel,
  selectedVertexIds: string[],
  position: Vector3Tuple,
  options?: {
    edgeTarget?: {
      edgeId: string;
      position: Vector3Tuple;
      vertexIds: [string, string];
    } | null;
    snappedVertex?: ModelingVertex | null;
  },
) {
  if (options?.snappedVertex) {
    selectedVertexIds.push(options.snappedVertex.id);
    return options.snappedVertex.id;
  }

  const existingVertex = findVertexAtPosition(model, position);
  if (existingVertex) {
    selectedVertexIds.push(existingVertex.id);
    return existingVertex.id;
  }

  const splitVertex = splitEdgeAtPosition(model, options?.edgeTarget);
  if (splitVertex) {
    selectedVertexIds.push(splitVertex.id);
    return splitVertex.id;
  }

  const nextVertexId = createNextId("vertex", model.vertexOrder);
  model.vertexOrder.push(nextVertexId);
  model.verticesById[nextVertexId] = {
    id: nextVertexId,
    position: [...position],
  };
  selectedVertexIds.push(nextVertexId);
  return nextVertexId;
}

function ensureEdgeInModel(model: ModelingModel, vertexIds: [string, string]) {
  if (vertexIds[0] === vertexIds[1] || hasEdge(model, vertexIds)) {
    return false;
  }

  const nextEdgeId = createNextId("edge", model.edgeOrder);
  model.edgeOrder.push(nextEdgeId);
  model.edgesById[nextEdgeId] = {
    id: nextEdgeId,
    vertexIds,
  };
  return true;
}

function ensureFaceInModel(
  model: ModelingModel,
  vertexIds: [string, string, string],
) {
  if (new Set(vertexIds).size !== 3 || hasFace(model, vertexIds)) {
    return false;
  }

  const nextFaceId = `face-${model.faceOrder.length + 1}`;
  model.faceOrder.push(nextFaceId);
  model.facesById[nextFaceId] = {
    id: nextFaceId,
    vertexIds,
  };
  return true;
}

function createPenStrokeSnapshot(
  snapshot: SnapshotInput,
  rawPoints: Vector3Tuple[],
  params: PenStrokeParams,
) {
  const currentModel = snapshot.modelsById[snapshot.currentModelId];

  if (!currentModel) {
    return null;
  }

  const processedPoints = processPenStrokePoints(rawPoints, params);
  if (processedPoints.length < 2) {
    return null;
  }

  const nextModel = cloneModel(currentModel);
  const selectedVertexIds: string[] = [];
  const strokeVertexIds = processedPoints.map((point) => {
    const snappedVertex = params.mergeVertices
      ? findNearestVertexInModel(nextModel, point, params.mergeDistance)
      : null;

    return ensureVertexInModel(nextModel, selectedVertexIds, point, {
      snappedVertex,
    });
  });
  let changed = false;

  for (let index = 0; index < strokeVertexIds.length - 1; index += 1) {
    changed =
      ensureEdgeInModel(nextModel, [
        strokeVertexIds[index],
        strokeVertexIds[index + 1],
      ]) || changed;
  }

  if (!changed) {
    return null;
  }

  return {
    currentModelId: snapshot.currentModelId,
    modelsById: {
      ...snapshot.modelsById,
      [currentModel.id]: nextModel,
    },
    selectedEdgeIds: [],
    selectedFaceIds: [],
    selectedRoot: false,
    selectedVertexIds: selectedVertexIds.filter(
      (vertexId, index, list) => list.indexOf(vertexId) === index,
    ),
  } satisfies ModelingSnapshot;
}

function commitSnapshot(
  state: ModelingState,
  nextSnapshot: SnapshotInput,
): Pick<
  ModelingState,
  | "currentModelId"
  | "history"
  | "historyIndex"
  | "modelsById"
  | "selectedEdgeIds"
  | "selectedFaceIds"
  | "selectedRoot"
  | "selectedVertexIds"
> {
  const clonedSnapshot = cloneSnapshot(nextSnapshot);
  const truncatedHistory = state.history
    .slice(0, state.historyIndex + 1)
    .map((snapshot) => cloneSnapshot(snapshot));
  const nextHistory = [...truncatedHistory, clonedSnapshot];

  return {
    ...clonedSnapshot,
    history: nextHistory,
    historyIndex: nextHistory.length - 1,
  };
}

type PersistedModelingState = Pick<
  ModelingState,
  | "autoNameIndex"
  | "currentModelId"
  | "modelsById"
  | "selectedEdgeIds"
  | "selectedFaceIds"
  | "selectedRoot"
  | "selectedVertexIds"
>;

function getValidSelectionIds(
  currentModel: ModelingModel,
  selection: {
    edgeIds?: string[];
    faceIds?: string[];
    vertexIds?: string[];
  },
) {
  const selectedEdgeInput = new Set(selection.edgeIds ?? []);
  const selectedFaceInput = new Set(selection.faceIds ?? []);
  const selectedVertexInput = new Set(selection.vertexIds ?? []);

  return {
    edgeIds: currentModel.edgeOrder.filter(
      (edgeId) =>
        selectedEdgeInput.has(edgeId) && currentModel.edgesById[edgeId],
    ),
    faceIds: currentModel.faceOrder.filter(
      (faceId) =>
        selectedFaceInput.has(faceId) && currentModel.facesById[faceId],
    ),
    vertexIds: currentModel.vertexOrder.filter(
      (vertexId) =>
        selectedVertexInput.has(vertexId) &&
        currentModel.verticesById[vertexId],
    ),
  };
}

function areStringArraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function appendUniqueIds(currentIds: string[], nextIds: string[]) {
  const mergedIds = [...currentIds];
  for (const id of nextIds) {
    if (!mergedIds.includes(id)) {
      mergedIds.push(id);
    }
  }
  return mergedIds;
}

export const useModelingStore = create<ModelingState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      beginVertexMoveDrag: (anchorVertexId, vertexIds) => {
        const state = get();
        const currentModel = state.modelsById[state.currentModelId];

        if (!currentModel?.verticesById[anchorVertexId]) {
          return false;
        }

        const normalizedVertexIds = (
          vertexIds?.length ? vertexIds : state.selectedVertexIds
        ).filter((vertexId, index, list) => {
          return (
            currentModel.verticesById[vertexId] !== undefined &&
            list.indexOf(vertexId) === index
          );
        });

        if (
          normalizedVertexIds.length === 0 ||
          !normalizedVertexIds.includes(anchorVertexId)
        ) {
          return false;
        }

        set({
          activeVertexMoveDrag: {
            anchorVertexId,
            snapshot: cloneSnapshot({
              currentModelId: state.currentModelId,
              modelsById: state.modelsById,
              selectedEdgeIds: state.selectedEdgeIds,
              selectedFaceIds: state.selectedFaceIds,
              selectedRoot: state.selectedRoot,
              selectedVertexIds: state.selectedVertexIds,
            }),
            vertexIds: normalizedVertexIds,
          },
          selectedEdgeIds: [],
          selectedFaceIds: [],
          selectedVertexIds: [...normalizedVertexIds],
          selectedRoot: false,
        });

        return true;
      },
      cancelVertexMoveDrag: () =>
        set((state) => {
          if (!state.activeVertexMoveDrag) {
            return state;
          }

          return {
            activeVertexMoveDrag: null,
            ...cloneSnapshot(state.activeVertexMoveDrag.snapshot),
          };
        }),
      createEdgeFromPositions: (
        startPosition,
        endPosition,
        options = DEFAULT_SELECTION_DISTANCE,
      ) => {
        const state = get();
        const currentModel = state.modelsById[state.currentModelId];

        if (!currentModel) {
          return false;
        }

        const normalizedOptions =
          typeof options === "number" ? { snapDistance: options } : options;
        const snapDistance =
          normalizedOptions.snapDistance ?? DEFAULT_SELECTION_DISTANCE;

        const snappedStartVertex =
          findVertexById(currentModel, normalizedOptions.startVertexId) ??
          findNearestVertexInModel(currentModel, startPosition, snapDistance);
        const snappedEndVertex =
          findVertexById(currentModel, normalizedOptions.endVertexId) ??
          findNearestVertexInModel(currentModel, endPosition, snapDistance);

        if (
          snappedStartVertex &&
          snappedEndVertex &&
          snappedStartVertex.id === snappedEndVertex.id
        ) {
          set({
            selectedRoot: false,
            selectedVertexIds: [snappedStartVertex.id],
          });
          return false;
        }

        const nextModel = cloneModel(currentModel);
        const selectedVertexIds: string[] = [];

        const startVertexId = ensureVertexInModel(
          nextModel,
          selectedVertexIds,
          startPosition,
          {
            edgeTarget: normalizedOptions.startEdgeTarget,
            snappedVertex: snappedStartVertex,
          },
        );
        const endVertexId = ensureVertexInModel(
          nextModel,
          selectedVertexIds,
          endPosition,
          {
            edgeTarget: normalizedOptions.endEdgeTarget,
            snappedVertex: snappedEndVertex,
          },
        );
        const edgeVertexIds = [startVertexId, endVertexId] as [string, string];

        if (!ensureEdgeInModel(nextModel, edgeVertexIds)) {
          return false;
        }

        set({
          ...commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: false,
            selectedVertexIds,
          }),
        });

        return true;
      },
      createRectangleFromDiagonal: (startPosition, endPosition, options) => {
        const state = get();
        const currentModel = state.modelsById[state.currentModelId];

        if (!currentModel) {
          return false;
        }

        const rectangleGeometry = getRectangleVerticesFromDiagonal(
          startPosition,
          endPosition,
          options.mode,
        );

        if (!rectangleGeometry) {
          return false;
        }

        const nextModel = cloneModel(currentModel);
        const selectedVertexIds: string[] = [];
        const snappedStartVertex = findVertexById(
          currentModel,
          options.startVertexId,
        );
        const snappedEndVertex = findVertexById(
          currentModel,
          options.endVertexId,
        );
        const endPositionMatchesSnap =
          snappedEndVertex &&
          compareVector3Tuple(
            snappedEndVertex.position,
            rectangleGeometry.corners[2],
          );
        const startVertexId = ensureVertexInModel(
          nextModel,
          selectedVertexIds,
          rectangleGeometry.corners[0],
          {
            edgeTarget: options.startEdgeTarget,
            snappedVertex: snappedStartVertex,
          },
        );
        const corner1VertexId = ensureVertexInModel(
          nextModel,
          selectedVertexIds,
          rectangleGeometry.corners[1],
        );
        const endVertexId = ensureVertexInModel(
          nextModel,
          selectedVertexIds,
          rectangleGeometry.corners[2],
          {
            edgeTarget: endPositionMatchesSnap ? options.endEdgeTarget : null,
            snappedVertex: endPositionMatchesSnap ? snappedEndVertex : null,
          },
        );
        const corner3VertexId = ensureVertexInModel(
          nextModel,
          selectedVertexIds,
          rectangleGeometry.corners[3],
        );

        if (
          new Set([
            startVertexId,
            corner1VertexId,
            endVertexId,
            corner3VertexId,
          ]).size !== 4
        ) {
          return false;
        }

        let changed = false;
        const edgeVertexIdsList: [string, string][] = [
          [startVertexId, corner1VertexId],
          [corner1VertexId, endVertexId],
          [endVertexId, corner3VertexId],
          [corner3VertexId, startVertexId],
          [startVertexId, endVertexId],
        ];

        for (const edgeVertexIds of edgeVertexIdsList) {
          changed = ensureEdgeInModel(nextModel, edgeVertexIds) || changed;
        }

        changed =
          ensureFaceInModel(nextModel, [
            startVertexId,
            corner1VertexId,
            endVertexId,
          ]) || changed;
        changed =
          ensureFaceInModel(nextModel, [
            startVertexId,
            endVertexId,
            corner3VertexId,
          ]) || changed;

        if (!changed) {
          return false;
        }

        set({
          ...commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: false,
            selectedVertexIds: [
              startVertexId,
              corner1VertexId,
              endVertexId,
              corner3VertexId,
            ],
          }),
        });

        return true;
      },
      addVertex: (position, options) => {
        const state = get();
        const currentModel = state.modelsById[state.currentModelId];

        if (!currentModel) {
          return null;
        }

        const nextModel = cloneModel(currentModel);
        const splitVertex = splitEdgeAtPosition(nextModel, options?.edgeTarget);
        if (splitVertex) {
          set({
            ...commitSnapshot(state, {
              currentModelId: state.currentModelId,
              modelsById: {
                ...state.modelsById,
                [currentModel.id]: nextModel,
              },
              selectedRoot: false,
              selectedVertexIds: [splitVertex.id],
            }),
          });

          return splitVertex;
        }

        const nextVertexId = createNextId("vertex", nextModel.vertexOrder);
        const nextVertex: ModelingVertex = {
          id: nextVertexId,
          position: [...position],
        };
        nextModel.vertexOrder.push(nextVertexId);
        nextModel.verticesById[nextVertexId] = nextVertex;

        set({
          ...commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: false,
            selectedVertexIds: [nextVertexId],
          }),
        });

        return nextVertex;
      },
      clearVertexSelection: () =>
        set((state) =>
          state.selectedEdgeIds.length === 0 &&
          state.selectedFaceIds.length === 0 &&
          state.selectedVertexIds.length === 0 &&
          !state.selectedRoot
            ? state
            : {
                selectedEdgeIds: [],
                selectedFaceIds: [],
                selectedRoot: false,
                selectedVertexIds: [],
              },
        ),
      connectSelectedVerticesAsEdge: () => {
        const state = get();
        if (state.selectedVertexIds.length !== 2) {
          return false;
        }

        const currentModel = state.modelsById[state.currentModelId];
        if (!currentModel) {
          return false;
        }

        const edgeVertexIds = [
          state.selectedVertexIds[0],
          state.selectedVertexIds[1],
        ] as [string, string];

        if (
          edgeVertexIds[0] === edgeVertexIds[1] ||
          hasEdge(currentModel, edgeVertexIds)
        ) {
          return false;
        }

        const nextModel = cloneModel(currentModel);
        const nextEdgeId = createNextId("edge", nextModel.edgeOrder);
        nextModel.edgeOrder.push(nextEdgeId);
        nextModel.edgesById[nextEdgeId] = {
          id: nextEdgeId,
          vertexIds: edgeVertexIds,
        };

        set({
          ...commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: false,
            selectedVertexIds: [...state.selectedVertexIds],
          }),
        });

        return true;
      },
      createFaceFromSelectedVertices: () => {
        const state = get();
        if (state.selectedVertexIds.length !== 3) {
          return false;
        }

        const currentModel = state.modelsById[state.currentModelId];
        if (!currentModel) {
          return false;
        }

        const faceVertexIds = [
          state.selectedVertexIds[0],
          state.selectedVertexIds[1],
          state.selectedVertexIds[2],
        ] as [string, string, string];
        const uniqueVertexCount = new Set(faceVertexIds).size;

        if (uniqueVertexCount !== 3 || hasFace(currentModel, faceVertexIds)) {
          return false;
        }

        const nextModel = cloneModel(currentModel);
        const requiredEdges = [
          [faceVertexIds[0], faceVertexIds[1]],
          [faceVertexIds[1], faceVertexIds[2]],
          [faceVertexIds[2], faceVertexIds[0]],
        ] as [string, string][];

        for (const edgeVertexIds of requiredEdges) {
          if (hasEdge(nextModel, edgeVertexIds)) {
            continue;
          }

          const nextEdgeId = createNextId("edge", nextModel.edgeOrder);
          nextModel.edgeOrder.push(nextEdgeId);
          nextModel.edgesById[nextEdgeId] = {
            id: nextEdgeId,
            vertexIds: edgeVertexIds,
          };
        }

        const nextFaceId = `face-${nextModel.faceOrder.length + 1}`;
        nextModel.faceOrder.push(nextFaceId);
        nextModel.facesById[nextFaceId] = {
          id: nextFaceId,
          vertexIds: faceVertexIds,
        };

        set({
          ...commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: false,
            selectedVertexIds: [...state.selectedVertexIds],
          }),
        });

        return true;
      },
      createBoxFromDiagonal: (startPosition, endPosition, options = {}) => {
        const state = get();
        const currentModel = state.modelsById[state.currentModelId];

        if (!currentModel) {
          return false;
        }

        const boxGeometry = getBoxVerticesFromDiagonal(
          startPosition,
          endPosition,
        );

        if (!boxGeometry) {
          return false;
        }

        const nextModel = cloneModel(currentModel);
        const selectedVertexIds: string[] = [];
        const snappedStartVertex = findVertexById(
          currentModel,
          options.startVertexId,
        );
        const snappedEndVertex = findVertexById(
          currentModel,
          options.endVertexId,
        );
        const startCorner = boxGeometry.corners.find((corner) =>
          compareVector3Tuple(corner, startPosition),
        );
        const endCorner = boxGeometry.corners.find((corner) =>
          compareVector3Tuple(corner, endPosition),
        );
        const cornerVertexIds = boxGeometry.corners.map((corner) =>
          ensureVertexInModel(
            nextModel,
            selectedVertexIds,
            corner,
            (() => {
              const isStartCorner =
                startCorner !== undefined &&
                compareVector3Tuple(corner, startCorner);
              const isEndCorner =
                endCorner !== undefined &&
                compareVector3Tuple(corner, endCorner);

              return {
                edgeTarget: isStartCorner
                  ? options.startEdgeTarget
                  : isEndCorner
                    ? options.endEdgeTarget
                    : null,
                snappedVertex: isStartCorner
                  ? snappedStartVertex
                  : isEndCorner
                    ? snappedEndVertex
                    : null,
              };
            })(),
          ),
        );

        if (new Set(cornerVertexIds).size !== boxGeometry.corners.length) {
          return false;
        }

        let changed = false;
        const cornerIndexToVertexId = cornerVertexIds;
        const edgeVertexIdsList: [string, string][] = [
          [cornerIndexToVertexId[0], cornerIndexToVertexId[1]],
          [cornerIndexToVertexId[1], cornerIndexToVertexId[2]],
          [cornerIndexToVertexId[2], cornerIndexToVertexId[3]],
          [cornerIndexToVertexId[3], cornerIndexToVertexId[0]],
          [cornerIndexToVertexId[4], cornerIndexToVertexId[5]],
          [cornerIndexToVertexId[5], cornerIndexToVertexId[6]],
          [cornerIndexToVertexId[6], cornerIndexToVertexId[7]],
          [cornerIndexToVertexId[7], cornerIndexToVertexId[4]],
          [cornerIndexToVertexId[0], cornerIndexToVertexId[4]],
          [cornerIndexToVertexId[1], cornerIndexToVertexId[5]],
          [cornerIndexToVertexId[2], cornerIndexToVertexId[6]],
          [cornerIndexToVertexId[3], cornerIndexToVertexId[7]],
        ];

        for (const edgeVertexIds of edgeVertexIdsList) {
          changed = ensureEdgeInModel(nextModel, edgeVertexIds) || changed;
        }

        const faceVertexIdsList: [string, string, string][] = [
          [
            cornerIndexToVertexId[0],
            cornerIndexToVertexId[1],
            cornerIndexToVertexId[2],
          ],
          [
            cornerIndexToVertexId[0],
            cornerIndexToVertexId[2],
            cornerIndexToVertexId[3],
          ],
          [
            cornerIndexToVertexId[4],
            cornerIndexToVertexId[6],
            cornerIndexToVertexId[5],
          ],
          [
            cornerIndexToVertexId[4],
            cornerIndexToVertexId[7],
            cornerIndexToVertexId[6],
          ],
          [
            cornerIndexToVertexId[0],
            cornerIndexToVertexId[5],
            cornerIndexToVertexId[1],
          ],
          [
            cornerIndexToVertexId[0],
            cornerIndexToVertexId[4],
            cornerIndexToVertexId[5],
          ],
          [
            cornerIndexToVertexId[3],
            cornerIndexToVertexId[2],
            cornerIndexToVertexId[6],
          ],
          [
            cornerIndexToVertexId[3],
            cornerIndexToVertexId[6],
            cornerIndexToVertexId[7],
          ],
          [
            cornerIndexToVertexId[0],
            cornerIndexToVertexId[3],
            cornerIndexToVertexId[7],
          ],
          [
            cornerIndexToVertexId[0],
            cornerIndexToVertexId[7],
            cornerIndexToVertexId[4],
          ],
          [
            cornerIndexToVertexId[1],
            cornerIndexToVertexId[5],
            cornerIndexToVertexId[6],
          ],
          [
            cornerIndexToVertexId[1],
            cornerIndexToVertexId[6],
            cornerIndexToVertexId[2],
          ],
        ];

        for (const faceVertexIds of faceVertexIdsList) {
          changed = ensureFaceInModel(nextModel, faceVertexIds) || changed;
        }

        if (!changed) {
          return false;
        }

        set({
          ...commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: false,
            selectedVertexIds,
          }),
        });

        return true;
      },
      createPenStrokeFromPositions: (rawPoints, params) => {
        const state = get();
        const nextSnapshot = createPenStrokeSnapshot(
          {
            currentModelId: state.currentModelId,
            modelsById: state.modelsById,
            selectedRoot: state.selectedRoot,
            selectedVertexIds: state.selectedVertexIds,
          },
          rawPoints,
          params,
        );

        if (!nextSnapshot) {
          return false;
        }

        set({
          ...commitSnapshot(state, nextSnapshot),
        });

        return true;
      },
      deleteSelectedVertices: () => {
        const state = get();
        if (
          state.selectedEdgeIds.length === 0 &&
          state.selectedFaceIds.length === 0 &&
          state.selectedVertexIds.length === 0
        ) {
          return false;
        }

        const currentModel = state.modelsById[state.currentModelId];
        if (!currentModel) {
          return false;
        }

        const selectedVertexSet = new Set(state.selectedVertexIds);
        const selectedEdgeSet = new Set(state.selectedEdgeIds);
        const selectedFaceSet = new Set(state.selectedFaceIds);
        const hasSelectedVertex = state.selectedVertexIds.some(
          (vertexId) => currentModel.verticesById[vertexId],
        );
        const hasSelectedEdge = state.selectedEdgeIds.some(
          (edgeId) => currentModel.edgesById[edgeId],
        );
        const hasSelectedFace = state.selectedFaceIds.some(
          (faceId) => currentModel.facesById[faceId],
        );

        if (!hasSelectedVertex && !hasSelectedEdge && !hasSelectedFace) {
          return false;
        }

        const nextModel = cloneModel(currentModel);

        nextModel.vertexOrder = nextModel.vertexOrder.filter(
          (vertexId) => !selectedVertexSet.has(vertexId),
        );
        nextModel.verticesById = Object.fromEntries(
          Object.entries(nextModel.verticesById).filter(
            ([vertexId]) => !selectedVertexSet.has(vertexId),
          ),
        );
        nextModel.edgeOrder = nextModel.edgeOrder.filter((edgeId) => {
          const edge = nextModel.edgesById[edgeId];
          return (
            !selectedEdgeSet.has(edgeId) &&
            !edge.vertexIds.some((vertexId) => selectedVertexSet.has(vertexId))
          );
        });
        nextModel.edgesById = Object.fromEntries(
          Object.entries(nextModel.edgesById).filter(
            ([edgeId, edge]) =>
              !selectedEdgeSet.has(edgeId) &&
              !edge.vertexIds.some((vertexId) =>
                selectedVertexSet.has(vertexId),
              ),
          ),
        );
        nextModel.faceOrder = nextModel.faceOrder.filter((faceId) => {
          const face = nextModel.facesById[faceId];
          return (
            !selectedFaceSet.has(faceId) &&
            !face.vertexIds.some((vertexId) => selectedVertexSet.has(vertexId))
          );
        });
        nextModel.facesById = Object.fromEntries(
          Object.entries(nextModel.facesById).filter(
            ([faceId, face]) =>
              !selectedFaceSet.has(faceId) &&
              !face.vertexIds.some((vertexId) =>
                selectedVertexSet.has(vertexId),
              ),
          ),
        );

        set({
          ...commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedEdgeIds: [],
            selectedFaceIds: [],
            selectedRoot: false,
            selectedVertexIds: [],
          }),
        });

        return true;
      },
      findNearestVertex: (
        pointerPosition,
        maxDistance = DEFAULT_SELECTION_DISTANCE,
      ) => {
        const state = get();
        const currentModel = state.modelsById[state.currentModelId];

        if (!currentModel) {
          return null;
        }

        return findNearestVertexInModel(
          currentModel,
          pointerPosition,
          maxDistance,
        );
      },
      commitVertexMoveDrag: () => {
        const state = get();
        if (!state.activeVertexMoveDrag) {
          return false;
        }

        const currentModel = state.modelsById[state.currentModelId];
        const baselineModel =
          state.activeVertexMoveDrag.snapshot.modelsById[state.currentModelId];

        if (!currentModel || !baselineModel) {
          set({ activeVertexMoveDrag: null });
          return false;
        }

        const changed = state.activeVertexMoveDrag.vertexIds.some(
          (vertexId) => {
            const currentVertex = currentModel.verticesById[vertexId];
            const baselineVertex = baselineModel.verticesById[vertexId];

            return (
              currentVertex &&
              baselineVertex &&
              !compareVector3Tuple(
                currentVertex.position,
                baselineVertex.position,
              )
            );
          },
        );

        if (!changed) {
          set({ activeVertexMoveDrag: null });
          return false;
        }

        set({
          activeVertexMoveDrag: null,
          ...commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: state.modelsById,
            selectedEdgeIds: [],
            selectedFaceIds: [],
            selectedRoot: false,
            selectedVertexIds: state.selectedVertexIds,
          }),
        });

        return true;
      },
      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) {
            return state;
          }

          const nextSnapshot = cloneSnapshot(
            state.history[state.historyIndex + 1],
          );
          return {
            activeVertexMoveDrag: null,
            ...nextSnapshot,
            history: state.history,
            historyIndex: state.historyIndex + 1,
          };
        }),
      renameCurrentModel: (name) =>
        set((state) => {
          const currentModel = state.modelsById[state.currentModelId];
          const trimmedName = name.trim();

          if (!currentModel || trimmedName.length === 0) {
            return state;
          }

          const nextModel = cloneModel(currentModel);
          if (nextModel.name === trimmedName) {
            return state;
          }

          nextModel.name = trimmedName;
          return {
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
          };
        }),
      replaceModelingProject: (snapshot, options) =>
        set((state) => {
          const clonedSnapshot = cloneSnapshot(snapshot);

          return {
            ...clonedSnapshot,
            activeVertexMoveDrag: null,
            autoNameIndex: options?.autoNameIndex ?? state.autoNameIndex,
            history: [cloneSnapshot(clonedSnapshot)],
            historyIndex: 0,
          };
        }),
      resetModeling: () => set(createInitialState()),
      selectRoot: () =>
        set((state) =>
          state.selectedRoot &&
          state.selectedEdgeIds.length === 0 &&
          state.selectedFaceIds.length === 0 &&
          state.selectedVertexIds.length === 0
            ? state
            : {
                selectedEdgeIds: [],
                selectedFaceIds: [],
                selectedRoot: true,
                selectedVertexIds: [],
              },
        ),
      selectNearestVertex: (
        pointerPosition,
        appendToSelection = false,
        maxDistance = DEFAULT_SELECTION_DISTANCE,
      ) => {
        const state = get();
        const currentModel = state.modelsById[state.currentModelId];

        if (!currentModel) {
          return null;
        }

        const nearestVertex = findNearestVertexInModel(
          currentModel,
          pointerPosition,
          maxDistance,
        );

        if (!nearestVertex) {
          if (
            !appendToSelection &&
            (state.selectedEdgeIds.length > 0 ||
              state.selectedFaceIds.length > 0 ||
              state.selectedVertexIds.length > 0 ||
              state.selectedRoot)
          ) {
            set({
              selectedEdgeIds: [],
              selectedFaceIds: [],
              selectedRoot: false,
              selectedVertexIds: [],
            });
          }
          return null;
        }

        state.selectVertex(nearestVertex.id, appendToSelection);
        return nearestVertex;
      },
      selectVertex: (vertexId, appendToSelection = false) =>
        set((state) => {
          const currentModel = state.modelsById[state.currentModelId];
          if (!currentModel?.verticesById[vertexId]) {
            return state;
          }

          if (appendToSelection) {
            if (state.selectedVertexIds.includes(vertexId)) {
              return state;
            }

            return {
              selectedRoot: false,
              selectedVertexIds: [...state.selectedVertexIds, vertexId],
            };
          }

          if (
            state.selectedEdgeIds.length === 0 &&
            state.selectedFaceIds.length === 0 &&
            state.selectedVertexIds.length === 1 &&
            state.selectedVertexIds[0] === vertexId
          ) {
            return state;
          }

          return {
            selectedEdgeIds: [],
            selectedFaceIds: [],
            selectedRoot: false,
            selectedVertexIds: [vertexId],
          };
        }),
      selectEdges: (edgeIds, appendToSelection = false) =>
        get().selectModelingElements({ edgeIds }, appendToSelection),
      selectFaces: (faceIds, appendToSelection = false) =>
        get().selectModelingElements({ faceIds }, appendToSelection),
      selectModelingElements: (selection, appendToSelection = false) =>
        set((state) => {
          const currentModel = state.modelsById[state.currentModelId];
          if (!currentModel) {
            return state;
          }

          const validSelection = getValidSelectionIds(currentModel, selection);

          if (appendToSelection) {
            const nextSelectedEdgeIds = appendUniqueIds(
              state.selectedEdgeIds,
              validSelection.edgeIds,
            );
            const nextSelectedFaceIds = appendUniqueIds(
              state.selectedFaceIds,
              validSelection.faceIds,
            );
            const nextSelectedVertexIds = appendUniqueIds(
              state.selectedVertexIds,
              validSelection.vertexIds,
            );

            if (
              areStringArraysEqual(
                nextSelectedEdgeIds,
                state.selectedEdgeIds,
              ) &&
              areStringArraysEqual(
                nextSelectedFaceIds,
                state.selectedFaceIds,
              ) &&
              areStringArraysEqual(
                nextSelectedVertexIds,
                state.selectedVertexIds,
              ) &&
              !state.selectedRoot
            ) {
              return state;
            }

            return {
              selectedEdgeIds: nextSelectedEdgeIds,
              selectedFaceIds: nextSelectedFaceIds,
              selectedRoot: false,
              selectedVertexIds: nextSelectedVertexIds,
            };
          }

          if (
            areStringArraysEqual(
              validSelection.edgeIds,
              state.selectedEdgeIds,
            ) &&
            areStringArraysEqual(
              validSelection.faceIds,
              state.selectedFaceIds,
            ) &&
            areStringArraysEqual(
              validSelection.vertexIds,
              state.selectedVertexIds,
            ) &&
            !state.selectedRoot
          ) {
            return state;
          }

          return {
            selectedEdgeIds: validSelection.edgeIds,
            selectedFaceIds: validSelection.faceIds,
            selectedRoot: false,
            selectedVertexIds: validSelection.vertexIds,
          };
        }),
      selectVertices: (vertexIds, appendToSelection = false) =>
        set((state) => {
          const currentModel = state.modelsById[state.currentModelId];
          if (!currentModel) {
            return state;
          }

          const validVertexIds = currentModel.vertexOrder.filter(
            (vertexId) =>
              vertexIds.includes(vertexId) &&
              currentModel.verticesById[vertexId],
          );

          if (validVertexIds.length === 0) {
            return appendToSelection
              ? state
              : {
                  selectedEdgeIds: [],
                  selectedFaceIds: [],
                  selectedRoot: false,
                  selectedVertexIds: [],
                };
          }

          if (appendToSelection) {
            const nextSelectedVertexIds = [...state.selectedVertexIds];

            for (const vertexId of validVertexIds) {
              if (!nextSelectedVertexIds.includes(vertexId)) {
                nextSelectedVertexIds.push(vertexId);
              }
            }

            if (
              nextSelectedVertexIds.length === state.selectedVertexIds.length &&
              nextSelectedVertexIds.every(
                (vertexId, index) =>
                  vertexId === state.selectedVertexIds[index],
              )
            ) {
              return state;
            }

            return {
              selectedRoot: false,
              selectedVertexIds: nextSelectedVertexIds,
            };
          }

          if (
            state.selectedEdgeIds.length === 0 &&
            state.selectedFaceIds.length === 0 &&
            validVertexIds.length === state.selectedVertexIds.length &&
            validVertexIds.every(
              (vertexId, index) => vertexId === state.selectedVertexIds[index],
            )
          ) {
            return state;
          }

          return {
            selectedEdgeIds: [],
            selectedFaceIds: [],
            selectedRoot: false,
            selectedVertexIds: validVertexIds,
          };
        }),
      undo: () =>
        set((state) => {
          if (state.historyIndex <= 0) {
            return state;
          }

          const nextSnapshot = cloneSnapshot(
            state.history[state.historyIndex - 1],
          );
          return {
            activeVertexMoveDrag: null,
            ...nextSnapshot,
            history: state.history,
            historyIndex: state.historyIndex - 1,
          };
        }),
      updateCurrentModelRootPosition: (position) =>
        set((state) => {
          const currentModel = state.modelsById[state.currentModelId];
          if (
            !currentModel ||
            compareVector3Tuple(currentModel.rootPosition, position)
          ) {
            return state;
          }

          const nextModel = cloneModel(currentModel);
          nextModel.rootPosition = [...position];

          return commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: true,
            selectedVertexIds: [],
          });
        }),
      updateCurrentModelRootRotation: (rotation) =>
        set((state) => {
          const currentModel = state.modelsById[state.currentModelId];
          if (
            !currentModel ||
            compareVector3Tuple(currentModel.rootRotation, rotation)
          ) {
            return state;
          }

          const nextModel = cloneModel(currentModel);
          nextModel.rootRotation = [...rotation];

          return commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: true,
            selectedVertexIds: [],
          });
        }),
      updateSelectedVerticesCenter: (position) =>
        set((state) => {
          const currentModel = state.modelsById[state.currentModelId];
          if (!currentModel) {
            return state;
          }

          const selectedVertices = state.selectedVertexIds
            .map((vertexId) => currentModel.verticesById[vertexId])
            .filter((vertex) => vertex !== undefined);

          if (selectedVertices.length === 0) {
            return state;
          }

          const currentCenter = selectedVertices.reduce<Vector3Tuple>(
            (center, vertex) => [
              center[0] + vertex.position[0] / selectedVertices.length,
              center[1] + vertex.position[1] / selectedVertices.length,
              center[2] + vertex.position[2] / selectedVertices.length,
            ],
            [0, 0, 0],
          );

          if (compareVector3Tuple(currentCenter, position)) {
            return state;
          }

          const delta: Vector3Tuple = [
            position[0] - currentCenter[0],
            position[1] - currentCenter[1],
            position[2] - currentCenter[2],
          ];
          const nextModel = cloneModel(currentModel);

          for (const vertex of selectedVertices) {
            nextModel.verticesById[vertex.id].position = [
              vertex.position[0] + delta[0],
              vertex.position[1] + delta[1],
              vertex.position[2] + delta[2],
            ];
          }

          return commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: false,
            selectedVertexIds: [...state.selectedVertexIds],
          });
        }),
      updateVertexPosition: (vertexId, position) =>
        set((state) => {
          const currentModel = state.modelsById[state.currentModelId];
          const currentVertex = currentModel?.verticesById[vertexId];

          if (!currentModel || !currentVertex) {
            return state;
          }

          if (compareVector3Tuple(currentVertex.position, position)) {
            return state;
          }

          const nextModel = cloneModel(currentModel);
          nextModel.verticesById[vertexId].position = [...position];

          return commitSnapshot(state, {
            currentModelId: state.currentModelId,
            modelsById: {
              ...state.modelsById,
              [currentModel.id]: nextModel,
            },
            selectedRoot: false,
            selectedVertexIds: [vertexId],
          });
        }),
      updateLastPenStrokeFromPositions: (rawPoints, params, historyIndex) => {
        const state = get();
        if (
          historyIndex <= 0 ||
          state.historyIndex !== historyIndex ||
          state.history.length <= historyIndex
        ) {
          return false;
        }

        const nextSnapshot = createPenStrokeSnapshot(
          state.history[historyIndex - 1],
          rawPoints,
          params,
        );

        if (!nextSnapshot) {
          return false;
        }

        const clonedSnapshot = cloneSnapshot(nextSnapshot);
        const nextHistory = state.history.map((snapshot, index) =>
          index === historyIndex ? clonedSnapshot : cloneSnapshot(snapshot),
        );

        set({
          ...clonedSnapshot,
          activeVertexMoveDrag: null,
          history: nextHistory,
          historyIndex,
        });

        return true;
      },
      updateVertexMoveDrag: (targetPosition) => {
        const state = get();
        const drag = state.activeVertexMoveDrag;

        if (!drag) {
          return false;
        }

        const baselineModel =
          drag.snapshot.modelsById[drag.snapshot.currentModelId];
        const currentModel = state.modelsById[state.currentModelId];
        const anchorVertex = baselineModel?.verticesById[drag.anchorVertexId];

        if (!baselineModel || !currentModel || !anchorVertex) {
          return false;
        }

        const delta: Vector3Tuple = [
          targetPosition[0] - anchorVertex.position[0],
          targetPosition[1] - anchorVertex.position[1],
          targetPosition[2] - anchorVertex.position[2],
        ];
        const nextModel = cloneModel(baselineModel);

        for (const vertexId of drag.vertexIds) {
          const baselineVertex = baselineModel.verticesById[vertexId];
          const nextVertex = nextModel.verticesById[vertexId];

          if (!baselineVertex || !nextVertex) {
            continue;
          }

          nextVertex.position = [
            baselineVertex.position[0] + delta[0],
            baselineVertex.position[1] + delta[1],
            baselineVertex.position[2] + delta[2],
          ];
        }

        set({
          modelsById: {
            ...state.modelsById,
            [baselineModel.id]: nextModel,
          },
          selectedRoot: false,
        });

        return true;
      },
    }),
    {
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PersistedModelingState>;
        const snapshot = cloneSnapshot({
          currentModelId:
            persisted.currentModelId ?? currentState.currentModelId,
          modelsById: persisted.modelsById ?? currentState.modelsById,
          selectedEdgeIds:
            persisted.selectedEdgeIds ?? currentState.selectedEdgeIds,
          selectedFaceIds:
            persisted.selectedFaceIds ?? currentState.selectedFaceIds,
          selectedRoot: persisted.selectedRoot ?? currentState.selectedRoot,
          selectedVertexIds:
            persisted.selectedVertexIds ?? currentState.selectedVertexIds,
        });

        return {
          ...currentState,
          ...snapshot,
          activeVertexMoveDrag: null,
          autoNameIndex: persisted.autoNameIndex ?? currentState.autoNameIndex,
          history: [cloneSnapshot(snapshot)],
          historyIndex: 0,
        };
      },
      name: "naname-ui-modeling-store",
      partialize: (state): PersistedModelingState => ({
        autoNameIndex: state.autoNameIndex,
        currentModelId: state.currentModelId,
        modelsById: state.modelsById,
        selectedEdgeIds: state.selectedEdgeIds,
        selectedFaceIds: state.selectedFaceIds,
        selectedRoot: state.selectedRoot,
        selectedVertexIds: state.selectedVertexIds,
      }),
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
