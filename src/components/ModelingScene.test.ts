import { describe, expect, it } from "vitest";
import {
  MODELING_POINTER_PRECISION_GRID_STEP_MIN,
  getEffectiveModelingPointerGridStep,
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
        },
      ),
    ).toEqual([0.11, 0.26, -0.12]);
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
      },
    );

    expect(result.snappedAxes).toEqual([false, false, true]);
    expect(result.snappedAxisTargets).toEqual([null, null, [0.1, 0.3, 5]]);
  });

  it("scales grid snap step in precision mode and clamps its minimum", () => {
    expect(getEffectiveModelingPointerGridStep(0.05, 0.1, false)).toBe(0.05);
    expect(getEffectiveModelingPointerGridStep(0.05, 0.1, true)).toBe(0.005);
    expect(getEffectiveModelingPointerGridStep(0.005, 0.1, true)).toBe(
      MODELING_POINTER_PRECISION_GRID_STEP_MIN,
    );
  });
});
