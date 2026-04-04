import { useState } from "react";
import {
  type MoveDepthWheelDirection,
  type MoveOverlayDisplayMode,
  type PhysicsRigidBodyType,
  type RotateTwistAxis,
  type RotateWheelDirection,
  type SettingsMenu,
  useUiStore,
} from "../store/uiStore";

const panelClasses =
  "absolute right-3 top-3 z-20 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.4rem] border border-white/15 bg-slate-950/72 shadow-[0_22px_48px_rgba(3,10,20,0.34)] backdrop-blur-xl md:right-4 md:top-4 md:w-[min(28rem,calc(100vw-2rem))]";
const sectionHeadingClasses =
  "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-sky-100/70";
const fieldClasses =
  "min-h-11 w-full rounded-2xl border border-white/12 bg-slate-900/80 px-3 text-sm text-slate-50 outline-none transition focus:border-sky-200/60 focus:ring-2 focus:ring-sky-300/40";
const toggleLabelClasses =
  "grid grid-cols-[1fr_auto] items-center gap-4 text-sm text-slate-100/90";
const fieldHintClasses = "text-xs leading-5 text-slate-300/72";
const colorFieldClasses =
  "h-11 w-14 rounded-2xl border border-white/12 bg-slate-900/80 p-1";
const subsectionToggleClasses =
  "flex w-full items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left text-sm font-semibold text-slate-100/90 transition hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-sky-300/50";

const settingsMenuItems = [
  { description: "app-wide defaults", key: "general", label: "全体" },
  { description: "rapier tuning", key: "physics", label: "物理演算" },
  { description: "screen-depth drag", key: "move-ui", label: "Move UI" },
  { description: "arcball rotate", key: "rotate-ui", label: "Rotate UI" },
] as const satisfies ReadonlyArray<{
  description: string;
  key: SettingsMenu;
  label: string;
}>;

const overlayDisplayOptions = [
  { label: "1", value: "mode-1" },
  { label: "2", value: "mode-2" },
  { label: "3", value: "mode-3" },
  { label: "2 + 3", value: "modes-2-3" },
  { label: "1 + 2 + 3", value: "modes-1-2-3" },
] as const;

const depthDirectionOptions = [
  { label: "normal", value: "normal" },
  { label: "inverted", value: "inverted" },
] as const;

const rotateDirectionOptions = [
  { label: "normal", value: "normal" },
  { label: "reverse", value: "reverse" },
] as const;

const rotateTwistAxisOptions = [
  { label: "+X", value: "+x" },
  { label: "+Y", value: "+y" },
  { label: "+Z", value: "+z" },
] as const;

const rigidBodyOptions = [
  { label: "Dynamic", value: "dynamic" },
  { label: "Fixed", value: "fixed" },
  { label: "Kinematic", value: "kinematicPosition" },
] as const;

const isOverlayDisplayMode = (value: string): value is MoveOverlayDisplayMode =>
  overlayDisplayOptions.some((option) => option.value === value);

const isDepthDirection = (value: string): value is MoveDepthWheelDirection =>
  depthDirectionOptions.some((option) => option.value === value);

const isRotateDirection = (value: string): value is RotateWheelDirection =>
  rotateDirectionOptions.some((option) => option.value === value);

const isRotateTwistAxis = (value: string): value is RotateTwistAxis =>
  rotateTwistAxisOptions.some((option) => option.value === value);

const isRigidBodyType = (value: string): value is PhysicsRigidBodyType =>
  rigidBodyOptions.some((option) => option.value === value);

const parseNumberInput = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

function ToggleField({
  checked,
  id,
  label,
  onChange,
}: {
  checked: boolean;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={toggleLabelClasses} htmlFor={id}>
      <span>{label}</span>
      <span className="relative inline-flex items-center">
        <input
          aria-label={label}
          checked={checked}
          className="peer sr-only"
          id={id}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="block h-6 w-11 rounded-full bg-slate-400/35 transition peer-checked:bg-sky-300" />
        <span className="pointer-events-none absolute left-[3px] h-[18px] w-[18px] rounded-full bg-slate-50 transition peer-checked:translate-x-[18px]" />
      </span>
    </label>
  );
}

function NumberField({
  hint,
  id,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  hint?: string;
  id: string;
  label: string;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  step: string;
  value: number;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-100/90" htmlFor={id}>
      <span>{label}</span>
      <input
        className={fieldClasses}
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
      {hint ? <span className={fieldHintClasses}>{hint}</span> : null}
    </label>
  );
}

function SectionNote({ children }: { children: string }) {
  return <p className={fieldHintClasses}>{children}</p>;
}

function ColorField({
  hint,
  id,
  label,
  onChange,
  value,
}: {
  hint?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-100/90" htmlFor={id}>
      <span>{label}</span>
      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
        <input
          className={colorFieldClasses}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value}
        />
        <span className={fieldClasses}>{value}</span>
      </div>
      {hint ? <span className={fieldHintClasses}>{hint}</span> : null}
    </label>
  );
}

export function SettingsWindow() {
  const [generalColorsOpen, setGeneralColorsOpen] = useState(true);
  const floorFriction = useUiStore((state) => state.floorFriction);
  const floorColor = useUiStore((state) => state.floorColor);
  const floorRestitution = useUiStore((state) => state.floorRestitution);
  const fogColor = useUiStore((state) => state.fogColor);
  const generalSelectionOutlineColor = useUiStore(
    (state) => state.generalSelectionOutlineColor,
  );
  const generalSelectionOutlineThickness = useUiStore(
    (state) => state.generalSelectionOutlineThickness,
  );
  const gravityY = useUiStore((state) => state.gravityY);
  const gridMajorColor = useUiStore((state) => state.gridMajorColor);
  const gridMinorColor = useUiStore((state) => state.gridMinorColor);
  const moveDepthWheelDirection = useUiStore(
    (state) => state.moveDepthWheelDirection,
  );
  const moveDepthWheelStep = useUiStore((state) => state.moveDepthWheelStep);
  const moveGridSnapStep = useUiStore((state) => state.moveGridSnapStep);
  const moveOverlayDisplayMode = useUiStore(
    (state) => state.moveOverlayDisplayMode,
  );
  const moveOverlayRadiusMultiplier = useUiStore(
    (state) => state.moveOverlayRadiusMultiplier,
  );
  const movePrecisionStep = useUiStore((state) => state.movePrecisionStep);
  const objectAngularDamping = useUiStore(
    (state) => state.objectAngularDamping,
  );
  const objectFriction = useUiStore((state) => state.objectFriction);
  const objectLinearDamping = useUiStore((state) => state.objectLinearDamping);
  const objectRestitution = useUiStore((state) => state.objectRestitution);
  const physicsEnabled = useUiStore((state) => state.physicsEnabled);
  const physicsRigidBodyType = useUiStore(
    (state) => state.physicsRigidBodyType,
  );
  const sceneBackgroundColor = useUiStore(
    (state) => state.sceneBackgroundColor,
  );
  const showFps = useUiStore((state) => state.showFps);
  const rotateTwistAxis = useUiStore((state) => state.rotateTwistAxis);
  const rotateGizmoRingColor = useUiStore(
    (state) => state.rotateGizmoRingColor,
  );
  const rotateGizmoSphereColor = useUiStore(
    (state) => state.rotateGizmoSphereColor,
  );
  const rotateArcballSensitivity = useUiStore(
    (state) => state.rotateArcballSensitivity,
  );
  const rotateUiOpacity = useUiStore((state) => state.rotateUiOpacity);
  const rotateUiRadiusPx = useUiStore((state) => state.rotateUiRadiusPx);
  const rotateWheelDirection = useUiStore(
    (state) => state.rotateWheelDirection,
  );
  const rotateWheelRotateStepDeg = useUiStore(
    (state) => state.rotateWheelRotateStepDeg,
  );
  const selectedSettingsMenu = useUiStore(
    (state) => state.selectedSettingsMenu,
  );
  const settingsOpen = useUiStore((state) => state.settingsOpen);
  const suppressObjectRotation = useUiStore(
    (state) => state.suppressObjectRotation,
  );
  const setFloorFriction = useUiStore((state) => state.setFloorFriction);
  const setFloorColor = useUiStore((state) => state.setFloorColor);
  const setFloorRestitution = useUiStore((state) => state.setFloorRestitution);
  const setFogColor = useUiStore((state) => state.setFogColor);
  const setGeneralSelectionOutlineColor = useUiStore(
    (state) => state.setGeneralSelectionOutlineColor,
  );
  const setGeneralSelectionOutlineThickness = useUiStore(
    (state) => state.setGeneralSelectionOutlineThickness,
  );
  const setGravityY = useUiStore((state) => state.setGravityY);
  const setGridMajorColor = useUiStore((state) => state.setGridMajorColor);
  const setGridMinorColor = useUiStore((state) => state.setGridMinorColor);
  const setMoveDepthWheelDirection = useUiStore(
    (state) => state.setMoveDepthWheelDirection,
  );
  const setMoveDepthWheelStep = useUiStore(
    (state) => state.setMoveDepthWheelStep,
  );
  const setMoveGridSnapStep = useUiStore((state) => state.setMoveGridSnapStep);
  const setMoveOverlayDisplayMode = useUiStore(
    (state) => state.setMoveOverlayDisplayMode,
  );
  const setMoveOverlayRadiusMultiplier = useUiStore(
    (state) => state.setMoveOverlayRadiusMultiplier,
  );
  const setMovePrecisionStep = useUiStore(
    (state) => state.setMovePrecisionStep,
  );
  const setObjectAngularDamping = useUiStore(
    (state) => state.setObjectAngularDamping,
  );
  const setObjectFriction = useUiStore((state) => state.setObjectFriction);
  const setObjectLinearDamping = useUiStore(
    (state) => state.setObjectLinearDamping,
  );
  const setObjectRestitution = useUiStore(
    (state) => state.setObjectRestitution,
  );
  const setPhysicsEnabled = useUiStore((state) => state.setPhysicsEnabled);
  const setPhysicsRigidBodyType = useUiStore(
    (state) => state.setPhysicsRigidBodyType,
  );
  const setSceneBackgroundColor = useUiStore(
    (state) => state.setSceneBackgroundColor,
  );
  const setRotateTwistAxis = useUiStore((state) => state.setRotateTwistAxis);
  const setRotateGizmoRingColor = useUiStore(
    (state) => state.setRotateGizmoRingColor,
  );
  const setRotateGizmoSphereColor = useUiStore(
    (state) => state.setRotateGizmoSphereColor,
  );
  const setRotateArcballSensitivity = useUiStore(
    (state) => state.setRotateArcballSensitivity,
  );
  const setRotateUiOpacity = useUiStore((state) => state.setRotateUiOpacity);
  const setRotateUiRadiusPx = useUiStore((state) => state.setRotateUiRadiusPx);
  const setRotateWheelDirection = useUiStore(
    (state) => state.setRotateWheelDirection,
  );
  const setRotateWheelRotateStepDeg = useUiStore(
    (state) => state.setRotateWheelRotateStepDeg,
  );
  const setSelectedSettingsMenu = useUiStore(
    (state) => state.setSelectedSettingsMenu,
  );
  const setShowFps = useUiStore((state) => state.setShowFps);
  const setSettingsOpen = useUiStore((state) => state.setSettingsOpen);
  const setSuppressObjectRotation = useUiStore(
    (state) => state.setSuppressObjectRotation,
  );

  const handleNumberChange =
    (setter: (value: number) => void) => (value: string) => {
      const parsedValue = parseNumberInput(value);
      if (parsedValue !== null) {
        setter(parsedValue);
      }
    };

  return (
    <aside aria-label="Settings window" className={panelClasses}>
      <button
        aria-expanded={settingsOpen}
        aria-label={settingsOpen ? "Collapse settings" : "Expand settings"}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-50 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-sky-300/50"
        onClick={() => setSettingsOpen(!settingsOpen)}
        type="button"
      >
        <span>Settings</span>
        <span className="inline-flex w-6 justify-center text-base leading-none text-sky-300">
          {settingsOpen ? "−" : "+"}
        </span>
      </button>
      {settingsOpen ? (
        <div className="grid max-h-[calc(100vh-10rem)] gap-4 overflow-y-auto border-t border-white/8 px-3 pb-3 pt-3 md:max-h-[calc(100vh-8rem)] md:grid-cols-[8.5rem_minmax(0,1fr)]">
          <nav
            aria-label="Settings sections"
            className="grid gap-2 md:content-start"
          >
            {settingsMenuItems.map((menuItem) => {
              const active = menuItem.key === selectedSettingsMenu;

              return (
                <button
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-sky-300/45 bg-sky-300/12 text-slate-50"
                      : "border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                  key={menuItem.key}
                  onClick={() => setSelectedSettingsMenu(menuItem.key)}
                  type="button"
                >
                  <span className="block text-sm font-semibold">
                    {menuItem.label}
                  </span>
                  <span className="mt-1 block text-[0.7rem] uppercase tracking-[0.14em] text-slate-400">
                    {menuItem.description}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="min-w-0 rounded-[1.2rem] border border-white/8 bg-black/10 p-3">
            {selectedSettingsMenu === "general" ? (
              <section
                aria-labelledby="general-settings"
                className="grid gap-3"
              >
                <h2 className={sectionHeadingClasses} id="general-settings">
                  全体
                </h2>
                <ToggleField
                  checked={physicsEnabled}
                  id="physics-toggle"
                  label="Physics"
                  onChange={setPhysicsEnabled}
                />
                <SectionNote>
                  Physics: 物理演算全体の有効化。OFF
                  で静的編集モードに切り替えます。
                </SectionNote>
                <ToggleField
                  checked={showFps}
                  id="show-fps-toggle"
                  label="Show FPS / FPS表示"
                  onChange={setShowFps}
                />
                <SectionNote>
                  Show FPS: 左下 HUD の FPS 行を表示します。OFF でもほかの HUD
                  情報はそのまま表示します。
                </SectionNote>
                <div className="grid gap-3 rounded-[1.1rem] border border-white/8 bg-white/[0.02] p-3">
                  <button
                    aria-controls="general-color-settings"
                    aria-expanded={generalColorsOpen}
                    aria-label={
                      generalColorsOpen
                        ? "Collapse color settings"
                        : "Expand color settings"
                    }
                    className={subsectionToggleClasses}
                    onClick={() => setGeneralColorsOpen((open) => !open)}
                    type="button"
                  >
                    <span>Colors / 色設定</span>
                    <span className="inline-flex w-6 justify-center text-base leading-none text-sky-300">
                      {generalColorsOpen ? "−" : "+"}
                    </span>
                  </button>
                  {generalColorsOpen ? (
                    <div className="grid gap-3" id="general-color-settings">
                      <ColorField
                        hint="Scene Background / 背景色。Canvas 背景とフォグに反映します。"
                        id="scene-background-color"
                        label="Scene Background / 背景色"
                        onChange={setSceneBackgroundColor}
                        value={sceneBackgroundColor}
                      />
                      <ColorField
                        hint="Fog Color / フォグ色。遠景のかかり方に反映します。"
                        id="fog-color"
                        label="Fog Color / フォグ色"
                        onChange={setFogColor}
                        value={fogColor}
                      />
                      <ColorField
                        hint="Selection Outline / 選択枠線。通常のオブジェクト選択アウトラインに反映します。"
                        id="general-selection-outline-color"
                        label="Selection Outline / 選択枠線"
                        onChange={setGeneralSelectionOutlineColor}
                        value={generalSelectionOutlineColor}
                      />
                      <NumberField
                        hint="Selection Outline Thickness / 選択枠線の太さ。画面投影ベースで反映します。目安 1-8。"
                        id="general-selection-outline-thickness"
                        label="Selection Outline Thickness / 選択枠線の太さ"
                        max="12"
                        min="1"
                        onChange={handleNumberChange(
                          setGeneralSelectionOutlineThickness,
                        )}
                        step="1"
                        value={generalSelectionOutlineThickness}
                      />
                      <ColorField
                        hint="Floor Color / 床面色。床そのものの色に反映します。"
                        id="floor-color"
                        label="Floor Color / 床面色"
                        onChange={setFloorColor}
                        value={floorColor}
                      />
                      <ColorField
                        hint="Grid Major / グリッド主線色。濃いガイド線に反映します。"
                        id="grid-major-color"
                        label="Grid Major / グリッド主線"
                        onChange={setGridMajorColor}
                        value={gridMajorColor}
                      />
                      <ColorField
                        hint="Grid Minor / グリッド補助線色。薄い補助線に反映します。"
                        id="grid-minor-color"
                        label="Grid Minor / グリッド補助線"
                        onChange={setGridMinorColor}
                        value={gridMinorColor}
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
            {selectedSettingsMenu === "physics" ? (
              <section
                aria-labelledby="physics-settings"
                className="grid gap-3"
              >
                <h2 className={sectionHeadingClasses} id="physics-settings">
                  物理演算
                </h2>
                <SectionNote>
                  推奨値は Rapier / react-three-rapier の公式 docs
                  を基準にした目安です。
                </SectionNote>
                <label
                  className="grid gap-2 text-sm text-slate-100/90"
                  htmlFor="rigid-body-type"
                >
                  <span>Rigid Body Mode / 剛体モード</span>
                  <select
                    className={fieldClasses}
                    id="rigid-body-type"
                    onChange={(event) => {
                      const nextRigidBodyType = event.target.value;
                      if (isRigidBodyType(nextRigidBodyType)) {
                        setPhysicsRigidBodyType(nextRigidBodyType);
                      }
                    }}
                    value={physicsRigidBodyType}
                  >
                    {rigidBodyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className={fieldHintClasses}>
                    Dynamic: 通常の物理対象。Fixed: 固定物。Kinematic:
                    ユーザー移動主体。通常は Dynamic 推奨。
                  </span>
                </label>
                <ToggleField
                  checked={suppressObjectRotation}
                  id="suppress-object-rotation"
                  label="Suppress Object Rotation / 回転抑制"
                  onChange={setSuppressObjectRotation}
                />
                <SectionNote>
                  OFF で自然回転を許可。固定したいオブジェクトだけ ON を推奨。
                </SectionNote>
                <NumberField
                  hint="Object Friction / 物体摩擦。公式では 0 で無摩擦、1 以上で強い摩擦。目安 0.2-1.5。"
                  id="object-friction"
                  label="Object Friction / 物体摩擦"
                  max="10"
                  min="0"
                  onChange={handleNumberChange(setObjectFriction)}
                  step="0.05"
                  value={objectFriction}
                />
                <NumberField
                  hint="Object Restitution / 物体反発。公式レンジは 0-1。目安 0-0.3、よく跳ねさせるなら 0.6+。"
                  id="object-restitution"
                  label="Object Restitution / 物体反発"
                  max="1"
                  min="0"
                  onChange={handleNumberChange(setObjectRestitution)}
                  step="0.01"
                  value={objectRestitution}
                />
                <NumberField
                  hint="Object Linear Damping / 並進減衰。公式では 0 が無減衰で、大きいほど減速。目安 0-2。"
                  id="object-linear-damping"
                  label="Object Linear Damping / 並進減衰"
                  max="10"
                  min="0"
                  onChange={handleNumberChange(setObjectLinearDamping)}
                  step="0.05"
                  value={objectLinearDamping}
                />
                <NumberField
                  hint="Object Angular Damping / 回転減衰。公式では 0 が無減衰で、大きいほど回転が止まりやすい。目安 0-2。"
                  id="object-angular-damping"
                  label="Object Angular Damping / 回転減衰"
                  max="10"
                  min="0"
                  onChange={handleNumberChange(setObjectAngularDamping)}
                  step="0.05"
                  value={objectAngularDamping}
                />
                <NumberField
                  hint="Gravity Y / 重力 Y。Rapier 例では -9.81 が標準。目安 -4 から -20。"
                  id="gravity-y"
                  label="Gravity Y / 重力 Y"
                  max="0"
                  min="-30"
                  onChange={handleNumberChange(setGravityY)}
                  step="0.1"
                  value={gravityY}
                />
                <NumberField
                  hint="Floor Friction / 床摩擦。公式では 1 未満が一般的で、1 以上は強い摩擦。目安 0.4-2。"
                  id="floor-friction"
                  label="Floor Friction / 床摩擦"
                  max="10"
                  min="0"
                  onChange={handleNumberChange(setFloorFriction)}
                  step="0.05"
                  value={floorFriction}
                />
                <NumberField
                  hint="Floor Restitution / 床反発。公式レンジは 0-1。床は 0-0.2 目安。"
                  id="floor-restitution"
                  label="Floor Restitution / 床反発"
                  max="1"
                  min="0"
                  onChange={handleNumberChange(setFloorRestitution)}
                  step="0.01"
                  value={floorRestitution}
                />
              </section>
            ) : null}
            {selectedSettingsMenu === "move-ui" ? (
              <section aria-labelledby="move-settings" className="grid gap-3">
                <h2 className={sectionHeadingClasses} id="move-settings">
                  Move UI
                </h2>
                <SectionNote>
                  Move UI:
                  オブジェクト移動操作の見え方とステップ量を調整します。
                </SectionNote>
                <label
                  className="grid gap-2 text-sm text-slate-100/90"
                  htmlFor="overlay-display-mode"
                >
                  <span>Overlay Display / オーバーレイ表示</span>
                  <select
                    className={fieldClasses}
                    id="overlay-display-mode"
                    onChange={(event) => {
                      const nextDisplayMode = event.target.value;
                      if (isOverlayDisplayMode(nextDisplayMode)) {
                        setMoveOverlayDisplayMode(nextDisplayMode);
                      }
                    }}
                    value={moveOverlayDisplayMode}
                  >
                    {overlayDisplayOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className={fieldHintClasses}>
                    操作用オーバーレイの表示モード。通常は 1 か 2 + 3
                    が扱いやすいです。
                  </span>
                </label>
                <NumberField
                  hint="Shift Depth Step / Shift 精密移動量。目安 0.02-0.2。"
                  id="precision-step"
                  label="Shift Depth Step / Shift 精密移動量"
                  max="2"
                  min="0.01"
                  onChange={handleNumberChange(setMovePrecisionStep)}
                  step="0.01"
                  value={movePrecisionStep}
                />
                <NumberField
                  hint="Ctrl Grid Snap Step / Ctrl グリッド吸着。目安 0.1-1。"
                  id="grid-snap-step"
                  label="Ctrl Grid Snap Step / Ctrl グリッド吸着"
                  max="4"
                  min="0.01"
                  onChange={handleNumberChange(setMoveGridSnapStep)}
                  step="0.01"
                  value={moveGridSnapStep}
                />
                <NumberField
                  hint="Overlay Radius Multiplier / オーバーレイ半径倍率。目安 1-1.5。"
                  id="overlay-radius-multiplier"
                  label="Overlay Radius Multiplier / オーバーレイ半径倍率"
                  max="4"
                  min="1"
                  onChange={handleNumberChange(setMoveOverlayRadiusMultiplier)}
                  step="0.1"
                  value={moveOverlayRadiusMultiplier}
                />
                <NumberField
                  hint="Depth Wheel Step / ホイール前後移動量。目安 0.05-0.4。"
                  id="depth-step"
                  label="Depth Wheel Step / ホイール前後移動量"
                  max="2"
                  min="0.01"
                  onChange={handleNumberChange(setMoveDepthWheelStep)}
                  step="0.01"
                  value={moveDepthWheelStep}
                />
                <label
                  className="grid gap-2 text-sm text-slate-100/90"
                  htmlFor="depth-direction"
                >
                  <span>Depth Wheel Direction / ホイール方向</span>
                  <select
                    className={fieldClasses}
                    id="depth-direction"
                    onChange={(event) => {
                      const nextDirection = event.target.value;
                      if (isDepthDirection(nextDirection)) {
                        setMoveDepthWheelDirection(nextDirection);
                      }
                    }}
                    value={moveDepthWheelDirection}
                  >
                    {depthDirectionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className={fieldHintClasses}>
                    normal: 通常方向。inverted: 反転方向。
                  </span>
                </label>
              </section>
            ) : null}
            {selectedSettingsMenu === "rotate-ui" ? (
              <section aria-labelledby="rotate-settings" className="grid gap-3">
                <h2 className={sectionHeadingClasses} id="rotate-settings">
                  Rotate UI
                </h2>
                <SectionNote>
                  Rotate UI: 画面基準の arcball 回転とホイール twist
                  の感度を調整します。
                </SectionNote>
                <ColorField
                  hint="Gizmo Sphere Color / ギズモ球体色。回転 UI の球体シェルに反映します。"
                  id="rotate-gizmo-sphere-color"
                  label="Gizmo Sphere Color / ギズモ球体色"
                  onChange={setRotateGizmoSphereColor}
                  value={rotateGizmoSphereColor}
                />
                <ColorField
                  hint="Gizmo Ring Color / ギズモリング色。回転 UI のリングに反映します。ドラッグ arc は白固定です。"
                  id="rotate-gizmo-ring-color"
                  label="Gizmo Ring Color / ギズモリング色"
                  onChange={setRotateGizmoRingColor}
                  value={rotateGizmoRingColor}
                />
                <NumberField
                  hint="Arcball Sensitivity / arcball ドラッグ回転の倍率。1x が基準、0.5-2.0x くらいが扱いやすい範囲です。"
                  id="rotate-arcball-sensitivity"
                  label="Arcball Sensitivity / arcball倍率"
                  max="4"
                  min="0.1"
                  onChange={handleNumberChange(setRotateArcballSensitivity)}
                  step="0.05"
                  value={rotateArcballSensitivity}
                />
                <NumberField
                  hint="UI Strength / ギズモ強度。1 を超えるとさらに見やすくします。"
                  id="rotate-ui-opacity"
                  label="UI Strength / ギズモ強度"
                  max="3"
                  min="0.05"
                  onChange={handleNumberChange(setRotateUiOpacity)}
                  step="0.01"
                  value={rotateUiOpacity}
                />
                <NumberField
                  hint="UI Radius Px / 画面上のギズモ半径。目安 96-220。"
                  id="rotate-ui-radius"
                  label="UI Radius Px / ギズモ半径"
                  max="320"
                  min="8"
                  onChange={handleNumberChange(setRotateUiRadiusPx)}
                  step="1"
                  value={rotateUiRadiusPx}
                />
                <NumberField
                  hint="Wheel Rotate Step / ホイール 1 ステップごとの twist 量。目安 4-30 deg。"
                  id="rotate-wheel-step"
                  label="Wheel Rotate Step / ホイール回転量"
                  max="90"
                  min="1"
                  onChange={handleNumberChange(setRotateWheelRotateStepDeg)}
                  step="1"
                  value={rotateWheelRotateStepDeg}
                />
                <label
                  className="grid gap-2 text-sm text-slate-100/90"
                  htmlFor="rotate-wheel-direction"
                >
                  <span>Wheel Direction / ホイール方向</span>
                  <select
                    className={fieldClasses}
                    id="rotate-wheel-direction"
                    onChange={(event) => {
                      const nextDirection = event.target.value;
                      if (isRotateDirection(nextDirection)) {
                        setRotateWheelDirection(nextDirection);
                      }
                    }}
                    value={rotateWheelDirection}
                  >
                    {rotateDirectionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className={fieldHintClasses}>
                    normal: 通常方向。reverse: 反転方向。
                  </span>
                </label>
                <label
                  className="grid gap-2 text-sm text-slate-100/90"
                  htmlFor="rotate-twist-axis"
                >
                  <span>Twist Axis / Twist 基準軸</span>
                  <select
                    className={fieldClasses}
                    id="rotate-twist-axis"
                    onChange={(event) => {
                      const nextAxis = event.target.value;
                      if (isRotateTwistAxis(nextAxis)) {
                        setRotateTwistAxis(nextAxis);
                      }
                    }}
                    value={rotateTwistAxis}
                  >
                    {rotateTwistAxisOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className={fieldHintClasses}>
                    twist を追従させるローカル基準軸。通常は +Y 推奨です。
                  </span>
                </label>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
