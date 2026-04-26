import type {
  ModelingModel,
  ModelingSnapshot,
  ModelingVertex,
} from "../store/modelingStore";
import type { Vector3Tuple } from "../types/scene";

export const MODELING_PROJECT_FORMAT = "okuyuki-ui-modeling-project";
export const MODELING_PROJECT_FORMAT_VERSION = 1;

export type ModelingProjectFile = {
  autoNameIndex?: number;
  currentModelId: string;
  format: typeof MODELING_PROJECT_FORMAT;
  formatVersion: typeof MODELING_PROJECT_FORMAT_VERSION;
  modelsById: Record<string, ModelingModel>;
  savedAt: string;
  selectedEdgeIds: string[];
  selectedFaceIds: string[];
  selectedRoot: boolean;
  selectedVertexIds: string[];
};

export type ModelingProjectLoadResult =
  | {
      autoNameIndex?: number;
      snapshot: ModelingSnapshot;
    }
  | {
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isVector3Tuple(value: unknown): value is Vector3Tuple {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function parseVertex(value: unknown): ModelingVertex | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  if (!isVector3Tuple(value.position)) {
    return null;
  }

  return {
    id: value.id,
    position: [...value.position],
  };
}

function parseModel(value: unknown): ModelingModel | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isStringArray(value.edgeOrder) ||
    !isRecord(value.edgesById) ||
    !isStringArray(value.faceOrder) ||
    !isRecord(value.facesById) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !isVector3Tuple(value.rootPosition) ||
    !isVector3Tuple(value.rootRotation) ||
    !isStringArray(value.vertexOrder) ||
    !isRecord(value.verticesById)
  ) {
    return null;
  }

  const verticesById: ModelingModel["verticesById"] = {};
  for (const vertexId of value.vertexOrder) {
    const vertex = parseVertex(value.verticesById[vertexId]);
    if (!vertex || vertex.id !== vertexId) {
      return null;
    }
    verticesById[vertexId] = vertex;
  }

  const edgesById: ModelingModel["edgesById"] = {};
  for (const edgeId of value.edgeOrder) {
    const edge = value.edgesById[edgeId];
    if (
      !isRecord(edge) ||
      edge.id !== edgeId ||
      !Array.isArray(edge.vertexIds) ||
      edge.vertexIds.length !== 2 ||
      !edge.vertexIds.every(
        (vertexId) =>
          typeof vertexId === "string" && verticesById[vertexId] !== undefined,
      )
    ) {
      return null;
    }
    edgesById[edgeId] = {
      id: edgeId,
      vertexIds: [edge.vertexIds[0], edge.vertexIds[1]],
    };
  }

  const facesById: ModelingModel["facesById"] = {};
  for (const faceId of value.faceOrder) {
    const face = value.facesById[faceId];
    if (
      !isRecord(face) ||
      face.id !== faceId ||
      !Array.isArray(face.vertexIds) ||
      face.vertexIds.length !== 3 ||
      !face.vertexIds.every(
        (vertexId) =>
          typeof vertexId === "string" && verticesById[vertexId] !== undefined,
      )
    ) {
      return null;
    }
    facesById[faceId] = {
      id: faceId,
      vertexIds: [face.vertexIds[0], face.vertexIds[1], face.vertexIds[2]],
    };
  }

  return {
    edgeOrder: [...value.edgeOrder],
    edgesById,
    faceOrder: [...value.faceOrder],
    facesById,
    id: value.id,
    name: value.name,
    rootPosition: [...value.rootPosition],
    rootRotation: [...value.rootRotation],
    vertexOrder: [...value.vertexOrder],
    verticesById,
  };
}

function filterExistingIds(ids: string[], existingIds: Set<string>) {
  return ids.filter(
    (id, index) => existingIds.has(id) && ids.indexOf(id) === index,
  );
}

export function createModelingProjectFile(
  snapshot: ModelingSnapshot,
  options?: { autoNameIndex?: number; savedAt?: string },
): ModelingProjectFile {
  return {
    autoNameIndex: options?.autoNameIndex,
    currentModelId: snapshot.currentModelId,
    format: MODELING_PROJECT_FORMAT,
    formatVersion: MODELING_PROJECT_FORMAT_VERSION,
    modelsById: snapshot.modelsById,
    savedAt: options?.savedAt ?? new Date().toISOString(),
    selectedEdgeIds: snapshot.selectedEdgeIds,
    selectedFaceIds: snapshot.selectedFaceIds,
    selectedRoot: snapshot.selectedRoot,
    selectedVertexIds: snapshot.selectedVertexIds,
  };
}

export function serializeModelingProjectFile(
  snapshot: ModelingSnapshot,
  options?: { autoNameIndex?: number; savedAt?: string },
) {
  return `${JSON.stringify(createModelingProjectFile(snapshot, options), null, 2)}\n`;
}

export function parseModelingProjectFile(
  text: string,
): ModelingProjectLoadResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "Project file is not valid JSON." };
  }

  if (!isRecord(parsed)) {
    return { error: "Project file must contain an object." };
  }

  if (
    parsed.format !== MODELING_PROJECT_FORMAT ||
    parsed.formatVersion !== MODELING_PROJECT_FORMAT_VERSION
  ) {
    return { error: "Project file format is not supported." };
  }

  if (
    typeof parsed.currentModelId !== "string" ||
    !isRecord(parsed.modelsById) ||
    !isStringArray(parsed.selectedEdgeIds) ||
    !isStringArray(parsed.selectedFaceIds) ||
    typeof parsed.selectedRoot !== "boolean" ||
    !isStringArray(parsed.selectedVertexIds)
  ) {
    return { error: "Project file is missing required modeling data." };
  }

  const modelsById: Record<string, ModelingModel> = {};
  for (const [modelId, modelValue] of Object.entries(parsed.modelsById)) {
    const model = parseModel(modelValue);
    if (!model || model.id !== modelId) {
      return { error: "Project file contains invalid model geometry." };
    }
    modelsById[modelId] = model;
  }

  const currentModel = modelsById[parsed.currentModelId];
  if (!currentModel) {
    return { error: "Project file points to a missing current model." };
  }

  const selectedVertexIds = filterExistingIds(
    parsed.selectedVertexIds,
    new Set(currentModel.vertexOrder),
  );
  const selectedEdgeIds = filterExistingIds(
    parsed.selectedEdgeIds,
    new Set(currentModel.edgeOrder),
  );
  const selectedFaceIds = filterExistingIds(
    parsed.selectedFaceIds,
    new Set(currentModel.faceOrder),
  );

  return {
    autoNameIndex:
      typeof parsed.autoNameIndex === "number" &&
      Number.isInteger(parsed.autoNameIndex) &&
      parsed.autoNameIndex > 0
        ? parsed.autoNameIndex
        : undefined,
    snapshot: {
      currentModelId: parsed.currentModelId,
      modelsById,
      selectedEdgeIds,
      selectedFaceIds,
      selectedRoot:
        parsed.selectedRoot &&
        selectedVertexIds.length === 0 &&
        selectedEdgeIds.length === 0 &&
        selectedFaceIds.length === 0,
      selectedVertexIds,
    },
  };
}
