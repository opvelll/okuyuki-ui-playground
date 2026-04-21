import { describe, expect, it } from "vitest";
import { getSnappedModelingPointerPosition } from "./ModelingScene";

describe("getSnappedModelingPointerPosition", () => {
  it("returns the original position when pointer snap is disabled", () => {
    expect(
      getSnappedModelingPointerPosition(
        [0.11, 0.26, -0.12],
        [[0.1, 0.3, -0.1]],
        {
          axisDistance: 0.05,
          enabled: false,
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
          enabled: true,
          gridStep: 0.05,
        },
      ),
    ).toEqual([0.1, 0.3, -0.1]);
  });

  it("falls back to fixed world intervals on axes without a nearby vertex", () => {
    expect(
      getSnappedModelingPointerPosition([0.11, 0.26, -0.12], [[3, 4, 5]], {
        axisDistance: 0.05,
        enabled: true,
        gridStep: 0.05,
      }),
    ).toEqual([0.1, 0.25, -0.1]);
  });
});
