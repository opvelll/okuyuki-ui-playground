import type { Dispatch, SetStateAction } from "react";
import type { UiState } from "../../store/uiStore";
import {
  ColorField,
  NumberField,
  SectionNote,
  ToggleField,
  sectionBodyClasses,
  sectionHeadingClasses,
  subsectionToggleClasses,
} from "./SettingsFields";
import {
  alwaysSnapModeOptions,
  axisMagnetReferenceFrameOptions,
  depthDirectionOptions,
  gridSnapPatternOptions,
  isAlwaysSnapMode,
  isAxisMagnetReferenceFrame,
  isDepthDirection,
  isGridSnapPattern,
  isModelingTool,
  isOverlayDisplayMode,
  isRigidBodyType,
  isRotateDirection,
  isRotateDragReleaseBehavior,
  isRotateTwistAxis,
  modelingToolOptions,
  overlayDisplayOptions,
  rigidBodyOptions,
  rotateDirectionOptions,
  rotateDragReleaseBehaviorOptions,
  rotateTwistAxisOptions,
} from "./settingsSchema";

type SettingsWindowState = UiState;

type SettingsSectionProps = {
  handleNumberChange: (
    setter: (value: number) => void,
  ) => (value: string) => void;
  settings: SettingsWindowState;
};

export function GeneralSettingsSection({
  generalColorsOpen,
  handleNumberChange,
  setGeneralColorsOpen,
  settings,
}: SettingsSectionProps & {
  generalColorsOpen: boolean;
  setGeneralColorsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <section aria-labelledby="general-settings" className={sectionBodyClasses}>
      <h2 className={sectionHeadingClasses} id="general-settings">
        全体
      </h2>
      <ToggleField
        checked={settings.physicsEnabled}
        id="physics-toggle"
        label="Physics"
        onChange={settings.setPhysicsEnabled}
      />
      <SectionNote>
        Physics: 物理演算全体の有効化。OFF で静的編集モードに切り替えます。
      </SectionNote>
      <ToggleField
        checked={settings.showFps}
        id="show-fps-toggle"
        label="Show FPS / FPS表示"
        onChange={settings.setShowFps}
      />
      <SectionNote>
        Show FPS: 左下 HUD の FPS 行を表示します。OFF でもほかの HUD
        情報はそのまま表示します。
      </SectionNote>
      <div className="grid gap-4 border border-white/8 bg-white/[0.02] p-3">
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
          <div className="grid gap-4" id="general-color-settings">
            <ColorField
              hint="Scene Background / 背景色。Canvas 背景とフォグに反映します。"
              id="scene-background-color"
              label="Scene Background / 背景色"
              onChange={settings.setSceneBackgroundColor}
              value={settings.sceneBackgroundColor}
            />
            <ColorField
              hint="Fog Color / フォグ色。遠景のかかり方に反映します。"
              id="fog-color"
              label="Fog Color / フォグ色"
              onChange={settings.setFogColor}
              value={settings.fogColor}
            />
            <ColorField
              hint="Selection Outline / 選択枠線。通常のオブジェクト選択アウトラインに反映します。"
              id="general-selection-outline-color"
              label="Selection Outline / 選択枠線"
              onChange={settings.setGeneralSelectionOutlineColor}
              value={settings.generalSelectionOutlineColor}
            />
            <NumberField
              hint="Selection Outline Thickness / 選択枠線の太さ。画面投影ベースで反映します。目安 1-8。"
              id="general-selection-outline-thickness"
              label="Selection Outline Thickness / 選択枠線の太さ"
              max="12"
              min="1"
              onChange={handleNumberChange(
                settings.setGeneralSelectionOutlineThickness,
              )}
              step="1"
              value={settings.generalSelectionOutlineThickness}
            />
            <ColorField
              hint="Floor Color / 床面色。床そのものの色に反映します。"
              id="floor-color"
              label="Floor Color / 床面色"
              onChange={settings.setFloorColor}
              value={settings.floorColor}
            />
            <ColorField
              hint="Grid Major / グリッド主線色。濃いガイド線に反映します。"
              id="grid-major-color"
              label="Grid Major / グリッド主線"
              onChange={settings.setGridMajorColor}
              value={settings.gridMajorColor}
            />
            <ColorField
              hint="Grid Minor / グリッド補助線色。薄い補助線に反映します。"
              id="grid-minor-color"
              label="Grid Minor / グリッド補助線"
              onChange={settings.setGridMinorColor}
              value={settings.gridMinorColor}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PhysicsSettingsSection({
  handleNumberChange,
  settings,
}: SettingsSectionProps) {
  return (
    <section aria-labelledby="physics-settings" className={sectionBodyClasses}>
      <h2 className={sectionHeadingClasses} id="physics-settings">
        物理演算
      </h2>
      <SectionNote>
        推奨値は Rapier / react-three-rapier の公式 docs を基準にした目安です。
      </SectionNote>
      <label
        className="grid gap-1.5 text-sm text-slate-100/90"
        htmlFor="rigid-body-type"
      >
        <span>Rigid Body Mode / 剛体モード</span>
        <select
          className="min-h-9 w-full border border-white/12 bg-slate-900/72 px-2.5 text-[0.76rem] text-slate-50 outline-none transition focus:border-sky-200/60 focus:ring-2 focus:ring-sky-300/40"
          id="rigid-body-type"
          onChange={(event) => {
            const nextRigidBodyType = event.target.value;
            if (isRigidBodyType(nextRigidBodyType)) {
              settings.setPhysicsRigidBodyType(nextRigidBodyType);
            }
          }}
          value={settings.physicsRigidBodyType}
        >
          {rigidBodyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-[0.68rem] leading-5 text-slate-300/72">
          Dynamic: 通常の物理対象。Fixed: 固定物。Kinematic:
          ユーザー移動主体。通常は Dynamic 推奨。
        </span>
      </label>
      <ToggleField
        checked={settings.suppressObjectRotation}
        id="suppress-object-rotation"
        label="Suppress Object Rotation / 回転抑制"
        onChange={settings.setSuppressObjectRotation}
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
        onChange={handleNumberChange(settings.setObjectFriction)}
        step="0.05"
        value={settings.objectFriction}
      />
      <NumberField
        hint="Object Restitution / 物体反発。公式レンジは 0-1。目安 0-0.3、よく跳ねさせるなら 0.6+。"
        id="object-restitution"
        label="Object Restitution / 物体反発"
        max="1"
        min="0"
        onChange={handleNumberChange(settings.setObjectRestitution)}
        step="0.01"
        value={settings.objectRestitution}
      />
      <NumberField
        hint="Object Linear Damping / 並進減衰。公式では 0 が無減衰で、大きいほど減速。目安 0-2。"
        id="object-linear-damping"
        label="Object Linear Damping / 並進減衰"
        max="10"
        min="0"
        onChange={handleNumberChange(settings.setObjectLinearDamping)}
        step="0.05"
        value={settings.objectLinearDamping}
      />
      <NumberField
        hint="Object Angular Damping / 回転減衰。公式では 0 が無減衰で、大きいほど回転が止まりやすい。目安 0-2。"
        id="object-angular-damping"
        label="Object Angular Damping / 回転減衰"
        max="10"
        min="0"
        onChange={handleNumberChange(settings.setObjectAngularDamping)}
        step="0.05"
        value={settings.objectAngularDamping}
      />
      <NumberField
        hint="Gravity Y / 重力 Y。Rapier 例では -9.81 が標準。目安 -4 から -20。"
        id="gravity-y"
        label="Gravity Y / 重力 Y"
        max="0"
        min="-30"
        onChange={handleNumberChange(settings.setGravityY)}
        step="0.1"
        value={settings.gravityY}
      />
      <NumberField
        hint="Floor Friction / 床摩擦。公式では 1 未満が一般的で、1 以上は強い摩擦。目安 0.4-2。"
        id="floor-friction"
        label="Floor Friction / 床摩擦"
        max="10"
        min="0"
        onChange={handleNumberChange(settings.setFloorFriction)}
        step="0.05"
        value={settings.floorFriction}
      />
      <NumberField
        hint="Floor Restitution / 床反発。公式レンジは 0-1。床は 0-0.2 目安。"
        id="floor-restitution"
        label="Floor Restitution / 床反発"
        max="1"
        min="0"
        onChange={handleNumberChange(settings.setFloorRestitution)}
        step="0.01"
        value={settings.floorRestitution}
      />
    </section>
  );
}

export function MoveUiSettingsSection({
  handleNumberChange,
  settings,
}: SettingsSectionProps) {
  return (
    <section aria-labelledby="move-settings" className={sectionBodyClasses}>
      <h2 className={sectionHeadingClasses} id="move-settings">
        Move UI
      </h2>
      <SectionNote>
        Move UI: オブジェクト移動操作の見え方とステップ量を調整します。
      </SectionNote>
      <ToggleField
        checked={settings.moveVerticalDropGuide}
        id="move-vertical-drop-guide"
        label="Vertical Drop Guide / 落下ガイド線"
        onChange={settings.setMoveVerticalDropGuide}
      />
      <SectionNote>
        ON で移動中のオブジェクト真下に、床へ向かう world Y
        軸基準の縦ガイド線を表示します。
      </SectionNote>
      <SelectField
        hint="操作用オーバーレイの表示モード。通常は 1 か 2 + 3 が扱いやすいです。"
        id="overlay-display-mode"
        label="Overlay Display / オーバーレイ表示"
        onChange={(value) => {
          if (isOverlayDisplayMode(value)) {
            settings.setMoveOverlayDisplayMode(value);
          }
        }}
        options={overlayDisplayOptions}
        value={settings.moveOverlayDisplayMode}
      />
      <NumberField
        hint="Shift Depth Step / Shift 精密移動量。目安 0.02-0.2。"
        id="precision-step"
        label="Shift Depth Step / Shift 精密移動量"
        max="2"
        min="0.01"
        onChange={handleNumberChange(settings.setMovePrecisionStep)}
        step="0.01"
        value={settings.movePrecisionStep}
      />
      <NumberField
        hint="Interval Snap Step / 一定間隔スナップ幅。常時スナップと Ctrl + Shift の両方に適用。目安 0.1-1。"
        id="grid-snap-step"
        label="Interval Snap Step / 一定間隔スナップ幅"
        max="4"
        min="0.01"
        onChange={handleNumberChange(settings.setMoveGridSnapStep)}
        step="0.01"
        value={settings.moveGridSnapStep}
      />
      <SelectField
        hint="通常ドラッグ時に使うスナップ種別。Ctrl は他オブジェクト軸、Ctrl + Shift は一定間隔スナップを一時的に有効化します。"
        id="move-always-snap-mode"
        label="Always Snap / 常時スナップ"
        onChange={(value) => {
          if (isAlwaysSnapMode(value)) {
            settings.setMoveAlwaysSnapMode(value);
          }
        }}
        options={alwaysSnapModeOptions}
        value={settings.moveAlwaysSnapMode}
      />
      <SectionNote>
        一定間隔スナップは xyz 全軸か xz 平面だけかを切り替えできます。xz
        を選ぶと高さ y は保持されます。
      </SectionNote>
      <SelectField
        hint="local xyz: 対象オブジェクトの回転後ローカル軸。world xyz: ワールド固定軸。"
        id="move-axis-magnet-reference-frame"
        label="Magnet Axis Space / 軸吸着の基準"
        onChange={(value) => {
          if (isAxisMagnetReferenceFrame(value)) {
            settings.setMoveAxisMagnetReferenceFrame(value);
          }
        }}
        options={axisMagnetReferenceFrameOptions}
        value={settings.moveAxisMagnetReferenceFrame}
      />
      <SelectField
        hint="xyz は全軸を刻み幅に合わせます。xz plane は床面だけ揃えて y 高さは維持します。"
        id="move-grid-snap-pattern"
        label="Interval Snap Pattern / 一定間隔パターン"
        onChange={(value) => {
          if (isGridSnapPattern(value)) {
            settings.setMoveGridSnapPattern(value);
          }
        }}
        options={gridSnapPatternOptions}
        value={settings.moveGridSnapPattern}
      />
      <NumberField
        hint="Overlay Radius Multiplier / オーバーレイ半径倍率。目安 1-1.5。"
        id="overlay-radius-multiplier"
        label="Overlay Radius Multiplier / オーバーレイ半径倍率"
        max="4"
        min="1"
        onChange={handleNumberChange(settings.setMoveOverlayRadiusMultiplier)}
        step="0.1"
        value={settings.moveOverlayRadiusMultiplier}
      />
      <NumberField
        hint="Depth Wheel Step / ホイール前後移動量。目安 0.05-0.4。"
        id="depth-step"
        label="Depth Wheel Step / ホイール前後移動量"
        max="2"
        min="0.01"
        onChange={handleNumberChange(settings.setMoveDepthWheelStep)}
        step="0.01"
        value={settings.moveDepthWheelStep}
      />
      <SelectField
        hint="normal: 通常方向。inverted: 反転方向。"
        id="depth-direction"
        label="Depth Wheel Direction / ホイール方向"
        onChange={(value) => {
          if (isDepthDirection(value)) {
            settings.setMoveDepthWheelDirection(value);
          }
        }}
        options={depthDirectionOptions}
        value={settings.moveDepthWheelDirection}
      />
    </section>
  );
}

export function RotateUiSettingsSection({
  handleNumberChange,
  settings,
}: SettingsSectionProps) {
  return (
    <section aria-labelledby="rotate-settings" className={sectionBodyClasses}>
      <h2 className={sectionHeadingClasses} id="rotate-settings">
        Rotate UI
      </h2>
      <SectionNote>
        Rotate UI: 画面基準の arcball 回転とホイール twist の感度を調整します。
      </SectionNote>
      <ColorField
        hint="Gizmo Sphere Color / ギズモ球体色。回転 UI の球体シェルに反映します。"
        id="rotate-gizmo-sphere-color"
        label="Gizmo Sphere Color / ギズモ球体色"
        onChange={settings.setRotateGizmoSphereColor}
        value={settings.rotateGizmoSphereColor}
      />
      <ColorField
        hint="Gizmo Ring Color / ギズモリング色。回転 UI のリングに反映します。ドラッグ arc は白固定です。"
        id="rotate-gizmo-ring-color"
        label="Gizmo Ring Color / ギズモリング色"
        onChange={settings.setRotateGizmoRingColor}
        value={settings.rotateGizmoRingColor}
      />
      <NumberField
        hint="Arcball Sensitivity / arcball ドラッグ回転の倍率。1x が基準、0.5-2.0x くらいが扱いやすい範囲です。"
        id="rotate-arcball-sensitivity"
        label="Arcball Sensitivity / arcball倍率"
        max="4"
        min="0.1"
        onChange={handleNumberChange(settings.setRotateArcballSensitivity)}
        step="0.05"
        value={settings.rotateArcballSensitivity}
      />
      <NumberField
        hint="UI Strength / ギズモ強度。1 を超えるとさらに見やすくします。"
        id="rotate-ui-opacity"
        label="UI Strength / ギズモ強度"
        max="3"
        min="0.05"
        onChange={handleNumberChange(settings.setRotateUiOpacity)}
        step="0.01"
        value={settings.rotateUiOpacity}
      />
      <NumberField
        hint="UI Radius Px / 画面上のギズモ半径。目安 96-220。"
        id="rotate-ui-radius"
        label="UI Radius Px / ギズモ半径"
        max="320"
        min="8"
        onChange={handleNumberChange(settings.setRotateUiRadiusPx)}
        step="1"
        value={settings.rotateUiRadiusPx}
      />
      <NumberField
        hint="Wheel Rotate Step / ホイール 1 ステップごとの twist 量。目安 4-30 deg。"
        id="rotate-wheel-step"
        label="Wheel Rotate Step / ホイール回転量"
        max="90"
        min="1"
        onChange={handleNumberChange(settings.setRotateWheelRotateStepDeg)}
        step="1"
        value={settings.rotateWheelRotateStepDeg}
      />
      <NumberField
        hint="Angle Snap Step / Ctrl + Shift 中の回転角スナップ間隔。arcball と twist の両方に適用します。"
        id="rotate-angle-snap-step"
        label="Angle Snap Step / 角度スナップ間隔"
        max="90"
        min="1"
        onChange={handleNumberChange(settings.setRotateAngleSnapStepDeg)}
        step="1"
        value={settings.rotateAngleSnapStepDeg}
      />
      <SelectField
        hint="keep selected: ドラッグ後も選択と空間固定を維持。clear selection: ドラッグ終了で解除。"
        id="rotate-drag-release-behavior"
        label="Drag Release Behavior / ドラッグ後の選択"
        onChange={(value) => {
          if (isRotateDragReleaseBehavior(value)) {
            settings.setRotateDragReleaseBehavior(value);
          }
        }}
        options={rotateDragReleaseBehaviorOptions}
        value={settings.rotateDragReleaseBehavior}
      />
      <SelectField
        hint="normal: 通常方向。reverse: 反転方向。"
        id="rotate-wheel-direction"
        label="Wheel Direction / ホイール方向"
        onChange={(value) => {
          if (isRotateDirection(value)) {
            settings.setRotateWheelDirection(value);
          }
        }}
        options={rotateDirectionOptions}
        value={settings.rotateWheelDirection}
      />
      <SelectField
        hint="twist を追従させるローカル基準軸。通常は +Y 推奨です。"
        id="rotate-twist-axis"
        label="Twist Axis / Twist 基準軸"
        onChange={(value) => {
          if (isRotateTwistAxis(value)) {
            settings.setRotateTwistAxis(value);
          }
        }}
        options={rotateTwistAxisOptions}
        value={settings.rotateTwistAxis}
      />
    </section>
  );
}

export function ModelingSettingsSection({
  handleNumberChange,
  settings,
}: SettingsSectionProps) {
  return (
    <section aria-labelledby="modeling-settings" className={sectionBodyClasses}>
      <h2 className={sectionHeadingClasses} id="modeling-settings">
        Modeling
      </h2>
      <SectionNote>
        Modeling: select / vertex / line / camera の既定挙動を調整します。
      </SectionNote>
      <SelectField
        hint="左上 toolbar の既定サブツール。select / vertex / line 中は Space で一時的に camera に切り替わります。"
        id="modeling-default-tool"
        label="Default Tool / 既定ツール"
        onChange={(value) => {
          if (isModelingTool(value)) {
            settings.setModelingTool(value);
          }
        }}
        options={modelingToolOptions}
        value={settings.modelingTool}
      />
      <ToggleField
        checked={settings.modelingPointerVertexSnapEnabled}
        id="modeling-pointer-vertex-snap-enabled"
        label="Pointer Vertex Snap / 頂点吸着"
        onChange={settings.setModelingPointerVertexSnapEnabled}
      />
      <NumberField
        hint="Pointer Vertex Snap Distance / 近くの既存頂点そのものへ吸い付く距離。目安 0.15-0.8。"
        id="modeling-pointer-vertex-snap-distance"
        label="Pointer Vertex Snap Distance / 頂点吸着距離"
        max="4"
        min="0"
        onChange={handleNumberChange(
          settings.setModelingPointerVertexSnapDistance,
        )}
        step="0.01"
        value={settings.modelingPointerVertexSnapDistance}
      />
      <ToggleField
        checked={settings.modelingPointerAxisSnapEnabled}
        id="modeling-pointer-axis-snap-enabled"
        label="Pointer Axis Snap / 軸吸着"
        onChange={settings.setModelingPointerAxisSnapEnabled}
      />
      <NumberField
        hint="Pointer Axis Snap Distance / 他の頂点の x / y / z 座標へ吸い付く距離。目安 0.05-0.3。"
        id="modeling-pointer-axis-snap-distance"
        label="Pointer Axis Snap Distance / 軸吸着距離"
        max="4"
        min="0"
        onChange={handleNumberChange(
          settings.setModelingPointerAxisSnapDistance,
        )}
        step="0.01"
        value={settings.modelingPointerAxisSnapDistance}
      />
      <ToggleField
        checked={settings.modelingPointerGridSnapEnabled}
        id="modeling-pointer-grid-snap-enabled"
        label="Pointer Grid Snap / 等間隔スナップ"
        onChange={settings.setModelingPointerGridSnapEnabled}
      />
      <NumberField
        hint="Shift Wheel Precision Scale / Shift を押している間の奥行き移動倍率と grid snap step 倍率。既定値 0.1 で通常の 1/10。精密 grid step は下限 0.001 でクランプします。"
        id="modeling-pointer-depth-precision-scale"
        label="Shift Wheel Precision Scale / Shiftホイール精密倍率"
        max="1"
        min="0.01"
        onChange={handleNumberChange(
          settings.setModelingPointerDepthPrecisionScale,
        )}
        step="0.01"
        value={settings.modelingPointerDepthPrecisionScale}
      />
      <NumberField
        hint="Pointer Grid Snap Step / 軸吸着しなかった成分に適用する等間隔ステップ。"
        id="modeling-pointer-grid-snap-step"
        label="Pointer Grid Snap Step / 等間隔ステップ"
        max="4"
        min="0.01"
        onChange={handleNumberChange(settings.setModelingPointerGridSnapStep)}
        step="0.01"
        value={settings.modelingPointerGridSnapStep}
      />
      <SelectField
        hint="line ツールのドラッグ中に表示する preview panel の組み合わせ。"
        id="modeling-line-overlay-display"
        label="Line Overlay / lineドラッグ表示"
        onChange={(value) => {
          if (isOverlayDisplayMode(value)) {
            settings.setModelingLineOverlayDisplayMode(value);
          }
        }}
        options={overlayDisplayOptions}
        value={settings.modelingLineOverlayDisplayMode}
      />
      <ToggleField
        checked={settings.modelingPointerVisibleInCameraTool}
        id="modeling-pointer-visible-in-camera-tool"
        label="Pointer Visible In Camera Tool / カメラツールでも表示"
        onChange={settings.setModelingPointerVisibleInCameraTool}
      />
      <NumberField
        hint="Pointer Panel Radius / 3D ポインタ面の半径。目安 0.4-1.6。"
        id="modeling-pointer-panel-radius"
        label="Pointer Panel Radius / 面の半径"
        max="8"
        min="0.2"
        onChange={handleNumberChange(settings.setModelingPointerPanelRadius)}
        step="0.05"
        value={settings.modelingPointerPanelRadius}
      />
      <NumberField
        hint="Vertical Axis Floor Y / このワールド Y より下では 3D ポインタの縦軸を表示しません。既定値 0 はグリッド面です。"
        id="modeling-pointer-vertical-axis-floor-y"
        label="Vertical Axis Floor Y / 縦軸の下限高さ"
        max="32"
        min="-32"
        onChange={handleNumberChange(
          settings.setModelingPointerVerticalAxisFloorY,
        )}
        step="0.1"
        value={settings.modelingPointerVerticalAxisFloorY}
      />
    </section>
  );
}

function SelectField<Value extends string>({
  hint,
  id,
  label,
  onChange,
  options,
  value,
}: {
  hint: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly { label: string; value: Value }[];
  value: Value;
}) {
  return (
    <label className="grid gap-1.5 text-sm text-slate-100/90" htmlFor={id}>
      <span>{label}</span>
      <select
        className="min-h-9 w-full border border-white/12 bg-slate-900/72 px-2.5 text-[0.76rem] text-slate-50 outline-none transition focus:border-sky-200/60 focus:ring-2 focus:ring-sky-300/40"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="text-[0.68rem] leading-5 text-slate-300/72">{hint}</span>
    </label>
  );
}
