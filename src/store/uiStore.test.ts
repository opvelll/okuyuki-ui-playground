import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_MODELING_CAMERA,
  DEFAULT_PROTOTYPE_CAMERA,
  createDefaultPersistedUiState,
  useUiStore,
} from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({
      ...createDefaultPersistedUiState(),
      axisMagnetTarget: null,
      interactionState: "idle",
      modelingCamera: DEFAULT_MODELING_CAMERA,
      modelingCameraDragging: false,
      modelingCameraOverride: false,
      modelingPointer: {
        depth: 8,
        hovered: false,
        plane: "none",
        position: [0, 0, 0],
      },
      prototypeCamera: DEFAULT_PROTOTYPE_CAMERA,
      selectedObjectId: null,
    });
  });

  it("clears the rotate selection when switching to move mode", () => {
    useUiStore.setState({
      interactionMode: "rotate",
      interactionState: "active",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().setInteractionMode("move");

    expect(useUiStore.getState().interactionMode).toBe("move");
    expect(useUiStore.getState().selectedObjectId).toBeNull();
    expect(useUiStore.getState().interactionState).toBe("idle");
  });

  it("clears selection when a move drag completes", () => {
    useUiStore.setState({
      axisMagnetTarget: {
        axis: "x",
        direction: "positive",
        objectId: "cobalt-cylinder",
      },
      interactionMode: "move",
      interactionState: "dragging",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().completeMoveDrag();

    expect(useUiStore.getState().axisMagnetTarget).toBeNull();
    expect(useUiStore.getState().interactionState).toBe("idle");
    expect(useUiStore.getState().selectedObjectId).toBeNull();
  });

  it("keeps the selection when changing into rotate mode", () => {
    useUiStore.setState({
      interactionMode: "move",
      interactionState: "active",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().setInteractionMode("rotate");

    expect(useUiStore.getState().interactionMode).toBe("rotate");
    expect(useUiStore.getState().selectedObjectId).toBe("amber-box");
    expect(useUiStore.getState().interactionState).toBe("active");
  });

  it("keeps dragging state when setting the current interaction mode again", () => {
    useUiStore.setState({
      axisMagnetTarget: {
        axis: "z",
        direction: "negative",
        objectId: "amber-box",
      },
      interactionMode: "move",
      interactionState: "dragging",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().setInteractionMode("move");

    expect(useUiStore.getState().interactionMode).toBe("move");
    expect(useUiStore.getState().interactionState).toBe("dragging");
    expect(useUiStore.getState().selectedObjectId).toBe("amber-box");
    expect(useUiStore.getState().axisMagnetTarget).toEqual({
      axis: "z",
      direction: "negative",
      objectId: "amber-box",
    });
  });

  it("clears selection when switching screens", () => {
    useUiStore.setState({
      currentScreen: "prototype",
      interactionState: "active",
      selectedObjectId: "amber-box",
    });

    useUiStore.getState().setCurrentScreen("modeling");

    expect(useUiStore.getState().currentScreen).toBe("modeling");
    expect(useUiStore.getState().selectedObjectId).toBeNull();
    expect(useUiStore.getState().interactionState).toBe("idle");
  });

  it("keeps prototype and modeling camera snapshots separate", () => {
    useUiStore.getState().setPrototypeCamera({
      position: [1, 2, 3],
      target: [4, 5, 6],
    });
    useUiStore.getState().setModelingCamera({
      position: [7, 8, 9],
      target: [10, 11, 12],
    });

    expect(useUiStore.getState().prototypeCamera).toEqual({
      position: [1, 2, 3],
      target: [4, 5, 6],
    });
    expect(useUiStore.getState().modelingCamera).toEqual({
      position: [7, 8, 9],
      target: [10, 11, 12],
    });
  });

  it("does not reset camera snapshots when switching screens", () => {
    useUiStore.getState().setPrototypeCamera({
      position: [1, 2, 3],
      target: [0, 0, 0],
    });
    useUiStore.getState().setModelingCamera({
      position: [7, 8, 9],
      target: [1, 1, 1],
    });

    useUiStore.getState().setCurrentScreen("modeling");

    expect(useUiStore.getState().prototypeCamera).toEqual({
      position: [1, 2, 3],
      target: [0, 0, 0],
    });
    expect(useUiStore.getState().modelingCamera).toEqual({
      position: [7, 8, 9],
      target: [1, 1, 1],
    });
  });

  it("clamps the modeling vertical axis floor height", () => {
    useUiStore.getState().setModelingPointerVerticalAxisFloorY(64);
    expect(useUiStore.getState().modelingPointerVerticalAxisFloorY).toBe(32);

    useUiStore.getState().setModelingPointerVerticalAxisFloorY(-64);
    expect(useUiStore.getState().modelingPointerVerticalAxisFloorY).toBe(-32);
  });
});
