import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultPersistedUiState, useUiStore } from "./uiStore";

describe("uiStore auto rotate workflow", () => {
  beforeEach(() => {
    useUiStore.persist.clearStorage();
    useUiStore.setState({
      ...createDefaultPersistedUiState(),
      autoRotateWorkflowObjectId: null,
      axisMagnetTarget: null,
      interactionState: "idle",
      selectedObjectId: null,
    });
  });

  it("keeps the selected object active and returns to move after completion", () => {
    useUiStore.getState().beginAutoRotateWorkflow("object-1");

    expect(useUiStore.getState().interactionMode).toBe("rotate");
    expect(useUiStore.getState().selectedObjectId).toBe("object-1");
    expect(useUiStore.getState().autoRotateWorkflowObjectId).toBe("object-1");

    useUiStore.getState().completeAutoRotateWorkflow();

    expect(useUiStore.getState().interactionMode).toBe("move");
    expect(useUiStore.getState().selectedObjectId).toBe("object-1");
    expect(useUiStore.getState().interactionState).toBe("active");
    expect(useUiStore.getState().autoRotateWorkflowObjectId).toBeNull();
  });

  it("clears selection and returns to move when the workflow is cancelled", () => {
    useUiStore.getState().beginAutoRotateWorkflow("object-1");

    useUiStore.getState().clearSelection();

    expect(useUiStore.getState().interactionMode).toBe("move");
    expect(useUiStore.getState().selectedObjectId).toBeNull();
    expect(useUiStore.getState().interactionState).toBe("idle");
    expect(useUiStore.getState().autoRotateWorkflowObjectId).toBeNull();
  });
});
