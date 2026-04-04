import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type MoveDepthWheelDirection = "normal" | "inverted";
export type InteractionState = "idle" | "active" | "dragging";
export type InteractionMode = "move" | "rotate";
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
export type RotateWheelDirection = "normal" | "reverse";
export type RotateTwistAxis = "+x" | "+y" | "+z";
export type SettingsMenu = "general" | "physics" | "move-ui" | "rotate-ui";
export type PhysicsRigidBodyType = "dynamic" | "fixed" | "kinematicPosition";
export type AxisMagnetTarget = {
  axis: "x" | "y" | "z";
  direction: "negative" | "positive";
  objectId: string;
};

type PersistedUiState = {
  floorFriction: number;
  floorColor: string;
  gridMajorColor: string;
  gridMinorColor: string;
  floorRestitution: number;
  gravityY: number;
  moveDepthWheelDirection: MoveDepthWheelDirection;
  moveDepthWheelStep: number;
  moveGridSnapStep: number;
  moveOverlayDisplayMode: MoveOverlayDisplayMode;
  moveOverlayOrientationMode: MoveOverlayOrientationMode;
  moveOverlayRadiusMultiplier: number;
  movePrecisionStep: number;
  moveVerticalDropGuide: boolean;
  objectAngularDamping: number;
  objectFriction: number;
  objectLinearDamping: number;
  objectRestitution: number;
  physicsEnabled: boolean;
  physicsRigidBodyType: PhysicsRigidBodyType;
  fogColor: string;
  generalSelectionOutlineColor: string;
  generalSelectionOutlineThickness: number;
  sceneBackgroundColor: string;
  rotateGizmoRingColor: string;
  rotateGizmoSphereColor: string;
  rotateArcballSensitivity: number;
  rotateTwistAxis: RotateTwistAxis;
  rotateUiOpacity: number;
  rotateUiRadiusPx: number;
  rotateWheelDirection: RotateWheelDirection;
  rotateWheelRotateStepDeg: number;
  selectedSettingsMenu: SettingsMenu;
  showFps: boolean;
  settingsOpen: boolean;
  suppressObjectRotation: boolean;
  interactionMode: InteractionMode;
};

type UiState = PersistedUiState & {
  axisMagnetTarget: AxisMagnetTarget | null;
  interactionState: InteractionState;
  selectedObjectId: string | null;
  clearSelection: () => void;
  selectObject: (objectId: string) => void;
  setAxisMagnetTarget: (target: AxisMagnetTarget | null) => void;
  setFloorFriction: (value: number) => void;
  setFloorColor: (value: string) => void;
  setFloorRestitution: (value: number) => void;
  setGravityY: (value: number) => void;
  setGridMajorColor: (value: string) => void;
  setGridMinorColor: (value: string) => void;
  setInteractionState: (state: InteractionState) => void;
  setMoveDepthWheelDirection: (direction: MoveDepthWheelDirection) => void;
  setMoveDepthWheelStep: (step: number) => void;
  setMoveGridSnapStep: (step: number) => void;
  setMoveOverlayDisplayMode: (mode: MoveOverlayDisplayMode) => void;
  setMoveOverlayOrientationMode: (mode: MoveOverlayOrientationMode) => void;
  setMoveOverlayRadiusMultiplier: (multiplier: number) => void;
  setMovePrecisionStep: (step: number) => void;
  setMoveVerticalDropGuide: (value: boolean) => void;
  setObjectAngularDamping: (value: number) => void;
  setObjectFriction: (value: number) => void;
  setObjectLinearDamping: (value: number) => void;
  setObjectRestitution: (value: number) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  setPhysicsRigidBodyType: (value: PhysicsRigidBodyType) => void;
  setFogColor: (value: string) => void;
  setGeneralSelectionOutlineColor: (value: string) => void;
  setGeneralSelectionOutlineThickness: (value: number) => void;
  setSceneBackgroundColor: (value: string) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setRotateGizmoRingColor: (value: string) => void;
  setRotateGizmoSphereColor: (value: string) => void;
  setRotateArcballSensitivity: (value: number) => void;
  setRotateTwistAxis: (axis: RotateTwistAxis) => void;
  setRotateUiOpacity: (value: number) => void;
  setRotateUiRadiusPx: (value: number) => void;
  setRotateWheelDirection: (direction: RotateWheelDirection) => void;
  setRotateWheelRotateStepDeg: (value: number) => void;
  setSelectedSettingsMenu: (menu: SettingsMenu) => void;
  setShowFps: (value: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSuppressObjectRotation: (value: boolean) => void;
};

export const UI_STORE_PERSIST_KEY = "naname-ui-settings";

export const createDefaultPersistedUiState = (): PersistedUiState => ({
  floorFriction: 1.1,
  floorColor: "#d9dee7",
  gridMajorColor: "#8d99ae",
  gridMinorColor: "#c5cedb",
  floorRestitution: 0,
  fogColor: "#dbe7f3",
  generalSelectionOutlineColor: "#f8fafc",
  generalSelectionOutlineThickness: 4,
  gravityY: -9.81,
  moveDepthWheelDirection: "normal",
  moveDepthWheelStep: 0.24,
  moveGridSnapStep: 0.5,
  moveOverlayDisplayMode: "mode-1",
  moveOverlayOrientationMode: "camera-facing",
  moveOverlayRadiusMultiplier: 1.15,
  movePrecisionStep: 0.1,
  moveVerticalDropGuide: true,
  objectAngularDamping: 0.9,
  objectFriction: 0.9,
  objectLinearDamping: 0.45,
  objectRestitution: 0.02,
  physicsEnabled: true,
  physicsRigidBodyType: "dynamic",
  sceneBackgroundColor: "#dbe7f3",
  rotateGizmoRingColor: "#7dd3fc",
  rotateGizmoSphereColor: "#7dd3fc",
  rotateArcballSensitivity: 1,
  rotateTwistAxis: "+y",
  rotateUiOpacity: 1.2,
  rotateUiRadiusPx: 140,
  rotateWheelDirection: "reverse",
  rotateWheelRotateStepDeg: 16,
  selectedSettingsMenu: "general",
  showFps: true,
  settingsOpen: true,
  suppressObjectRotation: false,
  interactionMode: "move",
});

const createInitialUiState = (): Omit<
  UiState,
  | "clearSelection"
  | "selectObject"
  | "setAxisMagnetTarget"
  | "setFloorFriction"
  | "setFloorColor"
  | "setFloorRestitution"
  | "setGravityY"
  | "setGridMajorColor"
  | "setGridMinorColor"
  | "setInteractionState"
  | "setMoveDepthWheelDirection"
  | "setMoveDepthWheelStep"
  | "setMoveGridSnapStep"
  | "setMoveOverlayDisplayMode"
  | "setMoveOverlayOrientationMode"
  | "setMoveOverlayRadiusMultiplier"
  | "setMovePrecisionStep"
  | "setMoveVerticalDropGuide"
  | "setObjectAngularDamping"
  | "setObjectFriction"
  | "setObjectLinearDamping"
  | "setObjectRestitution"
  | "setPhysicsEnabled"
  | "setPhysicsRigidBodyType"
  | "setFogColor"
  | "setGeneralSelectionOutlineColor"
  | "setGeneralSelectionOutlineThickness"
  | "setSceneBackgroundColor"
  | "setInteractionMode"
  | "setRotateGizmoRingColor"
  | "setRotateGizmoSphereColor"
  | "setRotateArcballSensitivity"
  | "setRotateTwistAxis"
  | "setRotateUiOpacity"
  | "setRotateUiRadiusPx"
  | "setRotateWheelDirection"
  | "setRotateWheelRotateStepDeg"
  | "setSelectedSettingsMenu"
  | "setShowFps"
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
      setFloorColor: (value) => set({ floorColor: value }),
      setFloorRestitution: (value) => set({ floorRestitution: value }),
      setGridMajorColor: (value) => set({ gridMajorColor: value }),
      setGridMinorColor: (value) => set({ gridMinorColor: value }),
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
      setMoveVerticalDropGuide: (value) =>
        set({ moveVerticalDropGuide: value }),
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
      setFogColor: (value) => set({ fogColor: value }),
      setGeneralSelectionOutlineColor: (value) =>
        set({ generalSelectionOutlineColor: value }),
      setGeneralSelectionOutlineThickness: (value) =>
        set({ generalSelectionOutlineThickness: value }),
      setSceneBackgroundColor: (value) => set({ sceneBackgroundColor: value }),
      setInteractionMode: (mode) =>
        set((state) => ({
          axisMagnetTarget: null,
          interactionMode: mode,
          interactionState: state.selectedObjectId ? "active" : "idle",
        })),
      setRotateGizmoRingColor: (value) => set({ rotateGizmoRingColor: value }),
      setRotateGizmoSphereColor: (value) =>
        set({ rotateGizmoSphereColor: value }),
      setRotateArcballSensitivity: (value) =>
        set({ rotateArcballSensitivity: value }),
      setRotateTwistAxis: (axis) => set({ rotateTwistAxis: axis }),
      setRotateUiOpacity: (value) => set({ rotateUiOpacity: value }),
      setRotateUiRadiusPx: (value) => set({ rotateUiRadiusPx: value }),
      setRotateWheelDirection: (direction) =>
        set({ rotateWheelDirection: direction }),
      setRotateWheelRotateStepDeg: (value) =>
        set({ rotateWheelRotateStepDeg: value }),
      setSelectedSettingsMenu: (menu) => set({ selectedSettingsMenu: menu }),
      setShowFps: (value) => set({ showFps: value }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setSuppressObjectRotation: (value) =>
        set({ suppressObjectRotation: value }),
    }),
    {
      name: UI_STORE_PERSIST_KEY,
      partialize: (state) => ({
        floorFriction: state.floorFriction,
        floorColor: state.floorColor,
        gridMajorColor: state.gridMajorColor,
        gridMinorColor: state.gridMinorColor,
        floorRestitution: state.floorRestitution,
        fogColor: state.fogColor,
        generalSelectionOutlineColor: state.generalSelectionOutlineColor,
        generalSelectionOutlineThickness:
          state.generalSelectionOutlineThickness,
        gravityY: state.gravityY,
        moveDepthWheelDirection: state.moveDepthWheelDirection,
        moveDepthWheelStep: state.moveDepthWheelStep,
        moveGridSnapStep: state.moveGridSnapStep,
        moveOverlayDisplayMode: state.moveOverlayDisplayMode,
        moveOverlayOrientationMode: state.moveOverlayOrientationMode,
        moveOverlayRadiusMultiplier: state.moveOverlayRadiusMultiplier,
        movePrecisionStep: state.movePrecisionStep,
        moveVerticalDropGuide: state.moveVerticalDropGuide,
        objectAngularDamping: state.objectAngularDamping,
        objectFriction: state.objectFriction,
        objectLinearDamping: state.objectLinearDamping,
        objectRestitution: state.objectRestitution,
        physicsEnabled: state.physicsEnabled,
        physicsRigidBodyType: state.physicsRigidBodyType,
        sceneBackgroundColor: state.sceneBackgroundColor,
        interactionMode: state.interactionMode,
        rotateGizmoRingColor: state.rotateGizmoRingColor,
        rotateGizmoSphereColor: state.rotateGizmoSphereColor,
        rotateArcballSensitivity: state.rotateArcballSensitivity,
        rotateTwistAxis: state.rotateTwistAxis,
        rotateUiOpacity: state.rotateUiOpacity,
        rotateUiRadiusPx: state.rotateUiRadiusPx,
        rotateWheelDirection: state.rotateWheelDirection,
        rotateWheelRotateStepDeg: state.rotateWheelRotateStepDeg,
        selectedSettingsMenu: state.selectedSettingsMenu,
        showFps: state.showFps,
        settingsOpen: state.settingsOpen,
        suppressObjectRotation: state.suppressObjectRotation,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
