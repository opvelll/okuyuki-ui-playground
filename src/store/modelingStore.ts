import { create } from "zustand";
import type { Vector3Tuple } from "../types/scene";

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
          endVertexId?: string | null;
          snapDistance?: number;
          startVertexId?: string | null;
        },
  ) => boolean;
  history: ModelingSnapshot[];
  historyIndex: number;
  addVertex: (position: Vector3Tuple) => ModelingVertex | null;
  clearVertexSelection: () => void;
  connectSelectedVerticesAsEdge: () => boolean;
  createFaceFromSelectedVertices: () => boolean;
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
  selectVertex: (vertexId: string, appendToSelection?: boolean) => void;
  undo: () => void;
};

const DEFAULT_MODEL_NAME_PREFIX = "Model";
const DEFAULT_SELECTION_DISTANCE = 0.45;

function createModelName(index: number) {
  return `${DEFAULT_MODEL_NAME_PREFIX} ${String(index).padStart(3, "0")}`;
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

    const ensureVertex = (
      snappedVertex: ModelingVertex | null,
      position: Vector3Tuple,
    ) => {
      if (snappedVertex) {
        selectedVertexIds.push(snappedVertex.id);
        return snappedVertex.id;
      }

      const nextVertexId = `vertex-${nextModel.vertexOrder.length + 1}`;
      nextModel.vertexOrder.push(nextVertexId);
      nextModel.verticesById[nextVertexId] = {
        id: nextVertexId,
        position: [...position],
      };
      selectedVertexIds.push(nextVertexId);
      return nextVertexId;
    };

    const startVertexId = ensureVertex(snappedStartVertex, startPosition);
    const endVertexId = ensureVertex(snappedEndVertex, endPosition);
    const edgeVertexIds = [startVertexId, endVertexId] as [string, string];

    if (
      edgeVertexIds[0] === edgeVertexIds[1] ||
      hasEdge(nextModel, edgeVertexIds)
    ) {
      return false;
    }

    const nextEdgeId = `edge-${nextModel.edgeOrder.length + 1}`;
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
        selectedVertexIds,
      }),
    });

    return true;
  },
  addVertex: (position) => {
    const state = get();
    const currentModel = state.modelsById[state.currentModelId];

    if (!currentModel) {
      return null;
    }

    const nextVertexId = `vertex-${currentModel.vertexOrder.length + 1}`;
    const nextVertex: ModelingVertex = {
      id: nextVertexId,
      position,
    };
    const nextModel = cloneModel(currentModel);
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
    const nextEdgeId = `edge-${nextModel.edgeOrder.length + 1}`;
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

      const nextEdgeId = `edge-${nextModel.edgeOrder.length + 1}`;
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
