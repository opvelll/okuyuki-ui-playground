import { render } from "@testing-library/react";
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
});
