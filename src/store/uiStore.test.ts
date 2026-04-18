import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultPersistedUiState, useUiStore } from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({
      ...createDefaultPersistedUiState(),
      axisMagnetTarget: null,
      interactionState: "idle",
      modelingPointer: {
        depth: 8,
        hovered: false,
        plane: "none",
        position: [0, 0, 0],
      },
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
});
