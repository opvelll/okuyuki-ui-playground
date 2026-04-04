import { Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
  createArcballQuaternion,
  mapPointerToArcballVector,
} from "./objectRotateArcball";

describe("mapPointerToArcballVector", () => {
  it("maps the center point to the front pole", () => {
    const vector = mapPointerToArcballVector(120, 240, 120, 240, 80);

    expect(vector.x).toBeCloseTo(0);
    expect(vector.y).toBeCloseTo(0);
    expect(vector.z).toBeCloseTo(1);
  });

  it("clamps pointers outside the sphere to the equator", () => {
    const vector = mapPointerToArcballVector(220, 240, 120, 240, 80);

    expect(vector.length()).toBeCloseTo(1);
    expect(vector.z).toBeCloseTo(0);
    expect(vector.x).toBeCloseTo(1);
  });
});

describe("createArcballQuaternion", () => {
  it("rotates the start vector onto the current vector", () => {
    const startVector = new Vector3(0, 0, 1);
    const currentVector = mapPointerToArcballVector(180, 180, 120, 240, 120);
    const quaternion = createArcballQuaternion(
      startVector,
      currentVector,
      new Quaternion(),
    );

    const rotated = startVector.clone().applyQuaternion(quaternion);

    expect(rotated.x).toBeCloseTo(currentVector.x);
    expect(rotated.y).toBeCloseTo(currentVector.y);
    expect(rotated.z).toBeCloseTo(currentVector.z);
  });

  it("uses the camera orientation when lifting toward the upper right", () => {
    const startVector = new Vector3(0, 0, 1);
    const currentVector = mapPointerToArcballVector(180, 180, 120, 240, 120);
    const cameraQuaternion = new Quaternion().setFromAxisAngle(
      new Vector3(0, 1, 0),
      Math.PI / 4,
    );
    const quaternion = createArcballQuaternion(
      startVector,
      currentVector,
      cameraQuaternion,
    );

    const rotatedWorldFront = new Vector3(0, 0, 1).applyQuaternion(quaternion);

    expect(rotatedWorldFront.y).toBeGreaterThan(0);
    expect(rotatedWorldFront.x).toBeGreaterThan(0);
  });

  it("scales the arcball rotation angle with the multiplier", () => {
    const startVector = new Vector3(0, 0, 1);
    const currentVector = mapPointerToArcballVector(180, 180, 120, 240, 120);
    const baseQuaternion = createArcballQuaternion(
      startVector,
      currentVector,
      new Quaternion(),
    );
    const amplifiedQuaternion = createArcballQuaternion(
      startVector,
      currentVector,
      new Quaternion(),
      2,
    );
    const baseAngle = 2 * Math.acos(baseQuaternion.w);
    const amplifiedAngle = 2 * Math.acos(amplifiedQuaternion.w);

    expect(amplifiedAngle).toBeGreaterThan(baseAngle);
  });
});
