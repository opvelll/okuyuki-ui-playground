# Okuyuki-UI-Playground

React Three Fiber で、画面平面ドラッグとホイールによる奥行き操作を試すための 3D UI プロトタイプです。  
現在は移動だけでなく、回転 UI、Physics 切り替え、各種パラメータ調整用の Settings パネルも含んでいます。

## Demo

![Okuyuki-UI-Playground demo](./doc/demo.gif)

## できること

- Move UI
  - ドラッグで画面平面方向に移動
  - ホイールでカメラ奥行き方向に移動
  - `Shift` で細かく移動
  - `Ctrl` で他オブジェクト軸への magnet snap
  - `Ctrl + Shift` で interval snap
- Rotate UI
  - 球状 gizmo のドラッグで arcball 回転
  - ホイールで twist 回転
  - `Ctrl` で XYZ リング方向へスナップ
- Settings パネル
  - Physics の有効化 / 無効化
  - Rigid Body モードや摩擦、反発、重力の調整
  - Move UI / Rotate UI の感度やスナップ挙動の調整
  - 背景色、Fog、床、グリッド色の調整
- HUD
  - 選択中オブジェクト、interaction state、FPS、現在の補助設定を表示

## 操作方法

### モード切り替え

- 左上ツールバーで `Move UI` / `Rotate UI` を切り替え
- キーボードショートカット
  - `M`: Move UI
  - `R`: Rotate UI

### Move UI

- オブジェクトを選択してドラッグすると移動
- ホイールで奥行き方向に移動
- `Shift` で depth step を小さくする
- `Ctrl` で他オブジェクト軸へのスナップ
- `Shift + Ctrl` で interval snap
- Move UI の常時スナップ設定は右上 Settings から変更可能

![Move UI snap demo](<./doc/2026-04-05 23-47-22.gif>)
![Move UI interval demo](<./doc/2026-04-06 01-19-55.gif>)

### Rotate UI

- オブジェクトを選択すると回転 gizmo を表示
- ドラッグで arcball 回転
- ホイールで twist 回転
- `Ctrl` で XYZ リング方向にスナップ
- 空き領域クリックまたは `Escape` で選択解除

![Rotate UI demo](<./doc/2026-04-06 01-27-59.gif>)

## Screen Shot

![画面](<./doc/スクリーンショット 2026-04-05 235419.png>)

## Tech Stack

- React 19
- Vite 7
- TypeScript 5
- React Three Fiber / Drei
- Rapier
- Zustand
- Vitest
- Playwright
- Biome

## セットアップ

前提:

- Node.js `>= 22`
- pnpm `10.28.2`

```bash
pnpm install
pnpm run dev
```

## スクリプト

- `pnpm run dev`: 開発サーバー起動
- `pnpm run build`: TypeScript ビルド + Vite build
- `pnpm run preview`: ビルド結果の確認
- `pnpm run format`: Biome format
- `pnpm run lint`: Biome check
- `pnpm run test`: Vitest
- `pnpm run e2e`: Playwright

## GitHub Pages

- `main` への push で GitHub Actions から GitHub Pages にデプロイされます
- Vite の `base` は `GITHUB_REPOSITORY` または `VITE_BASE_PATH` をもとに設定されます
- 公開 URL: `https://opvelll.github.io/okuyuki-ui-playground/`
