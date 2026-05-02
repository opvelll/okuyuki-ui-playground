import { beforeEach, describe, expect, it } from "vitest";
import { useModelingStore } from "./modelingStore";

describe("modelingStore", () => {
  beforeEach(() => {
    useModelingStore.getState().resetModeling();
  });

  it("creates a default named model", () => {
    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.name).toBe("Model 001");
    expect(currentModel.rootPosition).toEqual([0, 0, 0]);
    expect(currentModel.rootRotation).toEqual([0, 0, 0]);
    expect(state.selectedRoot).toBe(true);
    expect(currentModel.vertexOrder).toHaveLength(0);
  });

  it("stores root transforms separately from vertex coordinates", () => {
    const vertex = useModelingStore.getState().addVertex([1, 2, 3]);

    useModelingStore.getState().selectRoot();
    useModelingStore.getState().updateCurrentModelRootPosition([4, 5, 6]);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.rootPosition).toEqual([4, 5, 6]);
    expect(currentModel.verticesById[vertex?.id ?? "missing"].position).toEqual(
      [1, 2, 3],
    );
    expect(state.selectedRoot).toBe(true);
    expect(state.selectedVertexIds).toEqual([]);
  });

  it("persists modeling data locally", () => {
    useModelingStore.getState().addVertex([1, 2, 3]);

    const persistedValue = globalThis.localStorage.getItem(
      "naname-ui-modeling-store",
    );

    expect(persistedValue).not.toBeNull();
    expect(persistedValue).toContain("Model 001");
    expect(persistedValue).toContain("vertex-1");
  });

  it("replaces modeling data as a fresh project", () => {
    useModelingStore.getState().addVertex([9, 9, 9]);

    useModelingStore.getState().replaceModelingProject(
      {
        currentModelId: "model-imported",
        modelsById: {
          "model-imported": {
            edgeOrder: [],
            edgesById: {},
            faceOrder: [],
            facesById: {},
            id: "model-imported",
            name: "Imported",
            rootPosition: [1, 2, 3],
            rootRotation: [0, 0, 0],
            vertexOrder: ["vertex-imported"],
            verticesById: {
              "vertex-imported": {
                id: "vertex-imported",
                position: [4, 5, 6],
              },
            },
          },
        },
        selectedEdgeIds: [],
        selectedFaceIds: [],
        selectedRoot: false,
        selectedVertexIds: ["vertex-imported"],
      },
      { autoNameIndex: 7 },
    );

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.name).toBe("Imported");
    expect(currentModel.verticesById["vertex-imported"].position).toEqual([
      4, 5, 6,
    ]);
    expect(state.autoNameIndex).toBe(7);
    expect(state.history).toHaveLength(1);
    expect(state.historyIndex).toBe(0);
  });

  it("adds a vertex and selects it", () => {
    const vertex = useModelingStore.getState().addVertex([1, 2, 3]);
    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(vertex).not.toBeNull();
    expect(currentModel.vertexOrder).toEqual([vertex?.id]);
    expect(
      currentModel.verticesById[vertex?.id ?? "missing"]?.position,
    ).toEqual([1, 2, 3]);
    expect(state.selectedVertexIds).toEqual([vertex?.id]);
  });

  it("supports multi-selection and edge creation with undo and redo", () => {
    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([1, 0, 0]);

    useModelingStore.getState().selectVertex(vertexA?.id ?? "", false);
    useModelingStore.getState().selectVertex(vertexB?.id ?? "", true);

    expect(useModelingStore.getState().selectedVertexIds).toEqual([
      vertexA?.id,
      vertexB?.id,
    ]);

    expect(useModelingStore.getState().connectSelectedVerticesAsEdge()).toBe(
      true,
    );

    let state = useModelingStore.getState();
    let currentModel = state.modelsById[state.currentModelId];
    expect(currentModel.edgeOrder).toHaveLength(1);

    useModelingStore.getState().undo();
    state = useModelingStore.getState();
    currentModel = state.modelsById[state.currentModelId];
    expect(currentModel.edgeOrder).toHaveLength(0);

    useModelingStore.getState().redo();
    state = useModelingStore.getState();
    currentModel = state.modelsById[state.currentModelId];
    expect(currentModel.edgeOrder).toHaveLength(1);
  });

  it("moves selected vertices together and commits a single undo step", () => {
    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([1, 0, 0]);

    useModelingStore.getState().selectVertex(vertexA?.id ?? "", false);
    useModelingStore.getState().selectVertex(vertexB?.id ?? "", true);

    expect(
      useModelingStore
        .getState()
        .beginVertexMoveDrag(vertexA?.id ?? "", [
          vertexA?.id ?? "",
          vertexB?.id ?? "",
        ]),
    ).toBe(true);
    expect(useModelingStore.getState().updateVertexMoveDrag([2, 3, 4])).toBe(
      true,
    );
    expect(useModelingStore.getState().commitVertexMoveDrag()).toBe(true);

    let state = useModelingStore.getState();
    let currentModel = state.modelsById[state.currentModelId];
    expect(currentModel.verticesById[vertexA?.id ?? ""].position).toEqual([
      2, 3, 4,
    ]);
    expect(currentModel.verticesById[vertexB?.id ?? ""].position).toEqual([
      3, 3, 4,
    ]);
    expect(state.historyIndex).toBe(3);

    useModelingStore.getState().undo();

    state = useModelingStore.getState();
    currentModel = state.modelsById[state.currentModelId];
    expect(currentModel.verticesById[vertexA?.id ?? ""].position).toEqual([
      0, 0, 0,
    ]);
    expect(currentModel.verticesById[vertexB?.id ?? ""].position).toEqual([
      1, 0, 0,
    ]);
  });

  it("moves selected vertices by editing their shared center", () => {
    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([2, 2, 2]);

    useModelingStore
      .getState()
      .selectVertices([vertexA?.id ?? "", vertexB?.id ?? ""], false);
    useModelingStore.getState().updateSelectedVerticesCenter([3, 4, 5]);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.verticesById[vertexA?.id ?? ""].position).toEqual([
      2, 3, 4,
    ]);
    expect(currentModel.verticesById[vertexB?.id ?? ""].position).toEqual([
      4, 5, 6,
    ]);
    expect(state.selectedVertexIds).toEqual([vertexA?.id, vertexB?.id]);
  });

  it("rotates selected vertices as one undoable drag", () => {
    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([2, 0, 0]);

    useModelingStore
      .getState()
      .selectVertices([vertexA?.id ?? "", vertexB?.id ?? ""], false);

    expect(useModelingStore.getState().beginVertexRotateDrag()).toBe(true);
    expect(
      useModelingStore.getState().updateVertexRotateDrag({
        [vertexA?.id ?? ""]: [1, 0, 1],
        [vertexB?.id ?? ""]: [1, 0, -1],
      }),
    ).toBe(true);
    expect(useModelingStore.getState().commitVertexRotateDrag()).toBe(true);

    let state = useModelingStore.getState();
    let currentModel = state.modelsById[state.currentModelId];
    expect(currentModel.verticesById[vertexA?.id ?? ""].position).toEqual([
      1, 0, 1,
    ]);
    expect(currentModel.verticesById[vertexB?.id ?? ""].position).toEqual([
      1, 0, -1,
    ]);

    useModelingStore.getState().undo();

    state = useModelingStore.getState();
    currentModel = state.modelsById[state.currentModelId];
    expect(currentModel.verticesById[vertexA?.id ?? ""].position).toEqual([
      0, 0, 0,
    ]);
    expect(currentModel.verticesById[vertexB?.id ?? ""].position).toEqual([
      2, 0, 0,
    ]);
  });

  it("creates triangle faces and the required edges from three selected vertices", () => {
    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([1, 0, 0]);
    const vertexC = useModelingStore.getState().addVertex([0, 1, 0]);

    useModelingStore.getState().selectVertex(vertexA?.id ?? "", false);
    useModelingStore.getState().selectVertex(vertexB?.id ?? "", true);
    useModelingStore.getState().selectVertex(vertexC?.id ?? "", true);

    expect(useModelingStore.getState().createFaceFromSelectedVertices()).toBe(
      true,
    );

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    expect(currentModel.edgeOrder).toHaveLength(3);
    expect(currentModel.faceOrder).toHaveLength(1);
  });

  it("creates polygon faces from more than three selected vertices in selection order", () => {
    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([1, 0, 0]);
    const vertexC = useModelingStore.getState().addVertex([1, 1, 0]);
    const vertexD = useModelingStore.getState().addVertex([0, 1, 0]);

    useModelingStore.getState().selectVertex(vertexA?.id ?? "", false);
    useModelingStore.getState().selectVertex(vertexB?.id ?? "", true);
    useModelingStore.getState().selectVertex(vertexC?.id ?? "", true);
    useModelingStore.getState().selectVertex(vertexD?.id ?? "", true);

    expect(useModelingStore.getState().createFaceFromSelectedVertices()).toBe(
      true,
    );

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    const face = currentModel.facesById[currentModel.faceOrder[0]];

    expect(currentModel.edgeOrder).toHaveLength(4);
    expect(face.vertexIds).toEqual([
      vertexA?.id,
      vertexB?.id,
      vertexC?.id,
      vertexD?.id,
    ]);
  });

  it("selects edges and faces separately from vertex move selection", () => {
    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([1, 0, 0]);
    const vertexC = useModelingStore.getState().addVertex([0, 1, 0]);

    useModelingStore.getState().selectVertex(vertexA?.id ?? "", false);
    useModelingStore.getState().selectVertex(vertexB?.id ?? "", true);
    useModelingStore.getState().selectVertex(vertexC?.id ?? "", true);
    useModelingStore.getState().createFaceFromSelectedVertices();

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    const edgeId = currentModel.edgeOrder[0];
    const faceId = currentModel.faceOrder[0];

    useModelingStore.getState().selectModelingElements({
      edgeIds: [edgeId],
      faceIds: [faceId],
    });

    expect(useModelingStore.getState().selectedEdgeIds).toEqual([edgeId]);
    expect(useModelingStore.getState().selectedFaceIds).toEqual([faceId]);
    expect(useModelingStore.getState().selectedVertexIds).toEqual([]);

    expect(
      useModelingStore.getState().beginVertexMoveDrag(vertexA?.id ?? ""),
    ).toBe(false);

    useModelingStore.getState().selectVertex(vertexA?.id ?? "", false);
    expect(useModelingStore.getState().selectedEdgeIds).toEqual([]);
    expect(useModelingStore.getState().selectedFaceIds).toEqual([]);
  });

  it("creates a rectangle from a dragged diagonal as one quad face by default", () => {
    expect(
      useModelingStore
        .getState()
        .createRectangleFromDiagonal([0, 0, 0], [2, 1, 3], {
          mode: "flat-xz",
        }),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    const positions = currentModel.vertexOrder.map(
      (vertexId) => currentModel.verticesById[vertexId].position,
    );

    expect(positions).toEqual([
      [0, 0, 0],
      [2, 0, 0],
      [2, 0, 3],
      [0, 0, 3],
    ]);
    expect(currentModel.edgeOrder).toHaveLength(4);
    expect(currentModel.faceOrder).toHaveLength(1);
    expect(currentModel.facesById[currentModel.faceOrder[0]].vertexIds).toEqual(
      ["vertex-1", "vertex-2", "vertex-3", "vertex-4"],
    );
    expect(state.selectedVertexIds).toEqual([
      "vertex-1",
      "vertex-2",
      "vertex-3",
      "vertex-4",
    ]);
  });

  it("can create a rectangle from a dragged diagonal as two triangle faces", () => {
    expect(
      useModelingStore
        .getState()
        .createRectangleFromDiagonal([0, 0, 0], [2, 1, 3], {
          faceMode: "triangles",
          mode: "flat-xz",
        }),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.edgeOrder).toHaveLength(5);
    expect(currentModel.faceOrder).toHaveLength(2);
  });

  it("creates an upright-up-fixed rectangle from the diagonal", () => {
    expect(
      useModelingStore
        .getState()
        .createRectangleFromDiagonal([1, 2, 3], [4, 6, 8], {
          mode: "upright-up-fixed",
        }),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    const faceVertexIds =
      currentModel.facesById[currentModel.faceOrder[0]].vertexIds;
    const facePositions = faceVertexIds.map(
      (vertexId) => currentModel.verticesById[vertexId].position,
    );

    expect(facePositions).toEqual([
      [1, 2, 3],
      [4, 2, 8],
      [4, 6, 8],
      [1, 6, 3],
    ]);
  });

  it("creates an upright-x-fixed rectangle from the diagonal", () => {
    expect(
      useModelingStore
        .getState()
        .createRectangleFromDiagonal([1, 2, 3], [5, 6, 8], {
          mode: "upright-x-fixed",
        }),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    const faceVertexIds =
      currentModel.facesById[currentModel.faceOrder[0]].vertexIds;
    const facePositions = faceVertexIds.map(
      (vertexId) => currentModel.verticesById[vertexId].position,
    );

    expect(facePositions).toEqual([
      [1, 2, 3],
      [1, 6, 8],
      [5, 6, 8],
      [5, 2, 3],
    ]);
  });

  it("creates an upright-z-fixed rectangle from the diagonal", () => {
    expect(
      useModelingStore
        .getState()
        .createRectangleFromDiagonal([1, 2, 3], [5, 6, 9], {
          mode: "upright-z-fixed",
        }),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    const faceVertexIds =
      currentModel.facesById[currentModel.faceOrder[0]].vertexIds;
    const facePositions = faceVertexIds.map(
      (vertexId) => currentModel.verticesById[vertexId].position,
    );

    expect(facePositions).toEqual([
      [1, 2, 3],
      [5, 6, 3],
      [5, 6, 9],
      [1, 2, 9],
    ]);
  });

  it("creates a left-square shape from the diagonal", () => {
    expect(
      useModelingStore
        .getState()
        .createRectangleFromDiagonal([1, 2, 3], [1, 6, 9], {
          mode: "upright-left-square",
        }),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    const faceVertexIds =
      currentModel.facesById[currentModel.faceOrder[0]].vertexIds;
    const facePositions = faceVertexIds.map(
      (vertexId) => currentModel.verticesById[vertexId].position,
    );

    expect(facePositions).toEqual([
      [1, 2, 3],
      [4.605551, 4, 6],
      [1, 6, 9],
      [-2.605551, 4, 6],
    ]);
  });

  it("creates a box from a dragged diagonal as quad faces by default", () => {
    expect(
      useModelingStore.getState().createBoxFromDiagonal([4, 6, 8], [1, 2, 3]),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    const positions = currentModel.vertexOrder.map(
      (vertexId) => currentModel.verticesById[vertexId].position,
    );

    expect(positions).toEqual([
      [1, 2, 3],
      [4, 2, 3],
      [4, 6, 3],
      [1, 6, 3],
      [1, 2, 8],
      [4, 2, 8],
      [4, 6, 8],
      [1, 6, 8],
    ]);
    expect(currentModel.edgeOrder).toHaveLength(12);
    expect(currentModel.faceOrder).toHaveLength(6);
    expect(currentModel.facesById[currentModel.faceOrder[0]].vertexIds).toEqual(
      ["vertex-1", "vertex-2", "vertex-3", "vertex-4"],
    );
    expect(state.selectedVertexIds).toEqual([
      "vertex-1",
      "vertex-2",
      "vertex-3",
      "vertex-4",
      "vertex-5",
      "vertex-6",
      "vertex-7",
      "vertex-8",
    ]);
  });

  it("can create a box from a dragged diagonal as triangles on each face", () => {
    expect(
      useModelingStore.getState().createBoxFromDiagonal([4, 6, 8], [1, 2, 3], {
        faceMode: "triangles",
      }),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.edgeOrder).toHaveLength(12);
    expect(currentModel.faceOrder).toHaveLength(12);
  });

  it("deletes selected vertices and removes dependent geometry that references them", () => {
    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([1, 0, 0]);
    const vertexC = useModelingStore.getState().addVertex([0, 1, 0]);

    useModelingStore.getState().selectVertex(vertexA?.id ?? "", false);
    useModelingStore.getState().selectVertex(vertexB?.id ?? "", true);
    useModelingStore.getState().selectVertex(vertexC?.id ?? "", true);
    useModelingStore.getState().createFaceFromSelectedVertices();
    useModelingStore.getState().selectVertex(vertexA?.id ?? "", false);

    expect(useModelingStore.getState().deleteSelectedVertices()).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.vertexOrder).toEqual([vertexB?.id, vertexC?.id]);
    expect(currentModel.edgeOrder).toHaveLength(1);
    expect(currentModel.edgesById[currentModel.edgeOrder[0]].vertexIds).toEqual(
      [vertexB?.id, vertexC?.id],
    );
    expect(currentModel.faceOrder).toHaveLength(0);
    expect(state.selectedVertexIds).toEqual([]);
  });

  it("returns false when deleting without a selected vertex", () => {
    expect(useModelingStore.getState().deleteSelectedVertices()).toBe(false);
  });

  it("selects a nearby vertex from pointer position", () => {
    const vertex = useModelingStore.getState().addVertex([0, 0, 0]);

    const selected = useModelingStore
      .getState()
      .selectNearestVertex([0.1, 0.1, 0], false, 0.3);

    expect(selected?.id).toBe(vertex?.id);
    expect(useModelingStore.getState().selectedVertexIds).toEqual([vertex?.id]);
  });

  it("selects multiple explicit vertices in model order", () => {
    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([1, 0, 0]);
    const vertexC = useModelingStore.getState().addVertex([2, 0, 0]);

    useModelingStore
      .getState()
      .selectVertices([vertexC?.id ?? "", vertexA?.id ?? ""], false);

    expect(useModelingStore.getState().selectedVertexIds).toEqual([
      vertexA?.id,
      vertexC?.id,
    ]);

    useModelingStore.getState().selectVertices([vertexB?.id ?? ""], true);

    expect(useModelingStore.getState().selectedVertexIds).toEqual([
      vertexA?.id,
      vertexC?.id,
      vertexB?.id,
    ]);
  });

  it("creates an edge from dragged positions and reuses nearby vertices when snapped", () => {
    const startVertex = useModelingStore.getState().addVertex([0, 0, 0]);
    const endVertex = useModelingStore.getState().addVertex([2, 0, 0]);

    expect(
      useModelingStore
        .getState()
        .createEdgeFromPositions([0.1, 0.02, 0], [1.92, 0, 0.03], 0.2),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.vertexOrder).toHaveLength(2);
    expect(currentModel.edgeOrder).toHaveLength(1);
    expect(currentModel.edgesById[currentModel.edgeOrder[0]].vertexIds).toEqual(
      [startVertex?.id, endVertex?.id],
    );
  });

  it("creates new start and end vertices when no nearby snap target exists", () => {
    expect(
      useModelingStore
        .getState()
        .createEdgeFromPositions([0, 0, 0], [1, 0, 0], 0),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.vertexOrder).toHaveLength(2);
    expect(currentModel.edgeOrder).toHaveLength(1);
    expect(state.selectedVertexIds).toEqual(["vertex-1", "vertex-2"]);
  });

  it("keeps a single vertex selected when both ends snap to the same target", () => {
    const vertex = useModelingStore.getState().addVertex([0, 0, 0]);

    expect(
      useModelingStore
        .getState()
        .createEdgeFromPositions([0.05, 0, 0], [0.08, 0.02, 0], 0.2),
    ).toBe(false);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.vertexOrder).toHaveLength(1);
    expect(currentModel.edgeOrder).toHaveLength(0);
    expect(state.selectedVertexIds).toEqual([vertex?.id]);
  });

  it("reuses explicitly provided snapped vertex ids even when snap distance is zero", () => {
    const startVertex = useModelingStore.getState().addVertex([0, 0, 0]);
    const endVertex = useModelingStore.getState().addVertex([2, 0, 0]);

    expect(
      useModelingStore
        .getState()
        .createEdgeFromPositions([0, 0, 0], [2, 0, 0], {
          endVertexId: endVertex?.id,
          snapDistance: 0,
          startVertexId: startVertex?.id,
        }),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.vertexOrder).toHaveLength(2);
    expect(currentModel.edgeOrder).toHaveLength(1);
    expect(currentModel.edgesById[currentModel.edgeOrder[0]].vertexIds).toEqual(
      [startVertex?.id, endVertex?.id],
    );
  });

  it("splits a snapped edge when adding a vertex on it", () => {
    const startVertex = useModelingStore.getState().addVertex([0, 0, 0]);
    const endVertex = useModelingStore.getState().addVertex([2, 0, 0]);
    useModelingStore.getState().createEdgeFromPositions([0, 0, 0], [2, 0, 0], {
      endVertexId: endVertex?.id,
      snapDistance: 0,
      startVertexId: startVertex?.id,
    });

    const vertex = useModelingStore.getState().addVertex([1, 0, 0], {
      edgeTarget: {
        edgeId: "edge-1",
        position: [1, 0, 0],
        vertexIds: [startVertex?.id ?? "", endVertex?.id ?? ""],
      },
    });

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(vertex?.position).toEqual([1, 0, 0]);
    expect(currentModel.vertexOrder).toHaveLength(3);
    expect(currentModel.edgeOrder).toHaveLength(2);
    expect(
      currentModel.edgeOrder.map(
        (edgeId) => currentModel.edgesById[edgeId].vertexIds,
      ),
    ).toEqual([
      [startVertex?.id, vertex?.id],
      [vertex?.id, endVertex?.id],
    ]);
  });

  it("splits a snapped edge before connecting a new line", () => {
    const startVertex = useModelingStore.getState().addVertex([0, 0, 0]);
    const endVertex = useModelingStore.getState().addVertex([2, 0, 0]);
    useModelingStore.getState().createEdgeFromPositions([0, 0, 0], [2, 0, 0], {
      endVertexId: endVertex?.id,
      snapDistance: 0,
      startVertexId: startVertex?.id,
    });

    expect(
      useModelingStore
        .getState()
        .createEdgeFromPositions([1, 0, 0], [1, 1, 0], {
          endEdgeTarget: null,
          snapDistance: 0,
          startEdgeTarget: {
            edgeId: "edge-1",
            position: [1, 0, 0],
            vertexIds: [startVertex?.id ?? "", endVertex?.id ?? ""],
          },
        }),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];
    const insertedVertexId = currentModel.vertexOrder.find((vertexId) =>
      comparePositions(currentModel.verticesById[vertexId].position, [1, 0, 0]),
    );
    const newTipVertexId = currentModel.vertexOrder.find((vertexId) =>
      comparePositions(currentModel.verticesById[vertexId].position, [1, 1, 0]),
    );

    expect(insertedVertexId).toBeTruthy();
    expect(newTipVertexId).toBeTruthy();
    expect(currentModel.vertexOrder).toHaveLength(4);
    expect(currentModel.edgeOrder).toHaveLength(3);
    expect(
      currentModel.edgeOrder.map(
        (edgeId) => currentModel.edgesById[edgeId].vertexIds,
      ),
    ).toEqual([
      [startVertex?.id, insertedVertexId],
      [insertedVertexId, endVertex?.id],
      [insertedVertexId, newTipVertexId],
    ]);
  });

  it("creates a pen stroke as connected vertices and rewrites the last history entry", () => {
    const params = {
      mergeDistance: 0.2,
      mergeVertices: false,
      resampleSpacing: 0,
      simplificationDistance: 0,
      smoothingIterations: 0,
    };

    expect(
      useModelingStore.getState().createPenStrokeFromPositions(
        [
          [0, 0, 0],
          [1, 0, 0],
          [2, 0, 0],
        ],
        params,
      ),
    ).toBe(true);

    let state = useModelingStore.getState();
    let currentModel = state.modelsById[state.currentModelId];
    const strokeHistoryIndex = state.historyIndex;

    expect(currentModel.vertexOrder).toHaveLength(3);
    expect(currentModel.edgeOrder).toHaveLength(2);

    expect(
      useModelingStore.getState().updateLastPenStrokeFromPositions(
        [
          [0, 0, 0],
          [1, 0, 0],
          [2, 0, 0],
        ],
        {
          ...params,
          simplificationDistance: 2,
        },
        strokeHistoryIndex,
      ),
    ).toBe(true);

    state = useModelingStore.getState();
    currentModel = state.modelsById[state.currentModelId];

    expect(state.historyIndex).toBe(strokeHistoryIndex);
    expect(state.history).toHaveLength(strokeHistoryIndex + 1);
    expect(currentModel.vertexOrder).toHaveLength(2);
    expect(currentModel.edgeOrder).toHaveLength(1);
  });

  it("can merge pen stroke samples onto existing vertices", () => {
    const startVertex = useModelingStore.getState().addVertex([0, 0, 0]);

    expect(
      useModelingStore.getState().createPenStrokeFromPositions(
        [
          [0.05, 0, 0],
          [1, 0, 0],
        ],
        {
          mergeDistance: 0.2,
          mergeVertices: true,
          resampleSpacing: 0,
          simplificationDistance: 0,
          smoothingIterations: 0,
        },
      ),
    ).toBe(true);

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.vertexOrder).toHaveLength(2);
    expect(currentModel.edgesById[currentModel.edgeOrder[0]].vertexIds[0]).toBe(
      startVertex?.id,
    );
  });
});

function comparePositions(
  a: [number, number, number],
  b: [number, number, number],
) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
