import { create } from "zustand";
import { getRectangleVerticesFromDiagonal } from "../components/scene/modelingPointerUtils";
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
  vertexOrder: string[];
  verticesById: Record<string, ModelingVertex>;
};

type ModelingSnapshot = {
  currentModelId: string;
  modelsById: Record<string, ModelingModel>;
  selectedVertexIds: string[];
};

type ModelingState = ModelingSnapshot & {
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
  deleteSelectedVertices: () => boolean;
  findNearestVertex: (
    pointerPosition: Vector3Tuple,
    maxDistance?: number,
  ) => ModelingVertex | null;
  redo: () => void;
  resetModeling: () => void;
  selectNearestVertex: (
    pointerPosition: Vector3Tuple,
    appendToSelection?: boolean,
    maxDistance?: number,
  ) => ModelingVertex | null;
  selectVertices: (vertexIds: string[], appendToSelection?: boolean) => void;
  selectVertex: (vertexId: string, appendToSelection?: boolean) => void;
  undo: () => void;
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

function cloneSnapshot(snapshot: ModelingSnapshot): ModelingSnapshot {
  return {
    currentModelId: snapshot.currentModelId,
    modelsById: Object.fromEntries(
      Object.entries(snapshot.modelsById).map(([modelId, model]) => [
        modelId,
        cloneModel(model),
      ]),
    ),
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
    selectedVertexIds: [],
  };
}

function createInitialState() {
  const snapshot = createInitialSnapshot();
  return {
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

function commitSnapshot(
  state: ModelingState,
  nextSnapshot: ModelingSnapshot,
): Pick<
  ModelingState,
  | "currentModelId"
  | "history"
  | "historyIndex"
  | "modelsById"
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

export const useModelingStore = create<ModelingState>((set, get) => ({
  ...createInitialState(),
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
    const snappedEndVertex = findVertexById(currentModel, options.endVertexId);
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
      new Set([startVertexId, corner1VertexId, endVertexId, corner3VertexId])
        .size !== 4
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
        selectedVertexIds: [nextVertexId],
      }),
    });

    return nextVertex;
  },
  clearVertexSelection: () =>
    set((state) =>
      state.selectedVertexIds.length === 0
        ? state
        : {
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
        selectedVertexIds: [...state.selectedVertexIds],
      }),
    });

    return true;
  },
  deleteSelectedVertices: () => {
    const state = get();
    if (state.selectedVertexIds.length === 0) {
      return false;
    }

    const currentModel = state.modelsById[state.currentModelId];
    if (!currentModel) {
      return false;
    }

    const selectedVertexSet = new Set(state.selectedVertexIds);
    const hasSelectedVertex = state.selectedVertexIds.some(
      (vertexId) => currentModel.verticesById[vertexId],
    );

    if (!hasSelectedVertex) {
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
      return !edge.vertexIds.some((vertexId) =>
        selectedVertexSet.has(vertexId),
      );
    });
    nextModel.edgesById = Object.fromEntries(
      Object.entries(nextModel.edgesById).filter(
        ([, edge]) =>
          !edge.vertexIds.some((vertexId) => selectedVertexSet.has(vertexId)),
      ),
    );
    nextModel.faceOrder = nextModel.faceOrder.filter((faceId) => {
      const face = nextModel.facesById[faceId];
      return !face.vertexIds.some((vertexId) =>
        selectedVertexSet.has(vertexId),
      );
    });
    nextModel.facesById = Object.fromEntries(
      Object.entries(nextModel.facesById).filter(
        ([, face]) =>
          !face.vertexIds.some((vertexId) => selectedVertexSet.has(vertexId)),
      ),
    );

    set({
      ...commitSnapshot(state, {
        currentModelId: state.currentModelId,
        modelsById: {
          ...state.modelsById,
          [currentModel.id]: nextModel,
        },
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

    return findNearestVertexInModel(currentModel, pointerPosition, maxDistance);
  },
  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) {
        return state;
      }

      const nextSnapshot = cloneSnapshot(state.history[state.historyIndex + 1]);
      return {
        ...nextSnapshot,
        history: state.history,
        historyIndex: state.historyIndex + 1,
      };
    }),
  resetModeling: () => set(createInitialState()),
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
      if (!appendToSelection && state.selectedVertexIds.length > 0) {
        set({ selectedVertexIds: [] });
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
          selectedVertexIds: [...state.selectedVertexIds, vertexId],
        };
      }

      if (
        state.selectedVertexIds.length === 1 &&
        state.selectedVertexIds[0] === vertexId
      ) {
        return state;
      }

      return {
        selectedVertexIds: [vertexId],
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
          vertexIds.includes(vertexId) && currentModel.verticesById[vertexId],
      );

      if (validVertexIds.length === 0) {
        return appendToSelection ? state : { selectedVertexIds: [] };
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
            (vertexId, index) => vertexId === state.selectedVertexIds[index],
          )
        ) {
          return state;
        }

        return {
          selectedVertexIds: nextSelectedVertexIds,
        };
      }

      if (
        validVertexIds.length === state.selectedVertexIds.length &&
        validVertexIds.every(
          (vertexId, index) => vertexId === state.selectedVertexIds[index],
        )
      ) {
        return state;
      }

      return {
        selectedVertexIds: validVertexIds,
      };
    }),
  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) {
        return state;
      }

      const nextSnapshot = cloneSnapshot(state.history[state.historyIndex - 1]);
      return {
        ...nextSnapshot,
        history: state.history,
        historyIndex: state.historyIndex - 1,
      };
    }),
}));
