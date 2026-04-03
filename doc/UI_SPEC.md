# Object Move UI Current Specification

## 1. 位置づけ

このドキュメントは、`naname_ui` の現状実装に合わせた Object Move UI の仕様書である。
将来案や元仕様の広い射程は `doc/SPEC.md` に残し、このファイルでは「今、画面上でどう動くか」だけを扱う。

## 2. 現在のスコープ

### In Scope

- シーン上のオブジェクト表示
- オブジェクトの選択
- `screen-depth-drag` による移動
- ドラッグ中ホイールによる奥行き移動
- `screen-depth-drag` 中の plane overlay 表示
- 右上の Settings window
- 左下の状態 HUD
- `physicsEnabled` の on/off 切替

### Out of Scope

- `plane-overlay` モード
- Rotate UI
- ボーン、Control Point、IK
- Undo / history
- 永続保存
- 物理有効時のドラッグ編集

## 3. 画面構成

- ヘッダー:
  `Okuyuki-UI-Playground` とサブタイトルを表示する。
- 3D Scene:
  `PrototypeScene` が `Canvas`、ライト、床、オブジェクト、`OrbitControls` を持つ。
- Settings window:
  右上固定。開閉可能。
- SceneStatusHud:
  左下固定。選択状態と操作ヒントを表示する。

## 4. シーンオブジェクト

- 対象は `box` / `capsule` / `cone` / `cylinder` / `sphere` / `torus`。
- 各オブジェクトは `id`、`color`、`position`、`rotation`、`scale` を持つ。
- シーン定義は `useSceneStore` が単一情報源になる。

## 5. UI State

`useUiStore` は次の状態を持つ。

- `interactionState`: `idle | active | dragging`
- `selectedObjectId`
- `moveMode`: 現在は `screen-depth-drag` のみ
- `moveOverlayRadiusMultiplier`
- `moveDepthWheelStep`
- `moveDepthWheelDirection`: `normal | inverted`
- `movePrecisionStep`
- `moveGridSnapStep`
- `axisMagnetTarget`
- `physicsEnabled`
- `settingsOpen`

状態遷移は次の通り。

- `idle`:
  未選択状態。
- `active`:
  オブジェクト選択済み、ただしドラッグしていない状態。
- `dragging`:
  `screen-depth-drag` の移動中。

## 6. 選択と解除

- オブジェクト左クリックでそのオブジェクトを選択する。
- `physicsEnabled = false` のときは、同じ `pointerdown` からドラッグ開始まで入る。
- 何もない場所をクリックすると、ドラッグ中でない限り選択解除する。
- `Escape` で選択解除し、状態を `idle` に戻す。
- `physicsEnabled` を切り替えると、状態は `idle` に戻り選択もクリアされる。

## 7. `screen-depth-drag` の現在仕様

### 7.1 前提

- このモードだけが実装されている。
- `physicsEnabled = false` のときだけ移動できる。
- `OrbitControls` はドラッグ開始中だけ無効化される。

### 7.2 Drag Start

- 対象オブジェクトの現在位置を通る camera-facing plane を生成する。
- `pointerdown` 位置をその plane に投影し、交点を得る。
- オブジェクト位置と交点との差を `pointerOffset` として保存する。
- 以下を `Drag Session` として `ObjectMoveController` 内の ref に保持する。
  - `objectId`
  - `pointerId`
  - `plane`
  - `planeNormal`
  - `pointerOffset`
  - `startPoint`
  - `currentPoint`
  - `lastClientX`
  - `lastClientY`

### 7.3 Drag Move

- `window` の `pointermove` を監視する。
- 対応する `pointerId` の移動だけを受け付ける。
- 現在のポインタ座標を同じ plane に再投影する。
- `intersection + pointerOffset` を次のオブジェクト位置として `useSceneStore` に反映する。
- 修飾キーにより、最終位置へ次の補正をかける。
  - `Ctrl`: 結果の world position を XYZ すべて `moveGridSnapStep` 単位でスナップする。
  - `Shift`: 平面ドラッグには影響しない。
  - `Shift + Ctrl`: 他オブジェクトのローカル `x+ / x- / y+ / y- / z+ / z-` のうち最も近い 1 本の軸 ray に吸着する。
    直前の吸着先が近い範囲に残っている間は同じ軸方向・同じオブジェクトを優先し、ガタつきを抑える。

### 7.4 Depth Move

- ドラッグ中だけ `window` の `wheel` を受け付ける。
- 移動量は `(-deltaY / 100) * moveDepthWheelStep` を基準に計算する。
- `Shift` 押下中は `movePrecisionStep` をホイール奥行き移動量として使う。
- `moveDepthWheelDirection = inverted` のときは符号を反転する。
- plane 自体を `planeNormal` 方向へ前後移動する。
- その直後、現在の `clientX/clientY` で再投影し直してオブジェクト位置を更新する。
- これにより、ホイール操作中もオブジェクトがカーソル基準から横滑りしにくい。
- `wheel` イベントの位置が使えない場合は、最後に記録した `lastClientX / lastClientY` をフォールバックに使う。
- `Ctrl` / `Shift + Ctrl` の位置補正規則は通常ドラッグと同じ。

### 7.5 Drag Finish / Cancel

- 対応する `pointerup` で `dragging` を終了し、`active` に戻る。
- `pointercancel` では、選択が残っていれば `active`、なければ `idle` に戻る。
- ドラッグ終了時に `OrbitControls` を再有効化する。

### 7.6 Drag Plane Overlay

- 対象は `screen-depth-drag` 中のみで、`physicsEnabled = false` のときだけ表示する。
- overlay は Three.js scene 上に描く 3D ガイドであり、raycast 対象にはしない。
- overlay は次の要素で構成する。
  - 開始地点を中心にした半透明の円板
  - 開始地点から現在地点への細いライン
  - 開始地点マーカー
  - 現在地点マーカー
- 円板は 1 枚とは限らず、`moveOverlayDisplayMode` に応じて複数同時に表示できる。
  - `mode-1`: 1 のみ
  - `mode-2`: 2 のみ
  - `mode-3`: 3 のみ
  - `modes-2-3`: 2 と 3
  - `modes-1-2-3`: 1 と 2 と 3
- 円板の半径は `distance(startPoint, currentPoint) * moveOverlayRadiusMultiplier` を基準にし、最小値 `0.58` を下回らない。
- `moveOverlayRadiusMultiplier` の初期値は `1.15`。
- 各円板の向きは次の通り。
  - 1 (`camera-facing`):
    移動ベクトルに直交しつつ、できるだけ camera-facing を保つ。
  - 2 (`screen-vertical`):
    移動線を含みつつ、world `Y` を基準にした面になる。
  - 3 (`screen-horizontal`):
    移動線を含みつつ、できるだけ上向きになる面になる。
- 2 と 3 は、特異点付近で急に反転しにくくするため、直前の面法線を使って連続性を保つ。
- 円板 material の現在値は次の通り。
  - `transparent = true`
  - `opacity = 0.22`
  - `side = DoubleSide`
  - `depthTest = true`
  - `depthWrite = false`
- 円板の色は向きごとに固定する。
  - 1: `#6ac4ff`
  - 2: `#ffb46a`
  - 3: `#9be37a`
- `pointerup`、`pointercancel`、`Escape`、`physicsEnabled` 切替で overlay は消える。
- `1`、`2`、`3` キーを押すと、対応する単独表示へ切り替わる。

## 8. 見た目の現在仕様

- 選択中オブジェクトは emissive と material 値を上げ、スケールを `1.04x` にする。
- ドラッグ中オブジェクトはさらにスケールを `1.08x` にする。
- `screen-depth-drag` 中は、開始地点中心の円板 overlay を scene 上に表示する。
- overlay は display mode により 1 枚または複数枚の円板になる。
- overlay の円板はオブジェクトに隠れる設定で、前後関係の干渉が読めるようにしている。
- `SceneStatusHud` には次を表示する。
  - `Selected`
  - `State`
  - `Mode`
  - `Depth`
  - `Snap`
  - `Magnet`
  - `Overlay`
  - 補助メッセージ
- `Shift + Ctrl` で吸着中は、対象の軸 ray を scene 上に細いラインで表示する。
- 補助メッセージは `physicsEnabled` と選択有無で切り替える。

## 9. Settings window の現在仕様

右上の Settings window では次を変更できる。

- `Physics` の on/off
- `Mode`
  - 現状は `screen-depth-drag` のみ選択可能
- `Overlay Display`
  - `1`
  - `2`
  - `3`
  - `2 + 3`
  - `1 + 2 + 3`
- `Overlay Radius Multiplier`
- `Depth Wheel Step`
- `Shift Depth Step`
- `Ctrl Grid Snap Step`
- `Depth Direction`

パネル自体は開閉できる。

## 10. 物理との関係

- `physicsEnabled = true` のときは `Physics` / `RigidBody` 側の描画に切り替える。
- この状態では object dragging は停止する。
- HUD でも「Physics enabled: object dragging is paused.」を表示する。

## 11. 実装責務

### `App`

- ヘッダー
- `PrototypeScene`
- `SettingsWindow`
- `SceneStatusHud`

### `PrototypeScene`

- `Canvas`
- ライト、床、`ContactShadows`
- `OrbitControls`
- `SceneContents`

### `SceneContents`

- `physicsEnabled` に応じて static / physics 表示を切り替える。

### `SelectableSceneObject`

- static 表示時の選択見た目と `onPointerDown` を受け持つ。

### `ObjectMoveController`

- 選択開始
- drag session 管理
- pointer move / up / cancel
- wheel depth move
- overlay 用 state の生成
- `1` / `2` / `3` キーによる overlay 単独表示切替
- `OrbitControls` の停止 / 再開

### `DragPlaneOverlay`

- overlay 用の円板、ライン、マーカー描画
- display mode に応じた複数円板の描画
- 開始地点と現在地点から center / radius / surfaceNormal を算出して反映する

## 12. 既知の未実装事項

- `plane-overlay` モードは未実装
- Rotate UI は未実装
- 物理有効時の移動編集は未実装
- 操作履歴やリセットは未実装
