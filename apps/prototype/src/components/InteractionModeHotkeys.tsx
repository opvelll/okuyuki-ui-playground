import { useEffect } from "react";
import { isEditableTarget } from "../lib/isEditableTarget";
import { useUiStore } from "../store/uiStore";

export function InteractionModeHotkeys() {
  const setInteractionMode = useUiStore((state) => state.setInteractionMode);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setInteractionMode("move");
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        setInteractionMode("rotate");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setInteractionMode]);

  return null;
}
