# Object Move UI Specification

## 1. Purpose

このドキュメントは、`doc/SPEC.md` を現在の `naname_ui` 向けに縮小・再構成した UI 仕様である。
対象は「ボーン先端の編集」ではなく「シーン上のオブジェクト移動」とし、初期実装では Move UI のみを扱う。

## 2. Scope

### In Scope

- シーン上のオブジェクト選択
- 選択オブジェクトの移動 UI
- `screen-depth-drag` を既定値とする移動操作
- `zustand` と `react-three/fiber` に合わせた責務分割
- 選択状態とドラッグ中の視覚フィードバック

### Out of Scope

- ボーン、Control Point、IK、Virtual Root
- Rotate UI
- `plane-overlay` の実装
- ボーン差分 telemetry
- 物理演算中の厳密なドラッグ同期

`plane-overlay` は将来拡張候補として名前だけ残すが、初期実装では UI とロジックを持たない。

## 3. Terms

- `Scene Object`:
  シーン上で選択・移動できる対象。現在の `box` / `sphere` / `cone` などを含む。
- `Selected Object`:
  現在 UI 操作対象となっている `Scene Object`。
- `Move Mode`:
  オブジェクト移動方式。初期実装では `screen-depth-drag` のみ。
- `screen-depth-drag`:
  ドラッグ中のスクリーン座標に追従して平面移動し、ホイールでカメラ前後方向へ奥行きを調整する方式。
- `Drag Session`:
  1 回の `pointerdown` から `pointerup` までの一時的な計算状態。

## 4. UX Goal

- クリックで対象を選び、そのままドラッグ開始できる。
- 画面上のマウス移動に対して、選択オブジェクトが素直に追従する。
- 奥行き調整はドラッグ中のホイールだけに限定し、通常時のホイールはカメラ操作に使わない。
- 既存の `OrbitControls` と競合しない。

## 5. Interaction Model

### 5.1 States

- `Idle`:
  未選択。移動ガイドは非表示。
- `Active`:
  オブジェクト選択済み。選択ハイライトと移動可能状態を表示。
- `Dragging`:
  `screen-depth-drag` による移動中。

### 5.2 Selection

- オブジェクト左クリックで `Selected Object` を更新し、`Active` に入る。
- すでに選択中のオブジェクトを左ドラッグした場合、そのまま `Dragging` を開始する。
- 未選択オブジェクトを左クリックした場合も、同一 `pointerdown` から選択とドラッグ開始を許可する。
- 空間クリックで `Idle` に戻す。
- `Escape` で `Idle` に戻す。

### 5.3 Drag Start

- `pointerdown` 時に対象オブジェクトの現在ワールド位置を取得する。
- カメラ forward とオブジェクト位置から、camera-facing plane を 1 枚生成する。
- その plane へのレイ交点を初期 pointer 位置として保存する。
- `OrbitControls` はドラッグ開始時に一時停止する。

### 5.4 Drag Move

- `pointermove` ごとに現在 pointer を raycast し、camera-facing plane との交点を再計算する。
- オブジェクト位置は、その交点に追従して更新する。
- ドラッグ中の表示ガイドとして、選択オブジェクト中心に薄い plane を表示してよい。
- 高頻度更新は `zustand` に逐次流さず、controller 内の ref と対象 `Object3D` 更新を優先する。

### 5.5 Depth Move

- `screen-depth-drag` 中のホイールで、選択オブジェクトをカメラ前後方向へ移動する。
- `moveDepthWheelStep` を `delta / 100` に対する移動量として使う。
- 初期値の向きは `normal` とし、「前ホイールで奥、手前ホイールで手前」とする。
- 非ドラッグ時のホイールには移動処理を割り当てない。

### 5.6 Drag Finish

- `pointerup` で現在位置を確定し、`Active` に戻る。
- 初期実装では `moveDropCommitEnabled = false` 相当とし、ドラッグ後も選択を維持する。
- `OrbitControls` を再度有効化する。

## 6. Visual Rules

- `Selected Object` は色・輪郭・スケールのいずれかで強調する。
- `Dragging` 中は通常の選択表示に加え、移動 plane または drag helper を表示する。
- `screen-depth-drag` では DOM overlay を持たない。
- HUD が必要な場合は、まずは画面上部または左上に「Selected / Mode / Depth step」だけを出す。

## 7. Settings

初期実装で持つ設定は次の最小セットとする。

- `moveMode`:
  既定値は `screen-depth-drag`。他モードは予約値扱い。
- `moveDepthWheelStep`:
  ホイール 1 単位あたりの奥行き移動量。
- `moveDepthWheelDirection`:
  `normal | inverted`。

初期実装では UI 上に設定切替を並べなくてもよい。まずは store の固定値または簡易 toggle で十分とする。

## 8. Architecture Decision

### 8.1 Store Responsibilities

`zustand` は「UI が参照する安定状態」と「コミット済みの scene state」を持つ。
ドラッグ中の一時ベクトル計算や pointer 差分は store に入れない。

#### `useUiStore`

保持対象:

- `physicsEnabled`
- `selectedObjectId`
- `interactionState`: `idle | active | dragging`
- `moveMode`
- `moveDepthWheelStep`
- `moveDepthWheelDirection`

責務:

- 選択状態の更新
- モードと設定値の保持
- Escape や UI toggle に反応するアクション提供

#### `useSceneStore`

新規追加前提の store とし、保持対象は以下。

- `objects`: `id`, `kind`, `color`, `position`, `rotation`, `scale`
- `updateObjectTransform(id, partialTransform)`
- `resetObjectTransform(id)`

責務:

- 画面に並ぶオブジェクト定義の単一情報源
- ドラッグ完了時の transform commit
- 将来の保存・履歴機能の受け皿

### 8.2 Drag Session Placement

`Drag Session` は `react-three/fiber` 側の controller component 内で `useRef` 管理する。

保持対象:

- 対象 object id
- start world position
- active plane
- pointer capture 状態
- 現在の depth offset
- `OrbitControls` の一時停止状態

理由:

- `pointermove` ごとの global store 更新を避ける
- 3D ベクトルや `THREE.Plane` を React render state に載せない
- drag 中の再 render を最小化する

### 8.3 Event Routing

`doc/SPEC.md` のような `AppEvent` 正規化レイヤは初期実装では作らない。
このプロジェクトでは、まず `react-three/fiber` の pointer event を直接使う。

- オブジェクト選択: mesh/group の `onPointerDown`
- ドラッグ更新: controller 内で pointer capture 後の `onPointerMove`
- ドラッグ終了: `onPointerUp`
- ホイール奥行き: `onWheel`
- `Escape`: `window` に対する keydown listener

イベントの意味付けは component で行い、結果だけを store action に流す。

## 9. Suggested Component Structure

初期実装では以下の構造を採用する。

- `App`
  - ヘッダー、トグル、HUD を配置する
- `PrototypeScene`
  - `Canvas`、camera、light、`OrbitControls` を持つ
- `SceneObjectList`
  - `useSceneStore` の `objects` を描画する
- `SelectableSceneObject`
  - 1 オブジェクト分の mesh 表示と選択見た目を担当する
- `ObjectMoveController`
  - raycast、drag session、depth wheel、`OrbitControls` の停止/再開を担当する

初期段階では、シーン描画と操作管理を同じファイルに詰め込みすぎない。
少なくとも「オブジェクト描画」と「移動操作 controller」は分離する。

## 10. Physics Handling

現在のプロジェクトは `physicsEnabled` により static / dynamic 表示を切り替えている。
初期実装の object move UI は、`physicsEnabled = false` を主対象とする。

- `physicsEnabled = false`:
  通常どおり選択・移動を許可する。
- `physicsEnabled = true`:
  初期実装では move UI を無効化するか、選択のみ許可して移動開始を抑止する。

理由:

- 動的 `RigidBody` と手動ドラッグの競合を避ける
- まず UX と state 管理を固める

物理あり編集は次段階で `kinematicPosition` などを用いて別仕様で扱う。

## 11. Data Model

`ShapeSpec` は将来的に次のような `SceneObject` へ置き換える。

```ts
type SceneObject = {
  id: string;
  kind: "box" | "capsule" | "cone" | "cylinder" | "sphere" | "torus";
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};
```

`id` を持たせることで、描画 key と選択 state を安定化する。

## 12. Implementation Order

1. `ShapeSpec` に `id` を追加し、描画キーを安定化する
2. `selectedObjectId` と `interactionState` を `useUiStore` に追加する
3. `physicsEnabled = false` 時だけ選択ハイライトを出す
4. `ObjectMoveController` を追加し、`screen-depth-drag` を実装する
5. HUD に最小限の mode / selection 表示を足す

## 13. Future Extensions

- `plane-overlay` の追加
- Rotate UI の追加
- transform reset / undo
- physics 有効時の kinematic drag
- 選択対象の複数化
