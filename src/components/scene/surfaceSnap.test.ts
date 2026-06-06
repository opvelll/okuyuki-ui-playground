import { Ray, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
  GUIDE_SURFACE,
  applySurfaceDepthOffset,
  intersectRayWithGuideSurface,
} from "./surfaceSnap";

describe("intersectRayWithGuideSurface", () => {
  it("returns a point on the guide surface when the ray hits inside it", () => {
    const result = intersectRayWithGuideSurface(
      new Ray(new Vector3(0, 1.5, 4), new Vector3(0, 0, -1)),
      new Vector3(),
    );

    expect(result?.objectPosition.toArray()).toEqual([
      0,
      1.5,
      GUIDE_SURFACE.center.z,
    ]);
  });

  it("returns null when the ray hits outside the finite surface", () => {
    const result = intersectRayWithGuideSurface(
      new Ray(new Vector3(3, 1.5, 4), new Vector3(0, 0, -1)),
      new Vector3(),
    );

    expect(result).toBeNull();
  });

  it("returns null when the ray is parallel to the surface", () => {
    const result = intersectRayWithGuideSurface(
      new Ray(new Vector3(0, 1.5, 4), new Vector3(1, 0, 0)),
      new Vector3(),
    );

    expect(result).toBeNull();
  });

  it("keeps only the pointer offset parallel to the surface", () => {
    const result = intersectRayWithGuideSurface(
      new Ray(new Vector3(0, 1.5, 4), new Vector3(0, 0, -1)),
      new Vector3(0.4, -0.25, 2),
    );

    expect(result?.objectPosition.toArray()).toEqual([
      0.4,
      1.25,
      GUIDE_SURFACE.center.z,
    ]);
  });

  it("uses the pointer intersection for the finite surface bounds", () => {
    const result = intersectRayWithGuideSurface(
      new Ray(new Vector3(2.4, 1.5, 4), new Vector3(0, 0, -1)),
      new Vector3(0.4, 0, 0),
    );

    expect(result?.objectPosition.x).toBeCloseTo(2.8);
  });

  it("applies wheel depth without changing the surface position", () => {
    const surfacePosition = new Vector3(0.5, 1.25, GUIDE_SURFACE.center.z);
    const result = applySurfaceDepthOffset(
      surfacePosition,
      new Vector3(0.12, 0.08, 0.2),
    );

    expect(result.toArray()).toEqual([
      0.62,
      1.33,
      GUIDE_SURFACE.center.z + 0.2,
    ]);
    expect(surfacePosition.toArray()).toEqual([
      0.5,
      1.25,
      GUIDE_SURFACE.center.z,
    ]);
  });
});
