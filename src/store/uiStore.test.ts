import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultPersistedUiState, useUiStore } from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({
      ...createDefaultPersistedUiState(),
      axisMagnetTarget: null,
      interactionState: "idle",
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
});
