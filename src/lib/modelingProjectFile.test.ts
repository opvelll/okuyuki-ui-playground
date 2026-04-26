import { describe, expect, it } from "vitest";
import type { ModelingSnapshot } from "../store/modelingStore";
import {
  parseModelingProjectFile,
  serializeModelingProjectFile,
} from "./modelingProjectFile";

const snapshot: ModelingSnapshot = {
  currentModelId: "model-1",
  modelsById: {
    "model-1": {
      edgeOrder: ["edge-1"],
      edgesById: {
        "edge-1": {
          id: "edge-1",
          vertexIds: ["vertex-1", "vertex-2"],
        },
      },
      faceOrder: ["face-1"],
      facesById: {
        "face-1": {
          id: "face-1",
          vertexIds: ["vertex-1", "vertex-2", "vertex-3"],
        },
      },
      id: "model-1",
      name: "Loaded Model",
      rootPosition: [1, 2, 3],
      rootRotation: [0, 0, 0],
      vertexOrder: ["vertex-1", "vertex-2", "vertex-3"],
      verticesById: {
        "vertex-1": { id: "vertex-1", position: [0, 0, 0] },
        "vertex-2": { id: "vertex-2", position: [1, 0, 0] },
        "vertex-3": { id: "vertex-3", position: [0, 1, 0] },
      },
    },
  },
  selectedEdgeIds: ["edge-1"],
  selectedFaceIds: [],
  selectedRoot: false,
  selectedVertexIds: ["vertex-1"],
};

describe("modelingProjectFile", () => {
  it("serializes and parses a project file", () => {
    const text = serializeModelingProjectFile(snapshot, {
      autoNameIndex: 4,
      savedAt: "2026-04-26T00:00:00.000Z",
    });
    const result = parseModelingProjectFile(text);

    expect(result).toMatchObject({
      autoNameIndex: 4,
      snapshot: {
        currentModelId: "model-1",
        selectedEdgeIds: ["edge-1"],
        selectedVertexIds: ["vertex-1"],
      },
    });
  });

  it("rejects unsupported files", () => {
    const result = parseModelingProjectFile(
      JSON.stringify({ format: "other", formatVersion: 1 }),
    );

    expect(result).toEqual({
      error: "Project file format is not supported.",
    });
  });
});
