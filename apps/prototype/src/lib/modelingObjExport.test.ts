import { describe, expect, it } from "vitest";
import type { ModelingSnapshot } from "../store/modelingStore";
import { exportModelingSnapshotToObj } from "./modelingObjExport";

describe("modelingObjExport", () => {
  it("exports vertices, faces, and edges with root position applied", () => {
    const obj = exportModelingSnapshotToObj({
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
          name: "OBJ Model",
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
      selectedEdgeIds: [],
      selectedFaceIds: [],
      selectedRoot: false,
      selectedVertexIds: [],
    });

    expect(obj).toContain("o OBJ_Model");
    expect(obj).toContain("v 1 2 3");
    expect(obj).toContain("v 2 2 3");
    expect(obj).toContain("f 1 2 3");
    expect(obj).toContain("l 1 2");
  });

  it("can export polygon faces as triangulated OBJ faces", () => {
    const snapshot: ModelingSnapshot = {
      currentModelId: "model-1",
      modelsById: {
        "model-1": {
          edgeOrder: [],
          edgesById: {},
          faceOrder: ["face-1"],
          facesById: {
            "face-1": {
              id: "face-1",
              vertexIds: ["vertex-1", "vertex-2", "vertex-3", "vertex-4"],
            },
          },
          id: "model-1",
          name: "Quad Model",
          rootPosition: [0, 0, 0],
          rootRotation: [0, 0, 0],
          vertexOrder: ["vertex-1", "vertex-2", "vertex-3", "vertex-4"],
          verticesById: {
            "vertex-1": { id: "vertex-1", position: [0, 0, 0] },
            "vertex-2": { id: "vertex-2", position: [1, 0, 0] },
            "vertex-3": { id: "vertex-3", position: [1, 1, 0] },
            "vertex-4": { id: "vertex-4", position: [0, 1, 0] },
          },
        },
      },
      selectedEdgeIds: [],
      selectedFaceIds: [],
      selectedRoot: false,
      selectedVertexIds: [],
    };

    expect(exportModelingSnapshotToObj(snapshot)).toContain("f 1 2 3 4");
    expect(
      exportModelingSnapshotToObj(snapshot, { faceMode: "triangulated" }),
    ).toContain("f 1 2 3\nf 1 3 4");
  });
});
