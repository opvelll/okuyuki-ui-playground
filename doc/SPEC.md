# Control Point UI Specification (Move / Rotate)

## 1. Purpose
2D/3D入力でControl Point (CP) を安定して編集するため、`move` と `rotate` の2系統UIを定義する。

## 2. Terms
- `Control Point (CP)`:
  3D操作対象点（現実装は主にボーン先端）。
- `Move UI`:
  Move系UIの総称。`plane-overlay` と `screen-depth-drag` の2モードを持つ。
- `Move UI Mode`:
  `Move UI` 内部の操作モード。`plane-overlay` は従来のMP/UIP/UIHベース、`screen-depth-drag` はスクリーン追従 + ホイール前後移動。
- `Rotate UI`:
  3D球体ギズモ + 回転リング（X/Y/Z）を使った回転UI。
- `Move Plane (MP)`:
  CP移動を拘束する3D平面。
- `UI Plane (UIP)`:
  画面オーバーレイ円UI。
- `Virtual Root`:
  右クリックで一時指定する仮想ルートボーン。回転適用時の曲げ伝播基準として使う。
  Move UIでは同じ右クリック指定を移動面の中心点アンカーとして解釈する。

## 3. State Machine
- `Idle`:
  非選択状態。UI非表示。
- `Active`:
  CP選択済み。`uiKind` (`move` / `rotate`) に応じたUIを表示。
- `Dragging`:
  Move: 現在の `moveUiMode` に応じた移動ドラッグ中。
  Rotate: 回転球ドラッグ中。

### Exit Conditions
- `Escape`（Active/Dragging -> Idle）
- Dragging中の`pointerup`
  - Rotate UI: 常に姿勢を確定して `Idle` へ
  - Move UI: `moveDropCommitEnabled = true` なら位置を確定して `Idle` へ
  - Move UI: `moveDropCommitEnabled = false` なら位置を1操作として確定したうえで `Active` を維持

## 4. UI Kind Switching
### 4.1 Keyboard
- `r`キーで `move <-> rotate` をトグル。
- 適用範囲:
  - `Idle`: 次回CP選択から反映。
  - `Active`: 同一CPで即時切替。
  - `Dragging`: 現在ドラッグを終了して`Active`へ戻してから切替。

### 4.2 Middle Click (`event.button === 1`)
- シーン上のCPを中クリック:
  - そのCPを対象に `move <-> rotate` をトグルし、`Active`化。
- Move UIのUIP上で中クリック:
  - クリック位置にCPがあればそのCPを対象に同じくトグル。
  - CP未ヒットでも、UIP中心近傍（`max(10px, radius*0.12)`以内）なら現在選択CPを対象にトグル。
- いずれも、現在が`Dragging`なら一度ドラッグを終了してから切替。

## 5. Move UI
Move UI は `moveUiMode` により2種類の操作モードを持つ。

### 5.1 Move UI Mode Switching
- `moveUiMode` は UI setting として保持する。
- 切替候補:
  - `plane-overlay`
  - `screen-depth-drag`
- 画面上の setting UI から切り替える。
- `uiKind = move` かつ `Active` 中に切り替えた場合は、同一CPに対して即時反映する。
- `uiKind = rotate` 中に切り替えた場合は、次回 `move` に入ったときから反映する。

### 5.2 `plane-overlay`
- 既存仕様を維持する。
- MP/UIP/UIH表示。
- UIP内ドラッグで平面移動。
- UIP内ホイールでMP法線回転。
  - 通常時は `moveWheelRotateStepDeg` を `delta / 100` に対する回転量として使う。
  - `Shift` を押している間は、`moveWheelRotateStepDeg * moveWheelRotateShiftMultiplier` を使う。
  - `Ctrl` を押している間は、`moveWheelRotateCtrlStepDeg` を使う。
  - `Ctrl` と `Shift` が同時に押されている場合は `Ctrl` を優先する。
- UIP円周端（半径近傍）を左ドラッグすると `uiRadiusPx` を変更できる。
- 2D/3Dガイド、Reset/Flip/Exit有効。
- `1/2/3/4` はMove UI時のみ法線クイック設定に使用。
- `5` は現在のMove Planeを表側正面から見る位置へカメラを移動する。
- 右クリックアンカーがある場合、UIP中心とMove Plane原点はそのアンカーCPになる。
- 移動対象は常に現在選択中CPで、アンカーCP自体は動かさない。
- `moveDropCommitEnabled` により、ドラッグ終了時の遷移先を切り替えられる。
  - `true`:
    従来どおり `pointerup` で位置を確定し、Move UI を閉じて `Idle` に戻る。
  - `false`:
    `pointerup` で位置は1操作として確定するが、Move UI は閉じずに同一CPの `Active` 状態を維持する。
    続けて再ドラッグ、右クリックアンカー変更、Reset/Flip/Exit を行える。
- `moveDragStartPoseMode` により、Move drag開始時にどのposeを基準に計算するかを切り替えられる。
  - `current`:
    drag開始時点の現在poseをそのまま基準に Move / IK 計算を始める。
  - `activation`:
    そのCPが `Active` になった時点のposeを baseline として保持し、Move drag開始時は毎回そのbaselineへ一度rollbackしてから Move / IK 計算を始める。
    `moveDropCommitEnabled` の `true/false` に関係なく同じ規則で動作する。
    見た目上は前回操作後poseが残っていても、次回dragの初期姿勢は常に activation 時の姿勢になる。
    camera操作や`controls change`でoverlayを再投影しても、Move Plane原点とUIP中心は現在poseではなく baseline 位置を維持する。
- `plane-overlay` のドラッグ入力は、drag開始時点の pointer と handle の相対関係を基準に解釈する。
  - drag開始直後に pointer が動いていなくても、handle はその場で再投影先へ引き戻されない。
  - clip recording の `snap to head pose` が drag中に発火した場合も、この相対基準をその時点で張り直す。
  - そのため、snap後は「snap後poseを起点に、その後の pointer 移動量だけが反映される」。
- Dragging中の説明UIには、実際に変化したボーン一覧を表示する。
  - Move UIでは各ボーンの local position `X/Y/Z` を表示する。
  - さらに IK 等で local rotation も変化したボーンは `Rot X/Y/Z`（Euler deg）を併記する。
  - 表示対象はドラッグ開始時 snapshot との差分があるボーンのみで、solver対象IDではなく実変化ベースで判定する。
- 半径ドラッグは CP 移動ドラッグ（`mode = Dragging`）とは別系統で処理し、終了後も `Active` を維持する。

### 5.3 `screen-depth-drag`
- UIP/UIH は表示しない。
- Active 中は、選択CP位置を中心に camera-facing な MP を表示する。
- Scene 上のCP左クリックは、選択と drag 開始を同じ pointerdown で行う。
- `Active` 中の選択CPを左ドラッグすると、そのCPをドラッグ開始対象にする。
- ドラッグ中のポインタ移動では、CPは「カメラ正面に平行な平面」上でスクリーン座標に追従する。
  - ドラッグ開始時のCP位置から、カメラ forward 方向の距離を `screenDepthDragPlaneDistance` として保持する。
  - `pointermove` ごとに、現在のスクリーン座標から camera-facing plane との交点を再計算し、その点を移動targetとする。
- ドラッグ中のホイールでは、CPをカメラ基準の奥行き方向へ移動する。
  - `moveDepthWheelStep` を `delta / 100` に対するワールド移動量として使う。
  - `moveDepthWheelDirection` により奥/手前の向きを反転できる。
  - `normal` では「前ホイールで奥、手前ホイールで手前」になるよう扱う。
  - 可視化中の MP は「ドラッグ開始地点」と「現在のCP位置」を同じ面上に含むよう再構成し、奥行き差を面で読み取りやすくする。
  - 開始地点から現在CPまでの距離が既定半径を超えた場合は、MP の可視半径を自動拡張し、CP が面外に出ないようにする。
- ホイール前後移動は Dragging 中のみ有効で、`Active` 中の非ドラッグホイールには何も割り当てない。
- `moveDropCommitEnabled` / `moveDragStartPoseMode` / IK / drag telemetry / pose history の規則は `plane-overlay` と同じ。
- 右クリックアンカーは state と色表示は共有するが、このモードでは移動中心UIを出さないため移動計算には使わない。
- `1/2/3/4/5` の Move Plane 系ショートカットはこのモードでは無効。

### 5.4 Settings
- `moveUiMode`:
  Move UI の内部モード切替。
- `moveWheelRotateStepDeg`:
  `plane-overlay` 時のMove Plane回転量。
- `moveWheelRotateShiftMultiplier`:
  `plane-overlay` 時に `Shift + ホイール` したとき、通常の `moveWheelRotateStepDeg` に乗算する倍率。
- `moveWheelRotateCtrlStepDeg`:
  `plane-overlay` 時に `Ctrl + ホイール` したときの固定回転量。
- `moveWheelDirection`:
  `plane-overlay` 時のMove Plane回転向き。
- `moveDepthWheelStep`:
  `screen-depth-drag` 時の奥行き移動量。
- `moveDepthWheelDirection`:
  `screen-depth-drag` 時の奥行き移動向き反転。

### 5.5 Implementation Note (Current)
- UIP overlay は React が runtime snapshot から描画する。
- UIPの `pointerdown` / `wheel` は React component から正規化した `AppEvent` として runtime に送る。
- UIP円周端の `pointerdown` は `UIP_RADIUS_POINTER_DOWN` として分岐し、runtime側で半径ドラッグとして扱う。
- `Reset` / `Flip` / `Exit` はそれぞれ `OVERLAY_RESET` / `OVERLAY_FLIP` / `OVERLAY_DEACTIVATE` を送る。
- runtime / runtime feature は overlay の DOM 要素を保持しない。
- Overlay state は center / handle / radius / guide visibility などの純データのみを持つ。
- `screen-depth-drag` は overlay DOM を使わず、scene pointer / wheel event だけで処理する。

## 6. Rotate UI
### 6.1 Display
- MP/UIP/UIHは非表示。
- 3D球体ギズモとX/Y/Z回転リングを表示。
- 球体中心は選択ボーン原点。
- 球体半径は画面上の `rotateUiRadiusPx` から、カメラ深度に応じたワールド半径に変換して算出。

### 6.2 Start
- `Idle`でCP左クリック -> `Active`。
- `rotate + Active` で球体ヒット時のみ左ドラッグ開始。
- ドラッグ開始時にポインタキャプチャを取得し、OrbitControlsを無効化。

### 6.3 Drag Vector Sampling (`rotateDragMethod`)
- `arcball`:
  - 画面座標を `rotateUiRadiusPx` 基準の仮想球（外側は`z=0`）に投影して方向ベクトルを作る。
  - カメラ姿勢でワールドへ変換して使用。
- `screen-turntable`:
  - `pointerdown` 時のスクリーン座標を基準に、ドラッグの `dx, dy` をカメラ基準2軸の回転へ変換する。
  - `dx` は camera up 軸まわり、`dy` は camera right 軸まわりの回転として合成する。
  - `swing` はドラッグ開始姿勢に対して毎フレーム再計算するため、経路依存の累積ドリフトを起こさない。

### 6.4 Drag to Swing (Axis-Angle)
- `arcball`:
  - `pointerdown`: 開始ベクトル `u` を保存。
  - `pointermove`: 現在ベクトル `v` を更新。
  - 回転軸角:
    - `axis = normalize(u x v)`
    - `angle = atan2(|u x v|, u・v)`
  - `u` と `v` がほぼ反平行のときは `u` に直交する補助軸で `angle = π`。
- `screen-turntable`:
  - `pointerdown` 時の画面位置を保存する。
  - `pointermove` ごとに `dx, dy` を `rotateUiRadiusPx` で正規化し、camera up / camera right 軸まわりの回転として合成する。
  - `swing` は開始姿勢基準で再計算する。

### 6.5 Arc Rendering
- ドラッグ中のみ弧を表示。
- `arcball`:
  - 弧サンプリングは `u` を `axis` 周りに `0..angle` 回転して生成する。
- `screen-turntable`:
  - `yaw/pitch` の合成経路を `t=0..1` でサンプリングし、その時点の方向ベクトル列から弧を生成する。

### 6.6 Rotation Application (Swing + Twist)
- ドラッグ開始時のボーンワールド回転 `startBoneWorldQuat` を保存。
- ドラッグで `swingQuatWorld` を更新。
- ホイールで `twistAngleRad` を加算し、`twistQuatWorld` を更新。
  - `Dragging` 中は現在ドラッグ姿勢に twist を加算する。
  - `Active` 中の非ドラッグ時も有効。ただし回転球ヒット位置が取れる場合にのみ開始する。
  - 非ドラッグホイールは `rotateWheelHistoryDebounceMs` ミリ秒のデバウンスで1件の履歴に集約する。
  - 1ステップは `rotateWheelRotateStepDeg` と `rotateWheelDirection` を使用。
  - 各フレームの加算量は `[-MAX_STEP, +MAX_STEP]` にクランプ。
- 最終目標回転:
  - `targetWorldQuat = twistQuatWorld * swingQuatWorld * startBoneWorldQuat`
- 反映はワールドFK入力（親回転を考慮してローカル変換）。

### 6.7 Finish
- `pointerup` でドラッグ状態をクリアし、CPを非アクティブ化して `Idle` へ遷移。

### 6.8 Drag Telemetry
- Dragging中の説明UIには、実際に変化したボーン一覧を表示する。
- Rotate UIでは各ボーンの local rotation `X/Y/Z`（Euler deg）を表示する。
- Virtual Root の影響等で local position も変化したボーンは `Pos X/Y/Z` を併記する。
- 表示対象はドラッグ開始時 snapshot との差分があるボーンのみ。

## 7. Right Click Virtual Root と曲げ方仕様
### 7.1 Virtual Root Toggle (`event.button === 2`)
- シーン上のCP右クリックで、そのCPを共通アンカーに設定/解除トグルする。
- Rotate UIではこのアンカーを `Virtual Root` として解釈する。
- Move UIではこのアンカーを移動面中心点として解釈する。
- ただし `moveUiMode = screen-depth-drag` では、アンカーは色表示と共有stateには残るが、移動target計算には使わない。
- 同じCPを再度右クリックすると解除（`null`化）。
- 選択変更やUI切替では解除しない。
- Dragging中は Virtual Root / anchor の切替は行わない。
  - ただし右ボタン入力自体は animation recording の入力としては処理されうる。
- Move UIがActive中なら、別CPへの右クリックで仮originをその場で差し替える。
- その際、Move Planeは現在選択中CPを含むよう自動再構成する。
- 面向き候補は画面上方向ベースと画面右方向ベースの2つを作り、現在の面向きに近い方を採用する。
- この自動面向き補正をoffにした場合は、`Plane Init` 設定で決まる初期法線をそのまま使う。
- `Plane Init = last` の場合のみ、その結果として `lastPlaneNormal` が使われる。
- 自動法線変更結果は `lastPlaneNormal` には保存しない。
- 右クリック時はコンテキストメニューを抑止。
- Virtual Root CPは専用色（`cpVirtualRoot`）で表示し、選択色より優先。

### 7.2 回転時の曲げ伝播（Virtual Rootあり）
- Rotate UIの回転適用時、Virtual Rootが設定済みなら `setBoneWorldQuaternionWithVirtualRoot` を優先使用。
- アルゴリズム概要:
  1. 現在姿勢の各ボーン世界行列を取得し、ボーン木を無向グラフ化。
  2. Virtual Root起点でBFSし、一時的な親子関係（仮ルート木）を構築。
  3. 通常ケース:
     - 選択ボーンの仮親が元の親と同じなら、選択ボーンを `targetWorldQuat` に合わせて仮ルート木を再構築。
  4. 逆枝ケース（opposite-branch）:
     - 選択ボーンの仮親が元の親と異なる場合、`previousTargetWorldQuat` との差分回転を選択点周りに作成し、
       `selectedBone` を切り離したときに元の親側へ連なる枝にだけ伝播させる。
  5. 再構築した世界行列を元の親子関係のローカル変換へ戻して適用。
- 仮ルート解法が失敗した場合（非finite行列など）は通常の単体ボーン回転適用へフォールバック。

## 8. Input Priority
1. Dragging中の`pointermove`/`pointerup`処理（Move/Rotate）
2. シーン右クリック（Virtual Rootトグル）
3. シーン/UIP中クリック（UI種別トグル + CPアクティブ化）
4. Rotate UI左クリック球ヒット時のドラッグ開始
5. `r`キー UI切替
6. Move UI中のホイールMP回転
7. Move UI `screen-depth-drag` 中のホイール前後移動
8. Move UI `plane-overlay` 中の `1/2/3/4` 法線クイック設定
9. Move UI `plane-overlay` 中の `5` カメラ正面合わせ
10. 空間左クリックのCP選択

### 8.1 Event Routing Note (Current)
- シーン入力は React adapter (`scene` / `window` / `controls`) から `AppEvent` 化する。
- UIP overlay 入力は React `Overlay` component から `AppEvent` 化する。
- `UPDATE_SETTING` は React から runtime に直接到達する。

## 9. Defaults
- `uiKind` 初期値: `rotate`
- `showDragTelemetry` 初期値: `true`
- `r`キー: 常時トグル
- `moveDropCommitEnabled` 初期値: `true`
- `moveDragStartPoseMode` 初期値: `activation`
- `moveUiMode` 初期値: `plane-overlay`
- `initialNormalMode` 初期値: `last`
- `anchorRetargetReorientsPlane` 初期値: `false`
- `moveWheelRotateShiftMultiplier` 初期値: `0.5`
- `moveWheelRotateCtrlStepDeg` 初期値: `15`
- `moveDepthWheelStep` 初期値: `12`
- `moveDepthWheelDirection` 初期値: `normal`
- `wheelAxisLockEnabled` 初期値: `true`
- `rotateDragMethod` 初期値: `screen-turntable`
- `twistAxisMode` 初期値: `child`
- `rotateWheelHistoryDebounceMs` 初期値: `180`
- Rotate pivot: 選択ボーン原点
- Rotate反映: ドラッグ中リアルタイム
- Virtual Root 初期値: `null`（未設定）

## 10. Shortcut Legend / Drag Telemetry
- 左上の説明UI（shortcut legend）は以下の関連セクションに分けて表示する。
  - 共通操作
  - 現在のUI種別に対応する操作説明（Move UI / Rotate UI）
  - Dragging中のみ表示されるボーン telemetry
- Move UI の説明には少なくとも以下を表示する。
  - `plane-overlay` 時:
    - UIP内左ドラッグでボーン移動
    - UIP円周端ドラッグで UI 直径調整
    - UIP内ホイールで移動面回転
    - `Shift + ホイール` で細かい回転
    - `Ctrl + ホイール` で固定角度回転
    - `1/2/3/4` の法線クイック設定
    - `5` のカメラ正面合わせ
  - `screen-depth-drag` 時:
    - CP左ドラッグでスクリーン追従移動
    - ドラッグ中ホイールで前後移動
- Rotate UI の説明には少なくとも以下を表示する。
  - 回転球ドラッグで回転
  - ホイールで twist 回転
  - 非ドラッグ時ホイールは球ヒット位置が必要
- bone telemetry は独立 HUD ではなく説明UI内に統合する。
- `showDragTelemetry` 設定で bone telemetry セクションの表示有無を切り替えられる。

## 11. History (Undo/Redo)
- 対象:
  - Pose（Move/Rotate操作で確定したボーン姿勢）
  - UI Settings（`UiSettings` 全項目）
- 記録単位:
  - Move/Rotate ドラッグは `pointerup` ごとに1件。
  - Move UI の半径ドラッグは `uiRadiusPx` の settings 変更として `pointerup` 時に1件記録する。
  - Rotate UIの非ドラッグホイールは180msデバウンスで1件に集約。
  - no-op差分は記録しない。
- 実行:
  - `Ctrl/Cmd + Z` で Undo。
  - `Ctrl + Y` または `Ctrl/Cmd + Shift + Z` で Redo。
  - コントロールパネルの Undo/Redo ボタンでも実行可能。
- `moveDragStartPoseMode = activation` の drag開始時rollbackは、activation baseline への復帰として扱い、Undo/Redo履歴には追加しない。
- 制約:
  - Dragging中は Undo/Redo を実行しない。
  - モデル再ロード成功時に履歴をクリアする。
  - 履歴はセッション内メモリのみ（永続化しない）。

## 12. Settings Inventory (Current)
- Move:
  - `moveUiMode`
  - `uiToPlaneRatio`
  - `uiRadiusPx`
  - `initialNormalMode`
  - `anchorRetargetReorientsPlane`
  - `moveDropCommitEnabled`
  - `moveDragStartPoseMode`
  - `moveWheelRotateStepDeg`
  - `moveWheelRotateShiftMultiplier`
  - `moveWheelRotateCtrlStepDeg`
  - `moveWheelDirection`
  - `moveDepthWheelStep`
  - `moveDepthWheelDirection`
  - `wheelAxisLockEnabled`
  - `ikEnabled`
  - `ikSolver`
  - `ikStrength`
  - `ikChainMaxDepth`
  - `moveTrailEnabled`
  - `moveTrailLengthMs`
  - `moveTrailSampleFps`
- Rotate:
  - `rotateUiRadiusPx`
  - `rotateDragMethod`
  - `twistAxisMode`
  - `rotateWheelRotateStepDeg`
  - `rotateWheelHistoryDebounceMs`
  - `rotateWheelDirection`
  - `rotateTrailEnabled`
  - `rotateTrailLengthMs`
  - `rotateTrailSampleFps`

## 13. Related Documents
- Animation: `doc/ANIMATION.md`
