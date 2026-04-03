import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { calculateDragPlaneOverlayGeometry } from "./dragPlaneOverlay";

describe("calculateDragPlaneOverlayGeometry", () => {
  it("uses the drag start as overlay center", () => {
    const geometry = calculateDragPlaneOverlayGeometry({
      currentPoint: new Vector3(2, 3, 4),
      planeNormal: new Vector3(0, 0, 1),
      startPoint: new Vector3(0, 1, 2),
    });

    expect(geometry.center.toArray()).toEqual([0, 1, 2]);
  });

  it("grows radius from the drag distance and multiplier", () => {
    const geometry = calculateDragPlaneOverlayGeometry(
      {
        currentPoint: new Vector3(4, 0, 0),
        planeNormal: new Vector3(0, 0, 1),
        startPoint: new Vector3(0, 0, 0),
      },
      { minRadius: 0.1, radiusMultiplier: 1.2 },
    );

    expect(geometry.radius).toBeCloseTo(4.8);
  });

  it("keeps both points on the overlay surface", () => {
    const geometry = calculateDragPlaneOverlayGeometry({
      currentPoint: new Vector3(3, 1, 2),
      planeNormal: new Vector3(0, 0, 1),
      startPoint: new Vector3(1, -1, 0),
    });

    const startOffset = new Vector3().subVectors(
      new Vector3(1, -1, 0),
      geometry.center,
    );
    const currentOffset = new Vector3().subVectors(
      new Vector3(3, 1, 2),
      geometry.center,
    );

    expect(geometry.surfaceNormal.dot(startOffset)).toBeCloseTo(0);
    expect(geometry.surfaceNormal.dot(currentOffset)).toBeCloseTo(0);
  });

  it("keeps a minimum radius when the drag distance is tiny", () => {
    const geometry = calculateDragPlaneOverlayGeometry(
      {
        currentPoint: new Vector3(0.01, 0, 0),
        planeNormal: new Vector3(0, 1, 0),
        startPoint: new Vector3(0, 0, 0),
      },
      { minRadius: 0.32, radiusMultiplier: 0.05 },
    );

    expect(geometry.radius).toBe(0.32);
  });

  it("keeps the overlay camera-facing at drag start", () => {
    const geometry = calculateDragPlaneOverlayGeometry({
      currentPoint: new Vector3(0.2, 0, 0),
      planeNormal: new Vector3(0, 0, 1),
      startPoint: new Vector3(0, 0, 0),
    });

    expect(geometry.surfaceNormal.toArray()).toEqual([0, 0, 1]);
  });

  it("keeps the overlay camera-facing during lateral movement", () => {
    const geometry = calculateDragPlaneOverlayGeometry({
      currentPoint: new Vector3(1.5, 0.4, 0),
      planeNormal: new Vector3(0, 0, 1),
      startPoint: new Vector3(0, 0, 0),
    });

    expect(geometry.surfaceNormal.toArray()).toEqual([0, 0, 1]);
  });

  it("falls back to a stable tilted surface on pure depth movement", () => {
    const geometry = calculateDragPlaneOverlayGeometry({
      currentPoint: new Vector3(0, 0, 1),
      planeNormal: new Vector3(0, 0, 1),
      startPoint: new Vector3(0, 0, 0),
    });

    expect(geometry.surfaceNormal.length()).toBeCloseTo(1);
    expect(geometry.surfaceNormal.toArray()).toEqual([0, -1, 0]);
  });
});
