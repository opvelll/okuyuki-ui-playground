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
    expect(currentModel.vertexOrder).toHaveLength(0);
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

  it("creates a rectangle from a dragged diagonal as two triangle faces", () => {
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
    expect(currentModel.edgeOrder).toHaveLength(5);
    expect(currentModel.faceOrder).toHaveLength(2);
    expect(state.selectedVertexIds).toEqual([
      "vertex-1",
      "vertex-2",
      "vertex-3",
      "vertex-4",
    ]);
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
    ]);
  });

  it("creates a box from a dragged diagonal as triangles on each face", () => {
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
    expect(currentModel.faceOrder).toHaveLength(12);
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
});

function comparePositions(
  a: [number, number, number],
  b: [number, number, number],
) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
