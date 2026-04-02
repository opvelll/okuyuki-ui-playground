import { create } from "zustand";

export type MoveMode = "screen-depth-drag";
export type MoveDepthWheelDirection = "normal" | "inverted";
export type InteractionState = "idle" | "active" | "dragging";

type UiState = {
  interactionState: InteractionState;
  physicsEnabled: boolean;
  moveDepthWheelDirection: MoveDepthWheelDirection;
  moveDepthWheelStep: number;
  moveMode: MoveMode;
  selectedObjectId: string | null;
  settingsOpen: boolean;
  clearSelection: () => void;
  selectObject: (objectId: string) => void;
  setInteractionState: (state: InteractionState) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  setMoveDepthWheelDirection: (direction: MoveDepthWheelDirection) => void;
  setMoveDepthWheelStep: (step: number) => void;
  setMoveMode: (mode: MoveMode) => void;
  toggleSettingsOpen: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  interactionState: "idle",
  physicsEnabled: true,
  moveDepthWheelDirection: "normal",
  moveDepthWheelStep: 0.24,
  moveMode: "screen-depth-drag",
  selectedObjectId: null,
  settingsOpen: true,
  clearSelection: () =>
    set({
      interactionState: "idle",
      selectedObjectId: null,
    }),
  selectObject: (objectId) =>
    set({
      interactionState: "active",
      selectedObjectId: objectId,
    }),
  setInteractionState: (state) => set({ interactionState: state }),
  setPhysicsEnabled: (enabled) =>
    set({
      interactionState: "idle",
      physicsEnabled: enabled,
      selectedObjectId: null,
    }),
  setMoveDepthWheelDirection: (direction) =>
    set({ moveDepthWheelDirection: direction }),
  setMoveDepthWheelStep: (step) => set({ moveDepthWheelStep: step }),
  setMoveMode: (mode) => set({ moveMode: mode }),
  toggleSettingsOpen: () =>
    set((state) => ({ settingsOpen: !state.settingsOpen })),
}));
