# Plane Overlay Next Plan

## 1. 目的

次段階では、`screen-depth-drag` 中の位置関係を見やすくするために `plane-overlay` を追加する。
ここでいう `plane-overlay` は、移動開始地点と現在のドラッグ位置を同じ面上に含む円形の板を表示する機能を指す。

## 2. ねらう UX

- ドラッグ開始地点がどこだったかを見失いにくくする。
- 現在位置が開始地点からどれだけ離れたかを、面の広がりで直感的に読めるようにする。
- ホイールで奥行きを変えたときも、「今どの面上で動いているか」が把握できるようにする。
- overlay は操作補助であり、マウス入力を奪わない。

## 3. 初回実装の前提

- 対象モードはまず `screen-depth-drag` のみとする。
- 表示タイミングは `dragging` 中のみとする。
- DOM overlay ではなく Three.js scene 上の 3D 表示とする。
- overlay 自体は操作対象にせず、`pointer-events` 相当は持たない。

## 4. 表示仕様案

### 4.1 面の向き

- 面法線は現在の drag plane の `planeNormal` をそのまま使う。
- つまり、ドラッグ開始時は camera-facing plane。
- ホイールで奥行き移動した後も、平行移動した同じ向きの plane を使う。

### 4.2 円の中心

- 円の中心は「移動開始地点」と「現在地点」の中点を基本案とする。
- これにより、両端点が円の中に自然に収まりやすい。

### 4.3 円の半径

- 半径は `distance(start, current) / 2 + margin` を基本案とする。
- `margin` は見た目の余白として固定値を足す。
- 距離が極小のときでも板が消えないように `minRadius` を持たせる。

### 4.4 補助表示

- 円板本体は薄い半透明色にする。
- 可能なら以下も同時表示する。
  - 開始地点の小マーカー
  - 現在地点の小マーカー
  - 開始地点から現在地点への細いライン

初回は円板だけでも成立するが、開始点マーカーは優先度が高い。

## 5. 状態とデータ追加案

`ObjectMoveController` の drag session に次を追加する。

- `startPoint`
  - ドラッグ開始時のオブジェクト位置
- `currentPoint`
  - 現在反映済みのオブジェクト位置

補助的に、overlay 描画用の派生値を毎フレーム計算する。

- `overlayCenter`
- `overlayRadius`
- `overlayVisible`

これらは store に永続化せず、controller か専用表示 component の props で持つ。

## 6. コンポーネント構成案

- `ObjectMoveController`
  - drag session 更新
  - overlay 用 props 生成
- `DragPlaneOverlay` もしくは `PlaneOverlayGuide`
  - 円板メッシュ
  - 開始点 / 現在点マーカー
  - optional なガイドライン

配置は `PrototypeScene` 配下、`ObjectMoveController` と同じ scene graph 上に置く。

## 7. 実装ステップ

1. `Drag Session` に `startPoint` と `currentPoint` を追加する。
2. `pointermove` と `wheel` の両方で `currentPoint` を更新する。
3. overlay の center / radius 算出関数を切り出す。
4. 円板だけを描く `DragPlaneOverlay` を追加する。
5. ドラッグ中のみ overlay を表示する。
6. 開始点マーカーと現在点マーカーを追加する。
7. 必要なら開始点-現在点ラインを追加する。
8. 色、透過、半径下限を調整する。

## 8. 実装時の注意

- overlay は raycast 対象にしない。
- 深度テストや描画順でオブジェクト本体を潰しすぎないようにする。
- wheel 時の plane 更新後も、overlay が開始点と現在点を正しく含むことを確認する。
- overlay の計算は store に載せず、scene 内の一時状態として閉じる。
- `physicsEnabled = true` のときは表示しない。

## 9. 確認項目

- オブジェクト選択直後のドラッグで円板が表示される。
- 円板が開始地点と現在地点を含む。
- ドラッグ距離が伸びると円板半径も追従する。
- ホイールで奥行きを変えても円板が現在の drag plane に残る。
- `pointerup`、`Escape`、選択解除で円板が消える。
- `physicsEnabled = true` では円板が出ない。
- `OrbitControls` と干渉しない。

## 10. 未決事項

- `active` 状態でも円板を残すか。初回は `dragging` 中のみでよい。
- 円板の色を選択色連動にするか、固定色にするか。
- 円板の両面表示を許すか。
- 開始地点 / 現在地点マーカーをどこまで強く見せるか。

まずは「開始地点と現在地点を含む半透明の円板を、dragging 中だけ安定表示する」最小版から入るのが妥当。
