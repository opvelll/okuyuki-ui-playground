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
  "violet-cylinder": {
    color: "#8b5cf6",
    id: "violet-cylinder",
    kind: "cylinder",
    position: [2, 2, 0] as [number, number, number],
    rotation: [0, 0, Math.PI / 2] as [number, number, number],
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

  it("magnetizes during normal drag when always-on snapping is enabled", () => {
    const result = applyScreenDepthDragModifiers({
      axisMagnetAlwaysEnabled: true,
      axisMagnetThreshold: 0.2,
      ctrlKey: false,
      gridSnapStep: 0.5,
      objectId: "amber-box",
      objectsById,
      position: new Vector3(-0.5, 0.57, 1.13),
      shiftKey: false,
    });

    expect(result.axisMagnetTarget).toEqual({
      axis: "x",
      direction: "positive",
      objectId: "gold-sphere",
    });
    expect(result.position.toArray()).toEqual([-0.5, 0.55, 1.1]);
  });

  it("uses rotated local axes when the magnet space is local", () => {
    const result = applyScreenDepthDragModifiers({
      axisMagnetAlwaysEnabled: true,
      axisMagnetReferenceFrame: "local",
      axisMagnetThreshold: 0.1,
      ctrlKey: false,
      gridSnapStep: 0.5,
      objectId: "amber-box",
      objectsById,
      position: new Vector3(2.02, 2.6, 0),
      shiftKey: false,
    });

    expect(result.axisMagnetTarget).toEqual({
      axis: "x",
      direction: "positive",
      objectId: "violet-cylinder",
    });
    expect(result.position.toArray()).toEqual([2, 2.6, 0]);
  });

  it("uses world axes when the magnet space is world", () => {
    const result = applyScreenDepthDragModifiers({
      axisMagnetAlwaysEnabled: true,
      axisMagnetReferenceFrame: "world",
      axisMagnetThreshold: 0.1,
      ctrlKey: false,
      gridSnapStep: 0.5,
      objectId: "amber-box",
      objectsById,
      position: new Vector3(2.6, 2.02, 0),
      shiftKey: false,
    });

    expect(result.axisMagnetTarget).toEqual({
      axis: "x",
      direction: "positive",
      objectId: "violet-cylinder",
    });
    expect(result.position.toArray()).toEqual([2.6, 2, 0]);
  });
});
