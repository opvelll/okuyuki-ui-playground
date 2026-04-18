import { useEffect } from "react";
import { useModelingStore } from "../store/modelingStore";
import { useUiStore } from "../store/uiStore";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

export function ModelingToolHotkeys() {
  const modelingTool = useUiStore((state) => state.modelingTool);
  const setModelingCameraOverride = useUiStore(
    (state) => state.setModelingCameraOverride,
  );
  const connectSelectedVerticesAsEdge = useModelingStore(
    (state) => state.connectSelectedVerticesAsEdge,
  );
  const createFaceFromSelectedVertices = useModelingStore(
    (state) => state.createFaceFromSelectedVertices,
  );
  const redo = useModelingStore((state) => state.redo);
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
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.code === "KeyY") {
        event.preventDefault();
        redo();
        return;
      }

      if (event.code === "KeyE") {
        event.preventDefault();
        connectSelectedVerticesAsEdge();
        return;
      }

      if (event.code === "KeyF") {
        event.preventDefault();
        createFaceFromSelectedVertices();
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
    connectSelectedVerticesAsEdge,
    createFaceFromSelectedVertices,
    modelingTool,
    redo,
    setModelingCameraOverride,
    undo,
  ]);

  return null;
}
