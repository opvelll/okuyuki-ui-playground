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
      modelingLinePreview: {
        active: false,
        currentPosition: [0, 0, 0],
        currentSnapped: false,
        planeNormal: [0, 0, 1],
        startSnapped: false,
        startPosition: [0, 0, 0],
      },
      modelingPointer: {
        depth: 8,
        hovered: false,
        plane: "none",
        position: [0, 0, 0],
        snappedAxes: [false, false, false],
        snappedAxisTargets: [null, null, null],
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

  it("clamps the modeling pointer snap controls", () => {
    useUiStore.getState().setModelingPointerAxisSnapEnabled(false);
    expect(useUiStore.getState().modelingPointerAxisSnapEnabled).toBe(false);

    useUiStore.getState().setModelingPointerAxisSnapDistance(-1);
    expect(useUiStore.getState().modelingPointerAxisSnapDistance).toBe(0);

    useUiStore.getState().setModelingPointerGridSnapEnabled(true);
    expect(useUiStore.getState().modelingPointerGridSnapEnabled).toBe(true);

    useUiStore.getState().setModelingPointerGridSnapStep(0);
    expect(useUiStore.getState().modelingPointerGridSnapStep).toBe(0.01);

    useUiStore.getState().setModelingPointerAxisSnapDistance(10);
    expect(useUiStore.getState().modelingPointerAxisSnapDistance).toBe(4);

    useUiStore.getState().setModelingPointerGridSnapStep(10);
    expect(useUiStore.getState().modelingPointerGridSnapStep).toBe(4);
  });

  it("uses and clamps the modeling pointer depth precision scale", () => {
    expect(useUiStore.getState().modelingPointerDepthPrecisionScale).toBe(0.1);

    useUiStore.getState().setModelingPointerDepthPrecisionScale(0);
    expect(useUiStore.getState().modelingPointerDepthPrecisionScale).toBe(0.01);

    useUiStore.getState().setModelingPointerDepthPrecisionScale(2);
    expect(useUiStore.getState().modelingPointerDepthPrecisionScale).toBe(1);
  });

  it("resets line preview when switching modeling tools", () => {
    useUiStore.getState().setModelingLinePreview({
      currentPosition: [1, 1, 1],
      currentSnapped: true,
      planeNormal: [0, 0, 1],
      startSnapped: false,
      startPosition: [0, 0, 0],
    });

    useUiStore.getState().setModelingTool("camera");

    expect(useUiStore.getState().modelingLinePreview.active).toBe(false);
  });
});
