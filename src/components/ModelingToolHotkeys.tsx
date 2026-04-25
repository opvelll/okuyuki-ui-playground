import { useEffect } from "react";
import { isEditableTarget } from "../lib/isEditableTarget";
import { useModelingStore } from "../store/modelingStore";
import { useUiStore } from "../store/uiStore";

export function ModelingToolHotkeys() {
  const modelingTool = useUiStore((state) => state.modelingTool);
  const setModelingCameraOverride = useUiStore(
    (state) => state.setModelingCameraOverride,
  );
  const clearActivePenStroke = useUiStore(
    (state) => state.clearActivePenStroke,
  );
  const connectSelectedVerticesAsEdge = useModelingStore(
    (state) => state.connectSelectedVerticesAsEdge,
  );
  const createFaceFromSelectedVertices = useModelingStore(
    (state) => state.createFaceFromSelectedVertices,
  );
  const deleteSelectedVertices = useModelingStore(
    (state) => state.deleteSelectedVertices,
  );
  const redo = useModelingStore((state) => state.redo);
  const selectVertices = useModelingStore((state) => state.selectVertices);
  const undo = useModelingStore((state) => state.undo);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.code === "KeyZ") {
        event.preventDefault();
        clearActivePenStroke();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.code === "KeyY") {
        event.preventDefault();
        clearActivePenStroke();
        redo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.code === "KeyA") {
        event.preventDefault();
        clearActivePenStroke();
        const state = useModelingStore.getState();
        const currentModel = state.modelsById[state.currentModelId];
        selectVertices(currentModel?.vertexOrder ?? [], false);
        return;
      }

      if (event.code === "KeyE") {
        event.preventDefault();
        clearActivePenStroke();
        connectSelectedVerticesAsEdge();
        return;
      }

      if (event.code === "KeyF") {
        event.preventDefault();
        clearActivePenStroke();
        createFaceFromSelectedVertices();
        return;
      }

      if (event.code === "Delete" || event.code === "Backspace") {
        event.preventDefault();
        clearActivePenStroke();
        deleteSelectedVertices();
        return;
      }

      if (event.code === "Space" && modelingTool !== "camera") {
        event.preventDefault();
        setModelingCameraOverride(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      setModelingCameraOverride(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      setModelingCameraOverride(false);
    };
  }, [
    clearActivePenStroke,
    connectSelectedVerticesAsEdge,
    createFaceFromSelectedVertices,
    deleteSelectedVertices,
    modelingTool,
    redo,
    selectVertices,
    setModelingCameraOverride,
    undo,
  ]);

  return null;
}
