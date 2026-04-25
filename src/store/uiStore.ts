import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PenStrokeParams } from "../components/scene/penStrokeProcessing";
import type { Vector3Tuple } from "../types/scene";

export type MoveDepthWheelDirection = "normal" | "inverted";
export type InteractionState = "idle" | "active" | "dragging";
export type InteractionMode = "move" | "rotate";
export type AppScreen = "prototype" | "modeling";
export type ModelingTool =
  | "lasso"
  | "move"
  | "vertex"
  | "line"
  | "pen"
  | "rectangle"
  | "box"
  | "camera";
type EffectiveModelingTool = "pointer" | "camera";
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
export type ModelingRectangleMode =
  | "flat-xz"
  | "upright-up-fixed"
  | "upright-x-fixed"
  | "upright-z-fixed"
  | "upright-left-square";
export type ModelingBelowFloorDisplay = "visible" | "hidden" | "faded";
export type ModelingPointerAxisBelowFloorDisplay = "hidden" | "faded";
export type AxisMagnetTarget = {
  axis: "x" | "y" | "z";
  direction: "negative" | "positive";
  objectId: string;
};

export type ModelingPointerState = {
  depth: number;
  snappedEdgeTarget: {
    edgeId: string;
    position: [number, number, number];
    vertexIds: [string, string];
  } | null;
  hovered: boolean;
  plane: ModelingPointerPlane;
  position: [number, number, number];
  snappedAxes: [boolean, boolean, boolean];
  snappedAxisTargets: [
    [number, number, number] | null,
    [number, number, number] | null,
    [number, number, number] | null,
  ];
  snappedVertexTarget: [number, number, number] | null;
};

export type ModelingLinePreviewState = {
  active: boolean;
  currentPosition: [number, number, number];
  currentSnapped: boolean;
  planeNormal: [number, number, number];
  polygonPoints: Array<[number, number, number]>;
  startSnapped: boolean;
  startPosition: [number, number, number];
  tool: "line" | "rectangle" | "box";
  wireframeEdges: Array<[[number, number, number], [number, number, number]]>;
};

export type ModelingLassoSelectionState = {
  phase: "idle" | "dragging" | "settled";
  points: Array<[number, number]>;
};

export type ModelingPenPreviewState = {
  active: boolean;
  points: Array<[number, number]>;
};

export type ActivePenStrokeState = {
  historyIndex: number;
  params: PenStrokeParams;
  rawPoints: Vector3Tuple[];
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
  modelingPointerAxisSnapEnabled: boolean;
  modelingPointerAxisSnapDistance: number;
  modelingPointerDepthPrecisionScale: number;
  modelingPointerEdgeSnapDistance: number;
  modelingPointerEdgeSnapEnabled: boolean;
  modelingPointerGridSnapEnabled: boolean;
  modelingPointerGridSnapStep: number;
  modelingPointerPanelRadius: number;
  modelingPointerScreenVertexSnapEnabled: boolean;
  modelingPointerVertexSnapDistance: number;
  modelingPointerVertexSnapEnabled: boolean;
  modelingLineOverlayDisplayMode: MoveOverlayDisplayMode;
  modelingLineOverlayBelowFloorDisplay: ModelingBelowFloorDisplay;
  modelingLineOverlayRadiusMultiplier: number;
  modelingLineAngleSnapStepDeg: number;
  modelingRectangleMode: ModelingRectangleMode;
  modelingPointerVerticalAxisFloorY: number;
  modelingPointerAxisBelowFloorDisplay: ModelingPointerAxisBelowFloorDisplay;
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

export type UiState = PersistedUiState & {
  axisMagnetTarget: AxisMagnetTarget | null;
  activePenStroke: ActivePenStrokeState | null;
  interactionState: InteractionState;
  modelingCamera: CameraSnapshot;
  modelingLinePreview: ModelingLinePreviewState;
  modelingLassoSelection: ModelingLassoSelectionState;
  modelingPenPreview: ModelingPenPreviewState;
  modelingPointer: ModelingPointerState;
  modelingCameraDragging: boolean;
  modelingCameraOverride: boolean;
  prototypeCamera: CameraSnapshot;
  selectedObjectId: string | null;
  completeMoveDrag: () => void;
  clearSelection: () => void;
  clearActivePenStroke: () => void;
  selectObject: (objectId: string) => void;
  setCurrentScreen: (screen: AppScreen) => void;
  setActivePenStroke: (stroke: ActivePenStrokeState | null) => void;
  setActivePenStrokeParams: (params: PenStrokeParams) => void;
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
  setModelingPointerAxisSnapEnabled: (value: boolean) => void;
  setModelingPointerAxisSnapDistance: (value: number) => void;
  setModelingPointerDepthPrecisionScale: (value: number) => void;
  setModelingPointerEdgeSnapDistance: (value: number) => void;
  setModelingPointerEdgeSnapEnabled: (value: boolean) => void;
  setModelingPointerGridSnapEnabled: (value: boolean) => void;
  setModelingPointerGridSnapStep: (value: number) => void;
  setModelingPointerPanelRadius: (value: number) => void;
  setModelingPointerScreenVertexSnapEnabled: (value: boolean) => void;
  setModelingPointerVertexSnapDistance: (value: number) => void;
  setModelingPointerVertexSnapEnabled: (value: boolean) => void;
  setModelingLineOverlayDisplayMode: (value: MoveOverlayDisplayMode) => void;
  setModelingLineOverlayBelowFloorDisplay: (
    value: ModelingBelowFloorDisplay,
  ) => void;
  setModelingLineOverlayRadiusMultiplier: (value: number) => void;
  setModelingLineAngleSnapStepDeg: (value: number) => void;
  setModelingRectangleMode: (value: ModelingRectangleMode) => void;
  setModelingPointerVerticalAxisFloorY: (value: number) => void;
  setModelingPointerAxisBelowFloorDisplay: (
    value: ModelingPointerAxisBelowFloorDisplay,
  ) => void;
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
  setModelingPointerSnappedAxes: (axes: [boolean, boolean, boolean]) => void;
  setModelingPointerSnappedAxisTargets: (
    targets: ModelingPointerState["snappedAxisTargets"],
  ) => void;
  setModelingPointerSnappedEdgeTarget: (
    target: ModelingPointerState["snappedEdgeTarget"],
  ) => void;
  setModelingPointerSnappedVertexTarget: (
    target: ModelingPointerState["snappedVertexTarget"],
  ) => void;
  setModelingLinePreview: (
    preview: Omit<ModelingLinePreviewState, "active">,
  ) => void;
  clearModelingLinePreview: () => void;
  setModelingLassoSelection: (selection: ModelingLassoSelectionState) => void;
  clearModelingLassoSelection: () => void;
  setModelingPenPreview: (points: Array<[number, number]>) => void;
  clearModelingPenPreview: () => void;
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
  currentSnapped: false,
  planeNormal: [0, 0, 1],
  polygonPoints: [],
  startSnapped: false,
  startPosition: [0, 0, 0],
  tool: "line",
  wireframeEdges: [],
};

const DEFAULT_MODELING_LASSO_SELECTION: ModelingLassoSelectionState = {
  phase: "idle",
  points: [],
};

const DEFAULT_MODELING_PEN_PREVIEW: ModelingPenPreviewState = {
  active: false,
  points: [],
};

export const DEFAULT_PEN_STROKE_PARAMS: PenStrokeParams = {
  mergeDistance: 0.22,
  mergeVertices: true,
  resampleSpacing: 0.18,
  simplificationDistance: 0.035,
  smoothingIterations: 1,
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
  modelingPointerAxisSnapEnabled: true,
  modelingPointerAxisSnapDistance: 0.1,
  modelingPointerDepthPrecisionScale: 0.1,
  modelingPointerEdgeSnapDistance: 0.25,
  modelingPointerEdgeSnapEnabled: true,
  modelingPointerGridSnapEnabled: false,
  modelingPointerGridSnapStep: 0.05,
  modelingPointerPanelRadius: 0.72,
  modelingPointerScreenVertexSnapEnabled: false,
  modelingPointerVertexSnapDistance: 0.45,
  modelingPointerVertexSnapEnabled: true,
  modelingLineOverlayDisplayMode: "mode-1",
  modelingLineOverlayBelowFloorDisplay: "faded",
  modelingLineOverlayRadiusMultiplier: 1,
  modelingLineAngleSnapStepDeg: 45,
  modelingRectangleMode: "upright-up-fixed",
  modelingPointerVerticalAxisFloorY: 0,
  modelingPointerAxisBelowFloorDisplay: "hidden",
  modelingPointerVisibleInCameraTool: false,
  modelingTool: "lasso",
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
  | "clearActivePenStroke"
  | "selectObject"
  | "setCurrentScreen"
  | "setActivePenStroke"
  | "setActivePenStrokeParams"
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
  | "setModelingPointerAxisSnapEnabled"
  | "setModelingPointerAxisSnapDistance"
  | "setModelingPointerDepthPrecisionScale"
  | "setModelingPointerEdgeSnapDistance"
  | "setModelingPointerEdgeSnapEnabled"
  | "setModelingPointerGridSnapEnabled"
  | "setModelingPointerGridSnapStep"
  | "setModelingPointerPanelRadius"
  | "setModelingPointerScreenVertexSnapEnabled"
  | "setModelingPointerVertexSnapDistance"
  | "setModelingPointerVertexSnapEnabled"
  | "setModelingLineOverlayDisplayMode"
  | "setModelingLineOverlayBelowFloorDisplay"
  | "setModelingLineOverlayRadiusMultiplier"
  | "setModelingLineAngleSnapStepDeg"
  | "setModelingRectangleMode"
  | "setModelingPointerVerticalAxisFloorY"
  | "setModelingPointerAxisBelowFloorDisplay"
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
  | "setModelingPointerSnappedAxes"
  | "setModelingPointerSnappedAxisTargets"
  | "setModelingPointerSnappedEdgeTarget"
  | "setModelingPointerSnappedVertexTarget"
  | "setModelingLinePreview"
  | "clearModelingLinePreview"
  | "setModelingLassoSelection"
  | "clearModelingLassoSelection"
  | "setModelingPenPreview"
  | "clearModelingPenPreview"
  | "setPrototypeCamera"
> => ({
  ...createDefaultPersistedUiState(),
  activePenStroke: null,
  axisMagnetTarget: null,
  interactionState: "idle",
  modelingCamera: DEFAULT_MODELING_CAMERA,
  modelingCameraDragging: false,
  modelingCameraOverride: false,
  modelingLassoSelection: DEFAULT_MODELING_LASSO_SELECTION,
  modelingLinePreview: DEFAULT_MODELING_LINE_PREVIEW,
  modelingPenPreview: DEFAULT_MODELING_PEN_PREVIEW,
  modelingPointer: {
    depth: 8,
    hovered: false,
    plane: "none",
    position: [0, 0, 0],
    snappedAxes: [false, false, false],
    snappedAxisTargets: [null, null, null],
    snappedEdgeTarget: null,
    snappedVertexTarget: null,
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
          activePenStroke: null,
          axisMagnetTarget: null,
          interactionState: "idle",
          selectedObjectId: null,
        }),
      clearActivePenStroke: () => set({ activePenStroke: null }),
      selectObject: (objectId) =>
        set({
          activePenStroke: null,
          axisMagnetTarget: null,
          interactionState: "active",
          selectedObjectId: objectId,
        }),
      setCurrentScreen: (screen) =>
        set({
          activePenStroke: null,
          axisMagnetTarget: null,
          currentScreen: screen,
          interactionState: "idle",
          modelingCameraDragging: false,
          modelingCameraOverride: false,
          modelingLassoSelection: DEFAULT_MODELING_LASSO_SELECTION,
          modelingLinePreview: DEFAULT_MODELING_LINE_PREVIEW,
          modelingPenPreview: DEFAULT_MODELING_PEN_PREVIEW,
          selectedObjectId: null,
        }),
      setActivePenStroke: (stroke) =>
        set({
          activePenStroke: stroke
            ? {
                historyIndex: stroke.historyIndex,
                params: {
                  mergeDistance: Math.max(
                    0,
                    Math.min(stroke.params.mergeDistance, 4),
                  ),
                  mergeVertices: stroke.params.mergeVertices,
                  resampleSpacing: Math.max(
                    0,
                    Math.min(stroke.params.resampleSpacing, 4),
                  ),
                  simplificationDistance: Math.max(
                    0,
                    Math.min(stroke.params.simplificationDistance, 4),
                  ),
                  smoothingIterations: Math.max(
                    0,
                    Math.min(Math.round(stroke.params.smoothingIterations), 5),
                  ),
                },
                rawPoints: stroke.rawPoints.map((point) => [...point]),
              }
            : null,
        }),
      setActivePenStrokeParams: (params) =>
        set((state) =>
          state.activePenStroke
            ? {
                activePenStroke: {
                  ...state.activePenStroke,
                  params: {
                    mergeDistance: Math.max(
                      0,
                      Math.min(params.mergeDistance, 4),
                    ),
                    mergeVertices: params.mergeVertices,
                    resampleSpacing: Math.max(
                      0,
                      Math.min(params.resampleSpacing, 4),
                    ),
                    simplificationDistance: Math.max(
                      0,
                      Math.min(params.simplificationDistance, 4),
                    ),
                    smoothingIterations: Math.max(
                      0,
                      Math.min(Math.round(params.smoothingIterations), 5),
                    ),
                  },
                },
              }
            : state,
        ),
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
      setModelingPointerAxisSnapEnabled: (value) =>
        set({ modelingPointerAxisSnapEnabled: value }),
      setModelingPointerAxisSnapDistance: (value) =>
        set({
          modelingPointerAxisSnapDistance: Math.max(0, Math.min(value, 4)),
        }),
      setModelingPointerDepthPrecisionScale: (value) =>
        set({
          modelingPointerDepthPrecisionScale: Math.max(
            0.01,
            Math.min(value, 1),
          ),
        }),
      setModelingPointerEdgeSnapDistance: (value) =>
        set({
          modelingPointerEdgeSnapDistance: Math.max(0, Math.min(value, 4)),
        }),
      setModelingPointerEdgeSnapEnabled: (value) =>
        set({ modelingPointerEdgeSnapEnabled: value }),
      setModelingPointerGridSnapEnabled: (value) =>
        set({ modelingPointerGridSnapEnabled: value }),
      setModelingPointerGridSnapStep: (value) =>
        set({
          modelingPointerGridSnapStep: Math.max(0.01, Math.min(value, 4)),
        }),
      setModelingCamera: (camera) => set({ modelingCamera: camera }),
      setModelingPointerPanelRadius: (value) =>
        set({
          modelingPointerPanelRadius: Math.max(0.2, Math.min(value, 8)),
        }),
      setModelingPointerScreenVertexSnapEnabled: (value) =>
        set({
          modelingPointerScreenVertexSnapEnabled: value,
        }),
      setModelingPointerVertexSnapDistance: (value) =>
        set({
          modelingPointerVertexSnapDistance: Math.max(0, Math.min(value, 4)),
        }),
      setModelingPointerVertexSnapEnabled: (value) =>
        set({
          modelingPointerVertexSnapEnabled: value,
        }),
      setModelingLineOverlayDisplayMode: (value) =>
        set({
          modelingLineOverlayDisplayMode: value,
        }),
      setModelingLineOverlayBelowFloorDisplay: (value) =>
        set({
          modelingLineOverlayBelowFloorDisplay: value,
        }),
      setModelingLineOverlayRadiusMultiplier: (value) =>
        set({
          modelingLineOverlayRadiusMultiplier: Math.max(
            0.5,
            Math.min(value, 2),
          ),
        }),
      setModelingLineAngleSnapStepDeg: (value) =>
        set({
          modelingLineAngleSnapStepDeg: [15, 30, 45, 90].includes(value)
            ? value
            : 45,
        }),
      setModelingRectangleMode: (value) =>
        set({
          modelingRectangleMode: value,
        }),
      setModelingPointerVerticalAxisFloorY: (value) =>
        set({
          modelingPointerVerticalAxisFloorY: Math.max(-32, Math.min(value, 32)),
        }),
      setModelingPointerAxisBelowFloorDisplay: (value) =>
        set({
          modelingPointerAxisBelowFloorDisplay: value,
        }),
      setModelingPointerVisibleInCameraTool: (value) =>
        set({ modelingPointerVisibleInCameraTool: value }),
      setModelingTool: (tool) =>
        set({
          activePenStroke: null,
          modelingCameraDragging: false,
          modelingCameraOverride: false,
          modelingLassoSelection: DEFAULT_MODELING_LASSO_SELECTION,
          modelingLinePreview: DEFAULT_MODELING_LINE_PREVIEW,
          modelingPenPreview: DEFAULT_MODELING_PEN_PREVIEW,
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
      setModelingPointerSnappedAxes: (snappedAxes) =>
        set((state) => ({
          modelingPointer: {
            ...state.modelingPointer,
            snappedAxes,
          },
        })),
      setModelingPointerSnappedAxisTargets: (snappedAxisTargets) =>
        set((state) => ({
          modelingPointer: {
            ...state.modelingPointer,
            snappedAxisTargets,
          },
        })),
      setModelingPointerSnappedEdgeTarget: (snappedEdgeTarget) =>
        set((state) => ({
          modelingPointer: {
            ...state.modelingPointer,
            snappedEdgeTarget,
          },
        })),
      setModelingPointerSnappedVertexTarget: (snappedVertexTarget) =>
        set((state) => ({
          modelingPointer: {
            ...state.modelingPointer,
            snappedVertexTarget,
          },
        })),
      setModelingLinePreview: (preview) =>
        set({
          modelingLinePreview: {
            active: true,
            currentPosition: preview.currentPosition,
            currentSnapped: preview.currentSnapped,
            planeNormal: preview.planeNormal,
            polygonPoints: preview.polygonPoints,
            startSnapped: preview.startSnapped,
            startPosition: preview.startPosition,
            tool: preview.tool,
            wireframeEdges: preview.wireframeEdges,
          },
        }),
      clearModelingLinePreview: () =>
        set({
          modelingLinePreview: DEFAULT_MODELING_LINE_PREVIEW,
        }),
      setModelingLassoSelection: (selection) =>
        set({
          modelingLassoSelection: selection,
        }),
      clearModelingLassoSelection: () =>
        set({
          modelingLassoSelection: DEFAULT_MODELING_LASSO_SELECTION,
        }),
      setModelingPenPreview: (points) =>
        set({
          modelingPenPreview: {
            active: points.length >= 2,
            points: points.map((point) => [...point]),
          },
        }),
      clearModelingPenPreview: () =>
        set({
          modelingPenPreview: DEFAULT_MODELING_PEN_PREVIEW,
        }),
      setPrototypeCamera: (camera) => set({ prototypeCamera: camera }),
    }),
    {
      name: UI_STORE_PERSIST_KEY,
      version: 2,
      migrate: (persistedState) => {
        if (
          persistedState &&
          typeof persistedState === "object" &&
          "modelingTool" in persistedState &&
          persistedState.modelingTool === "select"
        ) {
          return {
            ...persistedState,
            modelingTool: "lasso",
          };
        }

        return persistedState;
      },
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
        modelingPointerAxisSnapEnabled: state.modelingPointerAxisSnapEnabled,
        modelingPointerAxisSnapDistance: state.modelingPointerAxisSnapDistance,
        modelingPointerDepthPrecisionScale:
          state.modelingPointerDepthPrecisionScale,
        modelingPointerEdgeSnapDistance: state.modelingPointerEdgeSnapDistance,
        modelingPointerEdgeSnapEnabled: state.modelingPointerEdgeSnapEnabled,
        modelingPointerGridSnapEnabled: state.modelingPointerGridSnapEnabled,
        modelingPointerGridSnapStep: state.modelingPointerGridSnapStep,
        modelingPointerPanelRadius: state.modelingPointerPanelRadius,
        modelingPointerScreenVertexSnapEnabled:
          state.modelingPointerScreenVertexSnapEnabled,
        modelingPointerVertexSnapDistance:
          state.modelingPointerVertexSnapDistance,
        modelingPointerVertexSnapEnabled:
          state.modelingPointerVertexSnapEnabled,
        modelingLineOverlayDisplayMode: state.modelingLineOverlayDisplayMode,
        modelingLineOverlayBelowFloorDisplay:
          state.modelingLineOverlayBelowFloorDisplay,
        modelingLineOverlayRadiusMultiplier:
          state.modelingLineOverlayRadiusMultiplier,
        modelingLineAngleSnapStepDeg: state.modelingLineAngleSnapStepDeg,
        modelingRectangleMode: state.modelingRectangleMode,
        modelingPointerVerticalAxisFloorY:
          state.modelingPointerVerticalAxisFloorY,
        modelingPointerAxisBelowFloorDisplay:
          state.modelingPointerAxisBelowFloorDisplay,
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
