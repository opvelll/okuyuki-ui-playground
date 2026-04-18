import { useEffect } from "react";
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.code !== "Space" || modelingTool !== "pointer") {
        return;
      }

      event.preventDefault();
      setModelingCameraOverride(true);
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
  }, [modelingTool, setModelingCameraOverride]);

  return null;
}
