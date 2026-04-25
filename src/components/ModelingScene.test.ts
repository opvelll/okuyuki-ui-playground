import { PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import {
  getModelingLineOverlayBelowFloorOpacity,
  getModelingLineOverlayOpacity,
  shouldShowModelingPointerHorizontalAxes,
} from "./ModelingScene";
import {
  MODELING_POINTER_PRECISION_GRID_STEP_MIN,
  getBoxPreviewFacePositions,
  getBoxVerticesFromDiagonal,
  getEffectiveModelingPointerGridStep,
  getLineDirectionSnapPosition,
  getModelingPointerDepthHint,
  getModelingPointerSnapResult,
  getRectangleDragPosition,
  getRectangleVerticesFromDiagonal,
  getSnappedModelingPointerPosition,
} from "./scene/modelingPointerUtils";
import {
  appendLassoPoint,
  isPointInsideLasso,
} from "./scene/modelingSelectionUtils";

describe("shouldShowModelingPointerHorizontalAxes", () => {
  it("hides x and z axes when the pointer is below the vertical axis floor", () => {
    expect(shouldShowModelingPointerHorizontalAxes(-0.1, 0)).toBe(false);
  });

  it("keeps x and z axes visible at or above the vertical axis floor", () => {
    expect(shouldShowModelingPointerHorizontalAxes(0, 0)).toBe(true);
    expect(shouldShowModelingPointerHorizontalAxes(0.1, 0)).toBe(true);
  });
});

describe("getModelingLineOverlayOpacity", () => {
  it("keeps the drag guide circle visible above the floor", () => {
    expect(getModelingLineOverlayOpacity(0.1, 0, "hidden")).toBeGreaterThan(0);
  });

  it("can hide or fade the drag guide circle below the floor", () => {
    expect(getModelingLineOverlayOpacity(-0.1, 0, "hidden")).toBe(0);
    expect(getModelingLineOverlayOpacity(-0.1, 0, "faded")).toBeGreaterThan(0);
    expect(getModelingLineOverlayOpacity(-0.1, 0, "visible")).toBeGreaterThan(
      getModelingLineOverlayOpacity(-0.1, 0, "faded"),
    );
  });
});

describe("getModelingLineOverlayBelowFloorOpacity", () => {
  it("maps below-floor display modes to clipped guide-circle opacity", () => {
    expect(getModelingLineOverlayBelowFloorOpacity("hidden")).toBe(0);
    expect(getModelingLineOverlayBelowFloorOpacity("faded")).toBeGreaterThan(0);
    expect(getModelingLineOverlayBelowFloorOpacity("visible")).toBeGreaterThan(
      getModelingLineOverlayBelowFloorOpacity("faded"),
    );
  });
});

describe("getBoxPreviewFacePositions", () => {
  it("builds six quad faces as triangle positions from box corners", () => {
    const box = getBoxVerticesFromDiagonal([4, 6, 8], [1, 2, 3]);

    expect(box).not.toBeNull();
    expect(getBoxPreviewFacePositions(box?.corners ?? [])).toHaveLength(108);
    expect(getBoxPreviewFacePositions(box?.corners ?? []).slice(0, 18)).toEqual(
      [1, 2, 3, 4, 2, 3, 4, 6, 3, 1, 2, 3, 4, 6, 3, 1, 6, 3],
    );
  });
});

describe("getSnappedModelingPointerPosition", () => {
  it("returns the original position when pointer snap is disabled", () => {
    expect(
      getSnappedModelingPointerPosition(
        [0.11, 0.26, -0.12],
        [[0.1, 0.3, -0.1]],
        {
          axisDistance: 0.05,
          axisEnabled: false,
          edgeDistance: 0.2,
          edgeEnabled: false,
          gridEnabled: false,
          gridStep: 0.05,
          vertexDistance: 0.2,
          vertexEnabled: false,
        },
      ),
    ).toEqual([0.11, 0.26, -0.12]);
  });

  it("snaps directly to the nearest vertex before axis or grid snapping", () => {
    const result = getModelingPointerSnapResult(
      [0.11, 0.26, -0.12],
      [
        [0.1, 0.3, -0.1],
        [0.5, 0.5, 0.5],
      ],
      {
        axisDistance: 0.01,
        axisEnabled: true,
        edgeDistance: 0.05,
        edgeEnabled: true,
        edgeSnapTargets: [
          {
            edgeId: "edge-1",
            end: [2, 0, 0],
            start: [0, 0, 0],
            vertexIds: ["vertex-1", "vertex-2"],
          },
        ],
        gridEnabled: true,
        gridStep: 0.05,
        vertexDistance: 0.05,
        vertexEnabled: true,
      },
    );

    expect(result.position).toEqual([0.1, 0.3, -0.1]);
    expect(result.snappedVertexTarget).toEqual([0.1, 0.3, -0.1]);
    expect(result.snappedAxes).toEqual([false, false, false]);
  });

  it("snaps matching axes to nearby vertex world coordinates first", () => {
    expect(
      getSnappedModelingPointerPosition(
        [0.11, 0.26, -0.12],
        [[0.1, 0.3, 1.2]],
        {
          axisDistance: 0.05,
          axisEnabled: true,
          edgeDistance: 0.05,
          edgeEnabled: false,
          gridEnabled: true,
          gridStep: 0.05,
          vertexDistance: 0.01,
          vertexEnabled: false,
        },
      ),
    ).toEqual([0.1, 0.3, -0.1]);
  });

  it("falls back to fixed world intervals on axes without a nearby vertex", () => {
    expect(
      getSnappedModelingPointerPosition([0.11, 0.26, -0.12], [[3, 4, 5]], {
        axisDistance: 0.05,
        axisEnabled: false,
        edgeDistance: 0.05,
        edgeEnabled: false,
        gridEnabled: true,
        gridStep: 0.05,
        vertexDistance: 0.01,
        vertexEnabled: false,
      }),
    ).toEqual([0.1, 0.25, -0.1]);
  });

  it("keeps grid snap off while still snapping to a nearby vertex axis line", () => {
    expect(
      getSnappedModelingPointerPosition([0.11, 0.26, -0.12], [[2, 0.3, -0.1]], {
        axisDistance: 0.05,
        axisEnabled: true,
        edgeDistance: 0.05,
        edgeEnabled: false,
        gridEnabled: false,
        gridStep: 0.05,
        vertexDistance: 0.01,
        vertexEnabled: false,
      }),
    ).toEqual([0.11, 0.3, -0.1]);
  });

  it("reports which vertex axis line was snapped", () => {
    const result = getModelingPointerSnapResult(
      [0.11, 0.26, -0.12],
      [[0.1, 0.3, 5]],
      {
        axisDistance: 0.05,
        axisEnabled: true,
        edgeDistance: 0.05,
        edgeEnabled: false,
        gridEnabled: true,
        gridStep: 0.05,
        vertexDistance: 0.01,
        vertexEnabled: false,
      },
    );

    expect(result.snappedAxes).toEqual([false, false, true]);
    expect(result.snappedAxisTargets).toEqual([null, null, [0.1, 0.3, 5]]);
    expect(result.snappedVertexTarget).toBeNull();
  });

  it("can snap to axis-only positions that are not vertex snap targets", () => {
    const result = getModelingPointerSnapResult(
      [1.01, 2.03, 3.2],
      [[10, 10, 10]],
      {
        axisDistance: 0.05,
        axisEnabled: true,
        axisSnapPositions: [[1, 2, 0]],
        edgeDistance: 0.05,
        edgeEnabled: false,
        gridEnabled: false,
        gridStep: 0.05,
        vertexDistance: 0.05,
        vertexEnabled: true,
      },
    );

    expect(result.position).toEqual([1, 2, 3.2]);
    expect(result.snappedAxes).toEqual([false, false, true]);
    expect(result.snappedAxisTargets).toEqual([null, null, [1, 2, 0]]);
    expect(result.snappedVertexTarget).toBeNull();
  });

  it("snaps to the nearest point on an edge before axis or grid snapping", () => {
    const result = getModelingPointerSnapResult([1.02, 0.08, 0], [], {
      axisDistance: 0.05,
      axisEnabled: true,
      edgeDistance: 0.1,
      edgeEnabled: true,
      edgeSnapTargets: [
        {
          edgeId: "edge-1",
          end: [2, 0, 0],
          start: [0, 0, 0],
          vertexIds: ["vertex-1", "vertex-2"],
        },
      ],
      gridEnabled: true,
      gridStep: 0.05,
      vertexDistance: 0.01,
      vertexEnabled: false,
    });

    expect(result.position).toEqual([1.02, 0, 0]);
    expect(result.snappedEdgeTarget).toEqual({
      edgeId: "edge-1",
      position: [1.02, 0, 0],
      vertexIds: ["vertex-1", "vertex-2"],
    });
    expect(result.snappedVertexTarget).toBeNull();
  });

  it("scales grid snap step in precision mode and clamps its minimum", () => {
    expect(getEffectiveModelingPointerGridStep(0.05, 0.1, false)).toBe(0.05);
    expect(getEffectiveModelingPointerGridStep(0.05, 0.1, true)).toBe(0.005);
    expect(getEffectiveModelingPointerGridStep(0.005, 0.1, true)).toBe(
      MODELING_POINTER_PRECISION_GRID_STEP_MIN,
    );
  });

  it("constrains line drag to the nearest world axis direction", () => {
    expect(getLineDirectionSnapPosition([1, 2, 3], [4.2, 2.4, 3.1])).toEqual([
      4.2, 2, 3,
    ]);
  });

  it("constrains line drag to the nearest world 45 degree diagonal", () => {
    const result = getLineDirectionSnapPosition([0, 0, 0], [2.1, 2.8, 0.2], 45);

    expect(result[0]).toBeCloseTo(2.45, 5);
    expect(result[1]).toBeCloseTo(2.45, 5);
    expect(result[2]).toBe(0);
  });

  it("supports finer line drag angle steps on the main planes", () => {
    expect(
      getLineDirectionSnapPosition([0, 0, 0], [3.4, 1.1, 0.2], 15),
    ).toEqual([3.447244, 0.923686, 0]);
  });

  it("projects flat rectangle drags onto the xz plane", () => {
    expect(getRectangleDragPosition([1, 2, 3], [4, 5, 6], "flat-xz")).toEqual([
      4, 2, 6,
    ]);
  });

  it("builds flat rectangle corners from a diagonal", () => {
    expect(
      getRectangleVerticesFromDiagonal([1, 2, 3], [4, 6, 9], "flat-xz"),
    ).toEqual({
      corners: [
        [1, 2, 3],
        [4, 2, 3],
        [4, 2, 9],
        [1, 2, 9],
      ],
      planeNormal: [0, 1, 0],
    });
  });

  it("builds upright-up-fixed rectangle corners from a diagonal", () => {
    expect(
      getRectangleVerticesFromDiagonal(
        [1, 2, 3],
        [4, 6, 8],
        "upright-up-fixed",
      ),
    ).toEqual({
      corners: [
        [1, 2, 3],
        [4, 2, 8],
        [4, 6, 8],
        [1, 6, 3],
      ],
      planeNormal: [0.857493, 0, -0.514496],
    });
  });

  it("builds upright-x-fixed rectangle corners from a diagonal", () => {
    expect(
      getRectangleVerticesFromDiagonal([1, 2, 3], [5, 6, 8], "upright-x-fixed"),
    ).toEqual({
      corners: [
        [1, 2, 3],
        [1, 6, 8],
        [5, 6, 8],
        [5, 2, 3],
      ],
      planeNormal: [0, -0.780869, 0.624695],
    });
  });

  it("builds upright-z-fixed rectangle corners from a diagonal", () => {
    const rectangle = getRectangleVerticesFromDiagonal(
      [1, 2, 3],
      [5, 6, 9],
      "upright-z-fixed",
    );

    expect(rectangle?.corners).toEqual([
      [1, 2, 3],
      [5, 6, 3],
      [5, 6, 9],
      [1, 2, 9],
    ]);
    expect(rectangle?.planeNormal[0]).toBeCloseTo(-Math.SQRT1_2, 6);
    expect(rectangle?.planeNormal[1]).toBeCloseTo(Math.SQRT1_2, 6);
    expect(rectangle?.planeNormal[2]).toBe(0);
  });

  it("builds upright-left-square corners from a diagonal", () => {
    expect(
      getRectangleVerticesFromDiagonal(
        [1, 2, 3],
        [1, 6, 9],
        "upright-left-square",
      ),
    ).toEqual({
      corners: [
        [1, 2, 3],
        [4.605551, 4, 6],
        [1, 6, 9],
        [-2.605551, 4, 6],
      ],
      planeNormal: [0, 0.83205, -0.5547],
    });
  });

  it("builds axis-aligned box corners and edges from a diagonal", () => {
    expect(getBoxVerticesFromDiagonal([4, 6, 8], [1, 2, 3])).toEqual({
      corners: [
        [1, 2, 3],
        [4, 2, 3],
        [4, 6, 3],
        [1, 6, 3],
        [1, 2, 8],
        [4, 2, 8],
        [4, 6, 8],
        [1, 6, 8],
      ],
      edges: [
        [
          [1, 2, 3],
          [4, 2, 3],
        ],
        [
          [4, 2, 3],
          [4, 6, 3],
        ],
        [
          [4, 6, 3],
          [1, 6, 3],
        ],
        [
          [1, 6, 3],
          [1, 2, 3],
        ],
        [
          [1, 2, 8],
          [4, 2, 8],
        ],
        [
          [4, 2, 8],
          [4, 6, 8],
        ],
        [
          [4, 6, 8],
          [1, 6, 8],
        ],
        [
          [1, 6, 8],
          [1, 2, 8],
        ],
        [
          [1, 2, 3],
          [1, 2, 8],
        ],
        [
          [4, 2, 3],
          [4, 2, 8],
        ],
        [
          [4, 6, 3],
          [4, 6, 8],
        ],
        [
          [1, 6, 3],
          [1, 6, 8],
        ],
      ],
    });
  });

  it("counts near and far vertices when they overlap the pointer in screen space", () => {
    const camera = new PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const result = getModelingPointerDepthHint(
      [0, 0, 0],
      [
        [0.02, 0.01, 1],
        [-0.01, -0.02, 1.4],
        [0.01, 0.01, -1.1],
        [1.4, 0, 0],
        [0, 0, 0.2],
      ],
      camera,
      { height: 600, width: 600 },
      {
        depthDistance: 0.5,
        screenDistancePx: 12,
      },
    );

    expect(result).toEqual({
      farCount: 1,
      nearCount: 2,
      pointerScreenPosition: {
        x: 300,
        y: 300,
      },
    });
  });

  it("returns null when only the screen position overlaps but depth stays inside snap distance", () => {
    const camera = new PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    expect(
      getModelingPointerDepthHint(
        [0, 0, 0],
        [
          [0.01, 0.01, 0.2],
          [-0.01, -0.01, -0.2],
        ],
        camera,
        { height: 600, width: 600 },
        {
          depthDistance: 0.5,
          screenDistancePx: 12,
        },
      ),
    ).toBeNull();
  });
});

describe("modelingSelectionUtils", () => {
  it("detects points inside a lasso polygon", () => {
    const polygon: Array<[number, number]> = [
      [10, 10],
      [80, 16],
      [72, 90],
      [18, 76],
    ];

    expect(isPointInsideLasso([40, 40], polygon)).toBe(true);
    expect(isPointInsideLasso([4, 4], polygon)).toBe(false);
  });

  it("skips lasso points that are too close to the previous sample", () => {
    expect(
      appendLassoPoint(
        [
          [10, 10],
          [30, 12],
        ],
        [33, 14],
      ),
    ).toEqual([
      [10, 10],
      [30, 12],
    ]);

    expect(
      appendLassoPoint(
        [
          [10, 10],
          [30, 12],
        ],
        [48, 22],
      ),
    ).toEqual([
      [10, 10],
      [30, 12],
      [48, 22],
    ]);
  });
});
