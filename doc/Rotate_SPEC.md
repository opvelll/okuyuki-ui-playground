# Rotate UI Specification

## 1. Purpose
3Dオブジェクト単体を、画面上で直感的かつ安定して回転させるための回転UI仕様を定義する。

この文書は移植用の単独仕様であり、これだけ読めば Rotate UI の表示、入力、回転計算、適用順序を実装できることを目的とする。

## 2. Scope
- 対象は単一オブジェクト。
- ボーン、階層IK、Virtual Root、曲げ伝播は扱わない。
- Undo/Redo や history 集約は扱わない。
- drag method は `screen-turntable` 固定とする。

## 3. Terms
- `Target Object`:
  回転対象の3Dオブジェクト。
- `Rotate UI`:
  対象オブジェクトの周囲に表示される回転球ギズモ。
- `Pivot`:
  回転中心。通常は対象オブジェクトの原点。
- `Radius Px`:
  画面上での回転球半径。実装ではこれをワールド半径へ変換して使う。
- `Swing`:
  ドラッグで発生する主回転。
- `Twist`:
  ホイールで加算する、現在向きに対する軸回転。

## 4. State Machine
- `Idle`:
  対象未選択。Rotate UI は表示しない。
- `Active`:
  対象選択済み。Rotate UI を表示する。まだドラッグしていない状態。
- `Dragging`:
  回転球を左ドラッグ中。ドラッグ量に応じてリアルタイムに回転を適用する。

### State Transitions
- `Idle -> Active`
  対象オブジェクトを選択したとき。
- `Active -> Dragging`
  回転球ヒット位置で左ドラッグを開始したとき。
- `Dragging -> Active`
  `pointerup` 時。
- `Active -> Idle`
  対象選択解除時、または `Escape` 時。

## 5. Display
- Rotate UI は 3D 球体ギズモとして表示する。
- Move UI 用の平面、2Dオーバーレイ、ハンドルは表示しない。
- 球体中心は `Pivot` に一致する。
- 球体半径は `rotateUiRadiusPx` を基準に、現在のカメラと Pivot の距離からワールド半径へ変換して決める。
- ドラッグ中のみ、開始方向から現在方向までの弧を表示する。

## 6. Input
### 6.1 Selection / Activation
- 対象オブジェクトを選択すると `Active` に入る。
- `Active` 中は Rotate UI を表示し続ける。

### 6.2 Drag Start
- 左ボタンの `pointerdown` が回転球にヒットした場合のみドラッグ開始できる。
- ドラッグ開始時に以下を行う。
  - `pointer capture` を取得する。
  - カメラ操作など競合する入力を一時停止する。
  - ドラッグ開始時のオブジェクト回転 `startObjectWorldQuat` を保存する。
  - ドラッグ開始ベクトル `startVecWorld` を保存する。
  - turntable 用の開始スクリーン座標 `startClientX`, `startClientY` を保存する。
  - `swingQuatWorld`, `twistQuatWorld`, `twistAngleRad` を初期化する。

### 6.3 Drag Update
- `pointermove` ごとに、現在ポインタと開始ポインタの差分を取る。
  - `dx = currentClientX - startClientX`
  - `dy = currentClientY - startClientY`
- `dx`, `dy` は `rotateUiRadiusPx` で正規化する。
- 回転量は screen-turntable 方式で計算する。
  - `yawAngle = (dx / radiusPx) * (PI * 0.5)`
  - `pitchAngle = (dy / radiusPx) * (PI * 0.5)`
- 回転軸は常に現在カメラ基準。
  - `yaw`: camera up 軸まわり
  - `pitch`: camera right 軸まわり
- 合成順序は `yaw` の後に `pitch`。
  - `swingQuatWorld = yawQuat * pitchQuat`
- `swing` は毎フレーム、開始姿勢基準で再計算する。
  - 前フレーム結果へ増分加算しない。
  - そのためドラッグ経路依存の累積ドリフトを避けられる。

### 6.4 Wheel Twist
- ホイールで `twist` 回転を加算する。
- ドラッグ中も `Active` 中も有効。
- 非ドラッグ時は、ポインタ位置が回転球にヒットしている場合のみ有効。
- 1ステップあたりの回転量は `rotateWheelRotateStepDeg` を使う。
- ホイール方向の符号は `rotateWheelDirection` で反転可能とする。
- ホイール入力のたびに `twistAngleRad` を加算し、`twistQuatWorld` を更新する。

### 6.5 Finish / Cancel
- `pointerup` でドラッグを終了し、`Dragging` から `Active` に戻る。
- `Escape` で `Idle` に戻る。
- この仕様では history を持たないため、終了時の履歴確定処理は不要。

## 7. Rotation Math
### 7.1 Drag Hit Vector
- ドラッグ開始時、回転球とポインタレイの交点を取り、その点から Pivot を引いた正規化ベクトルを `startVecWorld` とする。
- `screen-turntable` では以後の回転計算は `dx`, `dy` 基準で行うが、弧描画には `startVecWorld` を使う。

### 7.2 Swing Quaternion
- `cameraUp` と `cameraRight` はカメラ姿勢からワールド空間へ変換した単位ベクトルを使う。
- `yawQuat = quat(axis = cameraUp, angle = yawAngle)`
- `pitchQuat = quat(axis = cameraRight, angle = pitchAngle)`
- `swingQuatWorld = normalize(yawQuat * pitchQuat)`

### 7.3 Twist Quaternion
- `twist` は「swing 適用後の向き」に追従する軸回転として扱う。
- 実装時は、オブジェクトローカルの基準軸を1本決める。
  - 推奨既定値はローカル `+Y` 軸。
  - 移植先の都合で `+X` または `+Z` を採用してもよいが、製品内では固定する。
- `orientationAfterSwing = swingQuatWorld * startObjectWorldQuat`
- `twistAxisWorld = localTwistAxis` を `orientationAfterSwing` でワールドへ回した軸
- `twistQuatWorld = quat(axis = twistAxisWorld, angle = twistAngleRad)`

### 7.4 Final Rotation
- 最終回転は以下の順で合成する。
- `targetWorldQuat = twistQuatWorld * swingQuatWorld * startObjectWorldQuat`
- 毎フレーム、この `targetWorldQuat` を対象オブジェクトへ適用する。

## 8. Arc Rendering
- 弧はドラッグ中のみ表示する。
- 弧は `startVecWorld` を起点に、`yaw/pitch` の合成経路を `t = 0..1` でサンプリングして生成する。
- 各サンプル点は以下で求める。
  - `sampleYaw = quat(cameraUp, yawAngle * t)`
  - `samplePitch = quat(cameraRight, pitchAngle * t)`
  - `sampleVec = normalize((sampleYaw * samplePitch) * startVecWorld)`
  - `arcPoint = pivotWorld + sampleVec * radiusWorld`
- サンプル数は角度に応じて増減してよいが、最小 24 点程度を推奨する。

## 9. Recommended Settings
- `rotateDragMethod`: `screen-turntable`
- `rotateUiRadiusPx`: `140`
- `rotateWheelRotateStepDeg`: `16`
- `rotateWheelDirection`: `reverse`
- `localTwistAxis`: `+Y`

## 10. Implementation Notes
- 判定は 2D UI ではなく 3D の回転球に対する ray-sphere intersection で行う。
- `rotateUiRadiusPx` は小さすぎると操作が不安定になるため、実装上は `min 8px` 程度の下限を持たせるとよい。
- ドラッグ開始中は pointer capture を使い、ポインタが球の外へ出ても回転を継続できるようにする。
- カメラ回転とオブジェクト回転の同時発火は避ける。
- `screen-turntable` の回転感度は半径基準で一定になるようにする。半径が大きいほど同じポインタ移動に対する回転は小さくなる。

## 11. Non-Goals
- ボーン回転
- 親子階層への回転伝播
- IK
- Virtual Root
- Undo/Redo
- 履歴のデバウンス集約
- Move UI との切替仕様
