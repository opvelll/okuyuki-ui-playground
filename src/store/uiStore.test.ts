import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultPersistedUiState, useUiStore } from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({
      ...createDefaultPersistedUiState(),
      axisMagnetTarget: null,
      interactionState: "idle",
      selectedObjectId: null,
      transformStage: "idle",
    });
  });

  it("enters selection stage when selecting an object", () => {
    useUiStore.getState().selectObject("amber-box");

    expect(useUiStore.getState().selectedObjectId).toBe("amber-box");
    expect(useUiStore.getState().interactionState).toBe("active");
    expect(useUiStore.getState().transformStage).toBe("selection");
  });

  it("enters move stage without dragging", () => {
    useUiStore.setState({
      interactionState: "active",
      selectedObjectId: "amber-box",
      transformStage: "selection",
    });

    useUiStore.getState().beginMoveMode();

    expect(useUiStore.getState().axisMagnetTarget).toBeNull();
    expect(useUiStore.getState().interactionMode).toBe("move");
    expect(useUiStore.getState().interactionState).toBe("active");
    expect(useUiStore.getState().selectedObjectId).toBe("amber-box");
    expect(useUiStore.getState().transformStage).toBe("move");
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
      transformStage: "move",
    });

    useUiStore.getState().completeMoveDrag();

    expect(useUiStore.getState().axisMagnetTarget).toBeNull();
    expect(useUiStore.getState().interactionState).toBe("idle");
    expect(useUiStore.getState().selectedObjectId).toBeNull();
    expect(useUiStore.getState().transformStage).toBe("idle");
  });

  it("enters rotate stage without dragging", () => {
    useUiStore.setState({
      interactionState: "active",
      selectedObjectId: "amber-box",
      transformStage: "selection",
    });

    useUiStore.getState().beginRotateMode();

    expect(useUiStore.getState().axisMagnetTarget).toBeNull();
    expect(useUiStore.getState().interactionMode).toBe("rotate");
    expect(useUiStore.getState().interactionState).toBe("active");
    expect(useUiStore.getState().selectedObjectId).toBe("amber-box");
    expect(useUiStore.getState().transformStage).toBe("rotate");
  });

  it("clears selection and returns to idle", () => {
    useUiStore.setState({
      axisMagnetTarget: {
        axis: "z",
        direction: "negative",
        objectId: "amber-box",
      },
      interactionMode: "move",
      interactionState: "active",
      selectedObjectId: "amber-box",
      transformStage: "move",
    });

    useUiStore.getState().clearSelection();

    expect(useUiStore.getState().axisMagnetTarget).toBeNull();
    expect(useUiStore.getState().interactionState).toBe("idle");
    expect(useUiStore.getState().selectedObjectId).toBeNull();
    expect(useUiStore.getState().transformStage).toBe("idle");
  });

  it("clears an active axis magnet when surface snapping changes", () => {
    useUiStore.setState({
      axisMagnetTarget: {
        axis: "z",
        direction: "negative",
        objectId: "amber-box",
      },
    });

    useUiStore.getState().setSurfaceSnapEnabled(true);

    expect(useUiStore.getState().surfaceSnapEnabled).toBe(true);
    expect(useUiStore.getState().axisMagnetTarget).toBeNull();
  });
});
