import { PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import {
  MODELING_POINTER_PRECISION_GRID_STEP_MIN,
  getEffectiveModelingPointerGridStep,
  getModelingPointerDepthHint,
  getModelingPointerSnapResult,
  getSnappedModelingPointerPosition,
} from "./scene/modelingPointerUtils";

describe("getSnappedModelingPointerPosition", () => {
  it("returns the original position when pointer snap is disabled", () => {
    expect(
      getSnappedModelingPointerPosition(
        [0.11, 0.26, -0.12],
        [[0.1, 0.3, -0.1]],
        {
          axisDistance: 0.05,
          axisEnabled: false,
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

  it("scales grid snap step in precision mode and clamps its minimum", () => {
    expect(getEffectiveModelingPointerGridStep(0.05, 0.1, false)).toBe(0.05);
    expect(getEffectiveModelingPointerGridStep(0.05, 0.1, true)).toBe(0.005);
    expect(getEffectiveModelingPointerGridStep(0.005, 0.1, true)).toBe(
      MODELING_POINTER_PRECISION_GRID_STEP_MIN,
    );
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
