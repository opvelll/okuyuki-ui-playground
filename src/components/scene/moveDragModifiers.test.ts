import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import type { SceneObject } from "../../types/scene";
import { applyScreenDepthDragModifiers } from "./moveDragModifiers";

const objectsById: Record<string, SceneObject> = {
  "amber-box": {
    color: "#ff8a5b",
    id: "amber-box",
    kind: "box",
    position: [-2.3, 0.45, -0.8] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
  },
  "gold-sphere": {
    color: "#f7c948",
    id: "gold-sphere",
    kind: "sphere",
    position: [-0.9, 0.55, 1.1] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
  },
};

describe("applyScreenDepthDragModifiers", () => {
  it("keeps freeform drag with no modifiers", () => {
    const result = applyScreenDepthDragModifiers({
      ctrlKey: false,
      gridSnapStep: 0.5,
      objectId: "amber-box",
      objectsById,
      position: new Vector3(1.26, 0.63, -0.71),
      shiftKey: false,
    });

    expect(result.axisMagnetTarget).toBeNull();
    expect(result.position.toArray()).toEqual([1.26, 0.63, -0.71]);
  });

  it("does not modify plane drag while shift is pressed alone", () => {
    const result = applyScreenDepthDragModifiers({
      ctrlKey: false,
      gridSnapStep: 0.5,
      objectId: "amber-box",
      objectsById,
      position: new Vector3(1.26, 0.63, -0.71),
      shiftKey: true,
    });

    expect(result.axisMagnetTarget).toBeNull();
    expect(result.position.toArray()).toEqual([1.26, 0.63, -0.71]);
  });

  it("snaps absolute position on xyz while ctrl is pressed", () => {
    const result = applyScreenDepthDragModifiers({
      ctrlKey: true,
      gridSnapStep: 0.5,
      objectId: "amber-box",
      objectsById,
      position: new Vector3(1.26, 0.63, -0.71),
      shiftKey: false,
    });

    expect(result.axisMagnetTarget).toBeNull();
    expect(result.position.toArray()).toEqual([1.5, 0.5, -0.5]);
  });

  it("magnetizes to only the nearest single axis while shift and ctrl are pressed", () => {
    const result = applyScreenDepthDragModifiers({
      axisMagnetThreshold: 0.2,
      ctrlKey: true,
      gridSnapStep: 0.5,
      objectId: "amber-box",
      objectsById,
      position: new Vector3(-0.5, 0.57, 1.13),
      shiftKey: true,
    });

    expect(result.axisMagnetTarget).toEqual({
      axis: "x",
      direction: "positive",
      objectId: "gold-sphere",
    });
    expect(result.position.toArray()).toEqual([-0.5, 0.55, 1.1]);
  });

  it("keeps the current magnet target while it stays within the stickiness range", () => {
    const result = applyScreenDepthDragModifiers({
      axisMagnetThreshold: 0.2,
      ctrlKey: true,
      currentAxisMagnetTarget: {
        axis: "x",
        direction: "positive",
        objectId: "gold-sphere",
      },
      gridSnapStep: 0.5,
      objectId: "amber-box",
      objectsById,
      position: new Vector3(-0.28, 0.61, 1.35),
      shiftKey: true,
    });

    expect(result.axisMagnetTarget).toEqual({
      axis: "x",
      direction: "positive",
      objectId: "gold-sphere",
    });
    expect(result.position.toArray()).toEqual([-0.28, 0.55, 1.1]);
  });
});
