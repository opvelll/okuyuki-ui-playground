import { create } from "zustand";

export type MoveMode = "screen-depth-drag";
export type MoveDepthWheelDirection = "normal" | "inverted";
export type InteractionState = "idle" | "active" | "dragging";
export type MoveOverlayOrientationMode =
  | "camera-facing"
  | "screen-vertical"
  | "screen-horizontal";
export type MoveOverlayDisplayMode =
  | "mode-1"
  | "mode-2"
  | "mode-3"
  | "modes-2-3"
  | "modes-1-2-3";

type UiState = {
  interactionState: InteractionState;
  physicsEnabled: boolean;
  moveDepthWheelDirection: MoveDepthWheelDirection;
  moveOverlayDisplayMode: MoveOverlayDisplayMode;
  moveOverlayOrientationMode: MoveOverlayOrientationMode;
  moveOverlayRadiusMultiplier: number;
  moveDepthWheelStep: number;
  moveMode: MoveMode;
  selectedObjectId: string | null;
  settingsOpen: boolean;
  clearSelection: () => void;
  selectObject: (objectId: string) => void;
  setInteractionState: (state: InteractionState) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  setMoveDepthWheelDirection: (direction: MoveDepthWheelDirection) => void;
  setMoveOverlayDisplayMode: (mode: MoveOverlayDisplayMode) => void;
  setMoveOverlayOrientationMode: (mode: MoveOverlayOrientationMode) => void;
  setMoveOverlayRadiusMultiplier: (multiplier: number) => void;
  setMoveDepthWheelStep: (step: number) => void;
  setMoveMode: (mode: MoveMode) => void;
  toggleSettingsOpen: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  interactionState: "idle",
  physicsEnabled: true,
  moveDepthWheelDirection: "normal",
  moveOverlayDisplayMode: "mode-1",
  moveOverlayOrientationMode: "camera-facing",
  moveOverlayRadiusMultiplier: 1.15,
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
  setMoveOverlayDisplayMode: (mode) => set({ moveOverlayDisplayMode: mode }),
  setMoveOverlayOrientationMode: (mode) =>
    set({ moveOverlayOrientationMode: mode }),
  setMoveOverlayRadiusMultiplier: (multiplier) =>
    set({ moveOverlayRadiusMultiplier: multiplier }),
  setMoveDepthWheelStep: (step) => set({ moveDepthWheelStep: step }),
  setMoveMode: (mode) => set({ moveMode: mode }),
  toggleSettingsOpen: () =>
    set((state) => ({ settingsOpen: !state.settingsOpen })),
}));
