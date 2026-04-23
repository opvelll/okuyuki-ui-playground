import type {
  ModelingTool,
  MoveAlwaysSnapMode,
  MoveAxisMagnetReferenceFrame,
  MoveDepthWheelDirection,
  MoveGridSnapPattern,
  MoveOverlayDisplayMode,
  PhysicsRigidBodyType,
  RotateDragReleaseBehavior,
  RotateTwistAxis,
  RotateWheelDirection,
  SettingsMenu,
} from "../../store/uiStore";

type Option<Value extends string> = {
  label: string;
  value: Value;
};

function createOptionChecker<Value extends string>(
  options: readonly Option<Value>[],
) {
  const values = new Set(options.map((option) => option.value));

  return (value: string): value is Value => values.has(value as Value);
}

export const settingsMenuItems = [
  { description: "app-wide defaults", key: "general", label: "全体" },
  { description: "rapier tuning", key: "physics", label: "物理演算" },
  { description: "screen-depth drag", key: "move-ui", label: "Move UI" },
  { description: "arcball rotate", key: "rotate-ui", label: "Rotate UI" },
  { description: "modeling pointer", key: "modeling-ui", label: "Modeling" },
] as const satisfies ReadonlyArray<{
  description: string;
  key: SettingsMenu;
  label: string;
}>;

export const overlayDisplayOptions = [
  { label: "1", value: "mode-1" },
  { label: "2", value: "mode-2" },
  { label: "3", value: "mode-3" },
  { label: "2 + 3", value: "modes-2-3" },
  { label: "1 + 2 + 3", value: "modes-1-2-3" },
] as const satisfies readonly Option<MoveOverlayDisplayMode>[];

export const depthDirectionOptions = [
  { label: "normal", value: "normal" },
  { label: "inverted", value: "inverted" },
] as const satisfies readonly Option<MoveDepthWheelDirection>[];

export const axisMagnetReferenceFrameOptions = [
  { label: "local xyz", value: "local" },
  { label: "world xyz", value: "world" },
] as const satisfies readonly Option<MoveAxisMagnetReferenceFrame>[];

export const alwaysSnapModeOptions = [
  { label: "off", value: "off" },
  { label: "other object axis", value: "axis-magnet" },
  { label: "fixed interval", value: "grid" },
] as const satisfies readonly Option<MoveAlwaysSnapMode>[];

export const gridSnapPatternOptions = [
  { label: "xyz", value: "xyz" },
  { label: "xz plane", value: "xz" },
] as const satisfies readonly Option<MoveGridSnapPattern>[];

export const rotateDirectionOptions = [
  { label: "normal", value: "normal" },
  { label: "reverse", value: "reverse" },
] as const satisfies readonly Option<RotateWheelDirection>[];

export const rotateTwistAxisOptions = [
  { label: "+X", value: "+x" },
  { label: "+Y", value: "+y" },
  { label: "+Z", value: "+z" },
] as const satisfies readonly Option<RotateTwistAxis>[];

export const rotateDragReleaseBehaviorOptions = [
  { label: "keep selected", value: "keep-selected" },
  { label: "clear selection", value: "clear-selection" },
] as const satisfies readonly Option<RotateDragReleaseBehavior>[];

export const rigidBodyOptions = [
  { label: "Dynamic", value: "dynamic" },
  { label: "Fixed", value: "fixed" },
  { label: "Kinematic", value: "kinematicPosition" },
] as const satisfies readonly Option<PhysicsRigidBodyType>[];

export const modelingToolOptions = [
  { label: "lasso", value: "lasso" },
  { label: "vertex", value: "vertex" },
  { label: "line", value: "line" },
  { label: "camera move", value: "camera" },
] as const satisfies readonly Option<ModelingTool>[];

export const isOverlayDisplayMode = createOptionChecker(overlayDisplayOptions);
export const isDepthDirection = createOptionChecker(depthDirectionOptions);
export const isAxisMagnetReferenceFrame = createOptionChecker(
  axisMagnetReferenceFrameOptions,
);
export const isAlwaysSnapMode = createOptionChecker(alwaysSnapModeOptions);
export const isGridSnapPattern = createOptionChecker(gridSnapPatternOptions);
export const isRotateDirection = createOptionChecker(rotateDirectionOptions);
export const isRotateTwistAxis = createOptionChecker(rotateTwistAxisOptions);
export const isRotateDragReleaseBehavior = createOptionChecker(
  rotateDragReleaseBehaviorOptions,
);
export const isRigidBodyType = createOptionChecker(rigidBodyOptions);
export const isModelingTool = createOptionChecker(modelingToolOptions);

export function parseNumberInput(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}
