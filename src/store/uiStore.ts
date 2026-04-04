import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
export type SettingsMenu = "general" | "physics" | "move-ui";
export type PhysicsRigidBodyType = "dynamic" | "fixed" | "kinematicPosition";
export type AxisMagnetTarget = {
  axis: "x" | "y" | "z";
  direction: "negative" | "positive";
  objectId: string;
};

type PersistedUiState = {
  floorFriction: number;
  floorRestitution: number;
  gravityY: number;
  moveDepthWheelDirection: MoveDepthWheelDirection;
  moveDepthWheelStep: number;
  moveGridSnapStep: number;
  moveOverlayDisplayMode: MoveOverlayDisplayMode;
  moveOverlayOrientationMode: MoveOverlayOrientationMode;
  moveOverlayRadiusMultiplier: number;
  movePrecisionStep: number;
  objectAngularDamping: number;
  objectFriction: number;
  objectLinearDamping: number;
  objectRestitution: number;
  physicsEnabled: boolean;
  physicsRigidBodyType: PhysicsRigidBodyType;
  selectedSettingsMenu: SettingsMenu;
  settingsOpen: boolean;
  suppressObjectRotation: boolean;
};

type UiState = PersistedUiState & {
  axisMagnetTarget: AxisMagnetTarget | null;
  interactionState: InteractionState;
  selectedObjectId: string | null;
  clearSelection: () => void;
  selectObject: (objectId: string) => void;
  setAxisMagnetTarget: (target: AxisMagnetTarget | null) => void;
  setFloorFriction: (value: number) => void;
  setFloorRestitution: (value: number) => void;
  setGravityY: (value: number) => void;
  setInteractionState: (state: InteractionState) => void;
  setMoveDepthWheelDirection: (direction: MoveDepthWheelDirection) => void;
  setMoveDepthWheelStep: (step: number) => void;
  setMoveGridSnapStep: (step: number) => void;
  setMoveOverlayDisplayMode: (mode: MoveOverlayDisplayMode) => void;
  setMoveOverlayOrientationMode: (mode: MoveOverlayOrientationMode) => void;
  setMoveOverlayRadiusMultiplier: (multiplier: number) => void;
  setMovePrecisionStep: (step: number) => void;
  setObjectAngularDamping: (value: number) => void;
  setObjectFriction: (value: number) => void;
  setObjectLinearDamping: (value: number) => void;
  setObjectRestitution: (value: number) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  setPhysicsRigidBodyType: (value: PhysicsRigidBodyType) => void;
  setSelectedSettingsMenu: (menu: SettingsMenu) => void;
  setSettingsOpen: (open: boolean) => void;
  setSuppressObjectRotation: (value: boolean) => void;
};

export const UI_STORE_PERSIST_KEY = "naname-ui-settings";

export const createDefaultPersistedUiState = (): PersistedUiState => ({
  floorFriction: 1.1,
  floorRestitution: 0,
  gravityY: -9.81,
  moveDepthWheelDirection: "normal",
  moveDepthWheelStep: 0.24,
  moveGridSnapStep: 0.5,
  moveOverlayDisplayMode: "mode-1",
  moveOverlayOrientationMode: "camera-facing",
  moveOverlayRadiusMultiplier: 1.15,
  movePrecisionStep: 0.1,
  objectAngularDamping: 0.9,
  objectFriction: 0.9,
  objectLinearDamping: 0.45,
  objectRestitution: 0.02,
  physicsEnabled: true,
  physicsRigidBodyType: "dynamic",
  selectedSettingsMenu: "general",
  settingsOpen: true,
  suppressObjectRotation: false,
});

const createInitialUiState = (): Omit<
  UiState,
  | "clearSelection"
  | "selectObject"
  | "setAxisMagnetTarget"
  | "setFloorFriction"
  | "setFloorRestitution"
  | "setGravityY"
  | "setInteractionState"
  | "setMoveDepthWheelDirection"
  | "setMoveDepthWheelStep"
  | "setMoveGridSnapStep"
  | "setMoveOverlayDisplayMode"
  | "setMoveOverlayOrientationMode"
  | "setMoveOverlayRadiusMultiplier"
  | "setMovePrecisionStep"
  | "setObjectAngularDamping"
  | "setObjectFriction"
  | "setObjectLinearDamping"
  | "setObjectRestitution"
  | "setPhysicsEnabled"
  | "setPhysicsRigidBodyType"
  | "setSelectedSettingsMenu"
  | "setSettingsOpen"
  | "setSuppressObjectRotation"
> => ({
  ...createDefaultPersistedUiState(),
  axisMagnetTarget: null,
  interactionState: "idle",
  selectedObjectId: null,
});

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      ...createInitialUiState(),
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
      setFloorFriction: (value) => set({ floorFriction: value }),
      setFloorRestitution: (value) => set({ floorRestitution: value }),
      setGravityY: (value) => set({ gravityY: value }),
      setInteractionState: (state) => set({ interactionState: state }),
      setMoveDepthWheelDirection: (direction) =>
        set({ moveDepthWheelDirection: direction }),
      setMoveDepthWheelStep: (step) => set({ moveDepthWheelStep: step }),
      setMoveGridSnapStep: (step) => set({ moveGridSnapStep: step }),
      setMoveOverlayDisplayMode: (mode) =>
        set({ moveOverlayDisplayMode: mode }),
      setMoveOverlayOrientationMode: (mode) =>
        set({ moveOverlayOrientationMode: mode }),
      setMoveOverlayRadiusMultiplier: (multiplier) =>
        set({ moveOverlayRadiusMultiplier: multiplier }),
      setMovePrecisionStep: (step) => set({ movePrecisionStep: step }),
      setObjectAngularDamping: (value) => set({ objectAngularDamping: value }),
      setObjectFriction: (value) => set({ objectFriction: value }),
      setObjectLinearDamping: (value) => set({ objectLinearDamping: value }),
      setObjectRestitution: (value) => set({ objectRestitution: value }),
      setPhysicsEnabled: (enabled) =>
        set({
          axisMagnetTarget: null,
          interactionState: "idle",
          physicsEnabled: enabled,
          selectedObjectId: null,
        }),
      setPhysicsRigidBodyType: (value) => set({ physicsRigidBodyType: value }),
      setSelectedSettingsMenu: (menu) => set({ selectedSettingsMenu: menu }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setSuppressObjectRotation: (value) =>
        set({ suppressObjectRotation: value }),
    }),
    {
      name: UI_STORE_PERSIST_KEY,
      partialize: (state) => ({
        floorFriction: state.floorFriction,
        floorRestitution: state.floorRestitution,
        gravityY: state.gravityY,
        moveDepthWheelDirection: state.moveDepthWheelDirection,
        moveDepthWheelStep: state.moveDepthWheelStep,
        moveGridSnapStep: state.moveGridSnapStep,
        moveOverlayDisplayMode: state.moveOverlayDisplayMode,
        moveOverlayOrientationMode: state.moveOverlayOrientationMode,
        moveOverlayRadiusMultiplier: state.moveOverlayRadiusMultiplier,
        movePrecisionStep: state.movePrecisionStep,
        objectAngularDamping: state.objectAngularDamping,
        objectFriction: state.objectFriction,
        objectLinearDamping: state.objectLinearDamping,
        objectRestitution: state.objectRestitution,
        physicsEnabled: state.physicsEnabled,
        physicsRigidBodyType: state.physicsRigidBodyType,
        selectedSettingsMenu: state.selectedSettingsMenu,
        settingsOpen: state.settingsOpen,
        suppressObjectRotation: state.suppressObjectRotation,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
