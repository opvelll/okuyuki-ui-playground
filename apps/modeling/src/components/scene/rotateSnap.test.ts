import { MathUtils, Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { snapAngleToStep, snapAxisRotationQuaternion } from "./rotateSnap";

describe("snapAngleToStep", () => {
  it("rounds to the nearest angular step", () => {
    const result = snapAngleToStep(
      MathUtils.degToRad(22),
      MathUtils.degToRad(15),
    );

    expect(MathUtils.radToDeg(result)).toBeCloseTo(15);
  });

  it("passes through when the step is invalid", () => {
    const result = snapAngleToStep(MathUtils.degToRad(22), 0);

    expect(MathUtils.radToDeg(result)).toBeCloseTo(22);
  });
});

describe("snapAxisRotationQuaternion", () => {
  it("snaps a positive axis rotation to the nearest step", () => {
    const result = snapAxisRotationQuaternion(
      new Quaternion().setFromAxisAngle(
        new Vector3(0, 1, 0),
        MathUtils.degToRad(22),
      ),
      new Vector3(0, 1, 0),
      MathUtils.degToRad(15),
    );
    const rotated = new Vector3(0, 0, 1).applyQuaternion(result);

    expect(rotated.x).toBeCloseTo(Math.sin(MathUtils.degToRad(15)), 5);
    expect(rotated.z).toBeCloseTo(Math.cos(MathUtils.degToRad(15)), 5);
  });

  it("preserves the sign for negative rotations", () => {
    const result = snapAxisRotationQuaternion(
      new Quaternion().setFromAxisAngle(
        new Vector3(0, -1, 0),
        MathUtils.degToRad(22),
      ),
      new Vector3(0, 1, 0),
      MathUtils.degToRad(15),
    );
    const rotated = new Vector3(0, 0, 1).applyQuaternion(result);

    expect(rotated.x).toBeCloseTo(-Math.sin(MathUtils.degToRad(15)), 5);
    expect(rotated.z).toBeCloseTo(Math.cos(MathUtils.degToRad(15)), 5);
  });
});
