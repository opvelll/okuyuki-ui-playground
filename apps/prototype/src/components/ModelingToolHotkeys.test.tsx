import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useModelingStore } from "../store/modelingStore";
import {
  DEFAULT_MODELING_CAMERA,
  DEFAULT_PROTOTYPE_CAMERA,
  createDefaultPersistedUiState,
  useUiStore,
} from "../store/uiStore";
import { ModelingToolHotkeys } from "./ModelingToolHotkeys";

describe("ModelingToolHotkeys", () => {
  beforeEach(() => {
    useModelingStore.getState().resetModeling();
    useUiStore.setState({
      ...createDefaultPersistedUiState(),
      modelingCamera: DEFAULT_MODELING_CAMERA,
      modelingCameraDragging: false,
      modelingCameraOverride: false,
      modelingLassoSelection: {
        phase: "idle",
        points: [],
      },
      modelingTool: "lasso",
      prototypeCamera: DEFAULT_PROTOTYPE_CAMERA,
    });
  });

  it("deletes selected vertices with the Delete key", async () => {
    const user = userEvent.setup();

    render(<ModelingToolHotkeys />);

    useModelingStore.getState().addVertex([0, 0, 0]);
    expect(useModelingStore.getState().selectedVertexIds).toEqual(["vertex-1"]);

    await user.keyboard("{Delete}");

    const state = useModelingStore.getState();
    const currentModel = state.modelsById[state.currentModelId];

    expect(currentModel.vertexOrder).toEqual([]);
    expect(state.selectedVertexIds).toEqual([]);
  });

  it("selects all vertices with Ctrl+A", () => {
    render(<ModelingToolHotkeys />);

    const vertexA = useModelingStore.getState().addVertex([0, 0, 0]);
    const vertexB = useModelingStore.getState().addVertex([1, 0, 0]);
    const vertexC = useModelingStore.getState().addVertex([2, 0, 0]);
    useModelingStore.getState().selectVertex(vertexB?.id ?? "", false);

    fireEvent.keyDown(window, { code: "KeyA", ctrlKey: true });

    expect(useModelingStore.getState().selectedVertexIds).toEqual([
      vertexA?.id,
      vertexB?.id,
      vertexC?.id,
    ]);
  });

  it("switches move and rotate tools with M and R", () => {
    render(<ModelingToolHotkeys />);

    fireEvent.keyDown(window, { code: "KeyM" });
    expect(useUiStore.getState().modelingTool).toBe("move");

    fireEvent.keyDown(window, { code: "KeyR" });
    expect(useUiStore.getState().modelingTool).toBe("rotate");
  });
});
