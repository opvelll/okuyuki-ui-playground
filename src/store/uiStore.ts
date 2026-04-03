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
export type AxisMagnetTarget = {
  axis: "x" | "y" | "z";
  direction: "negative" | "positive";
  objectId: string;
};

type UiState = {
  axisMagnetTarget: AxisMagnetTarget | null;
  interactionState: InteractionState;
  physicsEnabled: boolean;
  moveDepthWheelDirection: MoveDepthWheelDirection;
  moveGridSnapStep: number;
  moveOverlayDisplayMode: MoveOverlayDisplayMode;
  moveOverlayOrientationMode: MoveOverlayOrientationMode;
  movePrecisionStep: number;
  moveOverlayRadiusMultiplier: number;
  moveDepthWheelStep: number;
  moveMode: MoveMode;
  selectedObjectId: string | null;
  settingsOpen: boolean;
  clearAxisMagnetTarget: () => void;
  clearSelection: () => void;
  selectObject: (objectId: string) => void;
  setAxisMagnetTarget: (target: AxisMagnetTarget | null) => void;
  setInteractionState: (state: InteractionState) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  setMoveDepthWheelDirection: (direction: MoveDepthWheelDirection) => void;
  setMoveGridSnapStep: (step: number) => void;
  setMoveOverlayDisplayMode: (mode: MoveOverlayDisplayMode) => void;
  setMoveOverlayOrientationMode: (mode: MoveOverlayOrientationMode) => void;
  setMovePrecisionStep: (step: number) => void;
  setMoveOverlayRadiusMultiplier: (multiplier: number) => void;
  setMoveDepthWheelStep: (step: number) => void;
  setMoveMode: (mode: MoveMode) => void;
  toggleSettingsOpen: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  axisMagnetTarget: null,
  interactionState: "idle",
  physicsEnabled: true,
  moveDepthWheelDirection: "normal",
  moveGridSnapStep: 0.5,
  moveOverlayDisplayMode: "mode-1",
  moveOverlayOrientationMode: "camera-facing",
  movePrecisionStep: 0.1,
  moveOverlayRadiusMultiplier: 1.15,
  moveDepthWheelStep: 0.24,
  moveMode: "screen-depth-drag",
  selectedObjectId: null,
  settingsOpen: true,
  clearAxisMagnetTarget: () => set({ axisMagnetTarget: null }),
  clearSelection: () =>
    set({
      axisMagnetTarget: null,
      interactionState: "idle",
      selectedObjectId: null,
    }),
  selectObject: (objectId) =>
    set({
      axisMagnetTarget: null,
      interactionState: "active",
      selectedObjectId: objectId,
    }),
  setAxisMagnetTarget: (target) => set({ axisMagnetTarget: target }),
  setInteractionState: (state) => set({ interactionState: state }),
  setPhysicsEnabled: (enabled) =>
    set({
      axisMagnetTarget: null,
      interactionState: "idle",
      physicsEnabled: enabled,
      selectedObjectId: null,
    }),
  setMoveDepthWheelDirection: (direction) =>
    set({ moveDepthWheelDirection: direction }),
  setMoveGridSnapStep: (step) => set({ moveGridSnapStep: step }),
  setMoveOverlayDisplayMode: (mode) => set({ moveOverlayDisplayMode: mode }),
  setMoveOverlayOrientationMode: (mode) =>
    set({ moveOverlayOrientationMode: mode }),
  setMovePrecisionStep: (step) => set({ movePrecisionStep: step }),
  setMoveOverlayRadiusMultiplier: (multiplier) =>
    set({ moveOverlayRadiusMultiplier: multiplier }),
  setMoveDepthWheelStep: (step) => set({ moveDepthWheelStep: step }),
  setMoveMode: (mode) => set({ moveMode: mode }),
  toggleSettingsOpen: () =>
    set((state) => ({ settingsOpen: !state.settingsOpen })),
}));
