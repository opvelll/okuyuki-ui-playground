import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type MoveDepthWheelDirection = "normal" | "inverted";
export type InteractionState = "idle" | "active" | "dragging";
export type InteractionMode = "move" | "rotate";
export type AppScreen = "prototype" | "modeling";
export type ModelingTool = "select" | "vertex" | "line" | "camera";
export type EffectiveModelingTool = "pointer" | "camera";
export type MoveAlwaysSnapMode = "off" | "axis-magnet" | "grid";
export type MoveAxisMagnetReferenceFrame = "local" | "world";
export type MoveGridSnapPattern = "xyz" | "xz";
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
export type RotateDragReleaseBehavior = "keep-selected" | "clear-selection";
export type SettingsMenu =
  | "general"
  | "physics"
  | "move-ui"
  | "rotate-ui"
  | "modeling-ui";
export type PhysicsRigidBodyType = "dynamic" | "fixed" | "kinematicPosition";
export type ModelingPointerPlane = "none" | "horizontal" | "vertical";
export type AxisMagnetTarget = {
  axis: "x" | "y" | "z";
  direction: "negative" | "positive";
  objectId: string;
};

export type ModelingPointerState = {
  depth: number;
  hovered: boolean;
  plane: ModelingPointerPlane;
  position: [number, number, number];
};

export type ModelingLinePreviewState = {
  active: boolean;
  currentPosition: [number, number, number];
  planeNormal: [number, number, number];
  startPosition: [number, number, number];
};

export type CameraSnapshot = {
  position: [number, number, number];
  target: [number, number, number];
};

type PersistedUiState = {
  currentScreen: AppScreen;
  floorFriction: number;
  floorColor: string;
  gridMajorColor: string;
  gridMinorColor: string;
  floorRestitution: number;
  gravityY: number;
  moveAlwaysSnapMode: MoveAlwaysSnapMode;
  moveAxisMagnetReferenceFrame: MoveAxisMagnetReferenceFrame;
  moveDepthWheelDirection: MoveDepthWheelDirection;
  moveDepthWheelStep: number;
  moveGridSnapPattern: MoveGridSnapPattern;
  moveGridSnapStep: number;
  moveOverlayDisplayMode: MoveOverlayDisplayMode;
  moveOverlayOrientationMode: MoveOverlayOrientationMode;
  moveOverlayRadiusMultiplier: number;
  movePrecisionStep: number;
  moveVerticalDropGuide: boolean;
  modelingPointerPanelRadius: number;
  modelingLineSnapDistance: number;
  modelingLineOverlayDisplayMode: MoveOverlayDisplayMode;
  modelingLineSnapEnabled: boolean;
  modelingPointerVerticalAxisFloorY: number;
  modelingPointerVisibleInCameraTool: boolean;
  modelingTool: ModelingTool;
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
  rotateDragReleaseBehavior: RotateDragReleaseBehavior;
  rotateAngleSnapStepDeg: number;
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
  modelingCamera: CameraSnapshot;
  modelingLinePreview: ModelingLinePreviewState;
  modelingPointer: ModelingPointerState;
  modelingCameraDragging: boolean;
  modelingCameraOverride: boolean;
  prototypeCamera: CameraSnapshot;
  selectedObjectId: string | null;
  completeMoveDrag: () => void;
  clearSelection: () => void;
  selectObject: (objectId: string) => void;
  setCurrentScreen: (screen: AppScreen) => void;
  setAxisMagnetTarget: (target: AxisMagnetTarget | null) => void;
  setFloorFriction: (value: number) => void;
  setFloorColor: (value: string) => void;
  setFloorRestitution: (value: number) => void;
  setGravityY: (value: number) => void;
  setGridMajorColor: (value: string) => void;
  setGridMinorColor: (value: string) => void;
  setMoveAlwaysSnapMode: (value: MoveAlwaysSnapMode) => void;
  setMoveAxisMagnetReferenceFrame: (
    value: MoveAxisMagnetReferenceFrame,
  ) => void;
  setInteractionState: (state: InteractionState) => void;
  setMoveDepthWheelDirection: (direction: MoveDepthWheelDirection) => void;
  setMoveDepthWheelStep: (step: number) => void;
  setMoveGridSnapPattern: (pattern: MoveGridSnapPattern) => void;
  setMoveGridSnapStep: (step: number) => void;
  setMoveOverlayDisplayMode: (mode: MoveOverlayDisplayMode) => void;
  setMoveOverlayOrientationMode: (mode: MoveOverlayOrientationMode) => void;
  setMoveOverlayRadiusMultiplier: (multiplier: number) => void;
  setMovePrecisionStep: (step: number) => void;
  setMoveVerticalDropGuide: (value: boolean) => void;
  setModelingPointerPanelRadius: (value: number) => void;
  setModelingLineSnapDistance: (value: number) => void;
  setModelingLineOverlayDisplayMode: (value: MoveOverlayDisplayMode) => void;
  setModelingLineSnapEnabled: (value: boolean) => void;
  setModelingPointerVerticalAxisFloorY: (value: number) => void;
  setModelingPointerVisibleInCameraTool: (value: boolean) => void;
  setModelingTool: (tool: ModelingTool) => void;
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
  setRotateDragReleaseBehavior: (value: RotateDragReleaseBehavior) => void;
  setRotateAngleSnapStepDeg: (value: number) => void;
  setRotateTwistAxis: (axis: RotateTwistAxis) => void;
  setRotateUiOpacity: (value: number) => void;
  setRotateUiRadiusPx: (value: number) => void;
  setRotateWheelDirection: (direction: RotateWheelDirection) => void;
  setRotateWheelRotateStepDeg: (value: number) => void;
  setSelectedSettingsMenu: (menu: SettingsMenu) => void;
  setShowFps: (value: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSuppressObjectRotation: (value: boolean) => void;
  setModelingCamera: (camera: CameraSnapshot) => void;
  setModelingPointerDepth: (depth: number) => void;
  setModelingCameraDragging: (dragging: boolean) => void;
  setModelingCameraOverride: (active: boolean) => void;
  setModelingPointerHovered: (hovered: boolean) => void;
  setModelingPointerPlane: (plane: ModelingPointerPlane) => void;
  setModelingPointerPosition: (position: [number, number, number]) => void;
  setModelingLinePreview: (
    preview: Omit<ModelingLinePreviewState, "active">,
  ) => void;
  clearModelingLinePreview: () => void;
  setPrototypeCamera: (camera: CameraSnapshot) => void;
};

type ModelingToolState = Pick<
  UiState,
  "modelingCameraDragging" | "modelingCameraOverride" | "modelingTool"
>;

export function getEffectiveModelingTool(
  state: ModelingToolState,
): EffectiveModelingTool {
  return state.modelingTool === "camera" ||
    state.modelingCameraOverride ||
    state.modelingCameraDragging
    ? "camera"
    : "pointer";
}

export const UI_STORE_PERSIST_KEY = "naname-ui-settings";

export const DEFAULT_PROTOTYPE_CAMERA: CameraSnapshot = {
  position: [6.4, 4.5, 7.8],
  target: [0, 0, 0],
};

export const DEFAULT_MODELING_CAMERA: CameraSnapshot = {
  position: [8.8, 6.4, 9.4],
  target: [0, 1.1, 0],
};

const DEFAULT_MODELING_LINE_PREVIEW: ModelingLinePreviewState = {
  active: false,
  currentPosition: [0, 0, 0],
  planeNormal: [0, 0, 1],
  startPosition: [0, 0, 0],
};

export const createDefaultPersistedUiState = (): PersistedUiState => ({
  currentScreen: "prototype",
  floorFriction: 1.1,
  floorColor: "#d9dee7",
  gridMajorColor: "#8d99ae",
  gridMinorColor: "#c5cedb",
  floorRestitution: 0,
  fogColor: "#dbe7f3",
  generalSelectionOutlineColor: "#f8fafc",
  generalSelectionOutlineThickness: 4,
  gravityY: -9.81,
  moveAlwaysSnapMode: "off",
  moveAxisMagnetReferenceFrame: "local",
  moveDepthWheelDirection: "normal",
  moveDepthWheelStep: 0.24,
  moveGridSnapPattern: "xyz",
  moveGridSnapStep: 0.5,
  moveOverlayDisplayMode: "mode-1",
  moveOverlayOrientationMode: "camera-facing",
  moveOverlayRadiusMultiplier: 1.15,
  movePrecisionStep: 0.1,
  moveVerticalDropGuide: true,
  modelingPointerPanelRadius: 0.72,
  modelingLineSnapDistance: 0.45,
  modelingLineOverlayDisplayMode: "mode-1",
  modelingLineSnapEnabled: true,
  modelingPointerVerticalAxisFloorY: 0,
  modelingPointerVisibleInCameraTool: false,
  modelingTool: "select",
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
  rotateDragReleaseBehavior: "keep-selected",
  rotateAngleSnapStepDeg: 15,
  rotateTwistAxis: "+y",
  rotateUiOpacity: 1.2,
  rotateUiRadiusPx: 140,
  rotateWheelDirection: "reverse",
  rotateWheelRotateStepDeg: 16,
  selectedSettingsMenu: "general",
  showFps: true,
  settingsOpen: false,
  suppressObjectRotation: false,
  interactionMode: "move",
});

const createInitialUiState = (): Omit<
  UiState,
  | "completeMoveDrag"
  | "clearSelection"
  | "selectObject"
  | "setCurrentScreen"
  | "setAxisMagnetTarget"
  | "setFloorFriction"
  | "setFloorColor"
  | "setFloorRestitution"
  | "setGravityY"
  | "setGridMajorColor"
  | "setGridMinorColor"
  | "setMoveAlwaysSnapMode"
  | "setMoveAxisMagnetReferenceFrame"
  | "setInteractionState"
  | "setMoveDepthWheelDirection"
  | "setMoveDepthWheelStep"
  | "setMoveGridSnapPattern"
  | "setMoveGridSnapStep"
  | "setMoveOverlayDisplayMode"
  | "setMoveOverlayOrientationMode"
  | "setMoveOverlayRadiusMultiplier"
  | "setMovePrecisionStep"
  | "setMoveVerticalDropGuide"
  | "setModelingPointerPanelRadius"
  | "setModelingLineSnapDistance"
  | "setModelingLineOverlayDisplayMode"
  | "setModelingLineSnapEnabled"
  | "setModelingPointerVerticalAxisFloorY"
  | "setModelingPointerVisibleInCameraTool"
  | "setModelingTool"
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
  | "setRotateDragReleaseBehavior"
  | "setRotateAngleSnapStepDeg"
  | "setRotateTwistAxis"
  | "setRotateUiOpacity"
  | "setRotateUiRadiusPx"
  | "setRotateWheelDirection"
  | "setRotateWheelRotateStepDeg"
  | "setSelectedSettingsMenu"
  | "setShowFps"
  | "setSettingsOpen"
  | "setSuppressObjectRotation"
  | "setModelingCamera"
  | "setModelingPointerDepth"
  | "setModelingCameraDragging"
  | "setModelingCameraOverride"
  | "setModelingPointerHovered"
  | "setModelingPointerPlane"
  | "setModelingPointerPosition"
  | "setModelingLinePreview"
  | "clearModelingLinePreview"
  | "setPrototypeCamera"
> => ({
  ...createDefaultPersistedUiState(),
  axisMagnetTarget: null,
  interactionState: "idle",
  modelingCamera: DEFAULT_MODELING_CAMERA,
  modelingCameraDragging: false,
  modelingCameraOverride: false,
  modelingLinePreview: DEFAULT_MODELING_LINE_PREVIEW,
  modelingPointer: {
    depth: 8,
    hovered: false,
    plane: "none",
    position: [0, 0, 0],
  },
  prototypeCamera: DEFAULT_PROTOTYPE_CAMERA,
  selectedObjectId: null,
});

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      ...createInitialUiState(),
      completeMoveDrag: () =>
        set({
          axisMagnetTarget: null,
          interactionState: "idle",
          selectedObjectId: null,
        }),
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
      setCurrentScreen: (screen) =>
        set({
          axisMagnetTarget: null,
          currentScreen: screen,
          interactionState: "idle",
          modelingCameraDragging: false,
          modelingCameraOverride: false,
          modelingLinePreview: DEFAULT_MODELING_LINE_PREVIEW,
          selectedObjectId: null,
        }),
      setAxisMagnetTarget: (target) => set({ axisMagnetTarget: target }),
      setFloorFriction: (value) => set({ floorFriction: value }),
      setFloorColor: (value) => set({ floorColor: value }),
      setFloorRestitution: (value) => set({ floorRestitution: value }),
      setGridMajorColor: (value) => set({ gridMajorColor: value }),
      setGridMinorColor: (value) => set({ gridMinorColor: value }),
      setGravityY: (value) => set({ gravityY: value }),
      setMoveAlwaysSnapMode: (value) => set({ moveAlwaysSnapMode: value }),
      setMoveAxisMagnetReferenceFrame: (value) =>
        set({ moveAxisMagnetReferenceFrame: value }),
      setInteractionState: (state) => set({ interactionState: state }),
      setMoveDepthWheelDirection: (direction) =>
        set({ moveDepthWheelDirection: direction }),
      setMoveDepthWheelStep: (step) => set({ moveDepthWheelStep: step }),
      setMoveGridSnapPattern: (pattern) =>
        set({ moveGridSnapPattern: pattern }),
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
      setModelingCamera: (camera) => set({ modelingCamera: camera }),
      setModelingPointerPanelRadius: (value) =>
        set({
          modelingPointerPanelRadius: Math.max(0.2, Math.min(value, 8)),
        }),
      setModelingLineSnapDistance: (value) =>
        set({
          modelingLineSnapDistance: Math.max(0.05, Math.min(value, 4)),
        }),
      setModelingLineOverlayDisplayMode: (value) =>
        set({
          modelingLineOverlayDisplayMode: value,
        }),
      setModelingLineSnapEnabled: (value) =>
        set({
          modelingLineSnapEnabled: value,
        }),
      setModelingPointerVerticalAxisFloorY: (value) =>
        set({
          modelingPointerVerticalAxisFloorY: Math.max(-32, Math.min(value, 32)),
        }),
      setModelingPointerVisibleInCameraTool: (value) =>
        set({ modelingPointerVisibleInCameraTool: value }),
      setModelingTool: (tool) =>
        set({
          modelingCameraDragging: false,
          modelingCameraOverride: false,
          modelingLinePreview: DEFAULT_MODELING_LINE_PREVIEW,
          modelingTool: tool,
        }),
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
        set((state) => {
          if (state.interactionMode === mode) {
            return state;
          }

          return {
            axisMagnetTarget: null,
            interactionMode: mode,
            interactionState:
              state.interactionMode === "rotate" && mode === "move"
                ? "idle"
                : state.selectedObjectId
                  ? "active"
                  : "idle",
            selectedObjectId:
              state.interactionMode === "rotate" && mode === "move"
                ? null
                : state.selectedObjectId,
          };
        }),
      setRotateGizmoRingColor: (value) => set({ rotateGizmoRingColor: value }),
      setRotateGizmoSphereColor: (value) =>
        set({ rotateGizmoSphereColor: value }),
      setRotateArcballSensitivity: (value) =>
        set({ rotateArcballSensitivity: value }),
      setRotateDragReleaseBehavior: (value) =>
        set({ rotateDragReleaseBehavior: value }),
      setRotateAngleSnapStepDeg: (value) =>
        set({ rotateAngleSnapStepDeg: value }),
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
      setModelingPointerDepth: (depth) =>
        set((state) => ({
          modelingPointer: {
            ...state.modelingPointer,
            depth: Math.max(0.5, Math.min(depth, 48)),
          },
        })),
      setModelingCameraDragging: (dragging) =>
        set({ modelingCameraDragging: dragging }),
      setModelingCameraOverride: (active) =>
        set({ modelingCameraOverride: active }),
      setModelingPointerHovered: (hovered) =>
        set((state) => ({
          modelingPointer: {
            ...state.modelingPointer,
            hovered,
          },
        })),
      setModelingPointerPlane: (plane) =>
        set((state) => ({
          modelingPointer: {
            ...state.modelingPointer,
            plane,
          },
        })),
      setModelingPointerPosition: (position) =>
        set((state) => ({
          modelingPointer: {
            ...state.modelingPointer,
            position,
          },
        })),
      setModelingLinePreview: (preview) =>
        set({
          modelingLinePreview: {
            active: true,
            currentPosition: preview.currentPosition,
            planeNormal: preview.planeNormal,
            startPosition: preview.startPosition,
          },
        }),
      clearModelingLinePreview: () =>
        set({
          modelingLinePreview: DEFAULT_MODELING_LINE_PREVIEW,
        }),
      setPrototypeCamera: (camera) => set({ prototypeCamera: camera }),
    }),
    {
      name: UI_STORE_PERSIST_KEY,
      partialize: (state) => ({
        currentScreen: state.currentScreen,
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
        moveAlwaysSnapMode: state.moveAlwaysSnapMode,
        moveAxisMagnetReferenceFrame: state.moveAxisMagnetReferenceFrame,
        moveDepthWheelDirection: state.moveDepthWheelDirection,
        moveDepthWheelStep: state.moveDepthWheelStep,
        moveGridSnapPattern: state.moveGridSnapPattern,
        moveGridSnapStep: state.moveGridSnapStep,
        moveOverlayDisplayMode: state.moveOverlayDisplayMode,
        moveOverlayOrientationMode: state.moveOverlayOrientationMode,
        moveOverlayRadiusMultiplier: state.moveOverlayRadiusMultiplier,
        movePrecisionStep: state.movePrecisionStep,
        moveVerticalDropGuide: state.moveVerticalDropGuide,
        modelingPointerPanelRadius: state.modelingPointerPanelRadius,
        modelingLineSnapDistance: state.modelingLineSnapDistance,
        modelingLineOverlayDisplayMode: state.modelingLineOverlayDisplayMode,
        modelingLineSnapEnabled: state.modelingLineSnapEnabled,
        modelingPointerVerticalAxisFloorY:
          state.modelingPointerVerticalAxisFloorY,
        modelingPointerVisibleInCameraTool:
          state.modelingPointerVisibleInCameraTool,
        modelingTool: state.modelingTool,
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
        rotateDragReleaseBehavior: state.rotateDragReleaseBehavior,
        rotateAngleSnapStepDeg: state.rotateAngleSnapStepDeg,
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
