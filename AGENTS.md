# Repository Workflow


## Daily Steps

1. 実装後に `pnpm run format` を実行する。
2. 次に `pnpm run lint` と `pnpm run test` を実行する。
3. リリース前または画面変更時は `pnpm run e2e` を実行する。
4. 画面変更時は`playwright-interactive` skillで画面を確認する。
5. 最終確認として `pnpm run build` を通す。

色の変更等の場合は、最小限のステップでよい。

## Workspace Layout

- Prototype app は `apps/prototype`、Modeling app は `apps/modeling` に分離している。
- Root は pnpm workspace。通常の全体確認は root から `pnpm run format`、`pnpm run lint`、`pnpm run test`、`pnpm run build` を実行する。
- 個別起動は `pnpm run dev:prototype` が `http://127.0.0.1:5173/`、`pnpm run dev:modeling` が `http://127.0.0.1:5174/`。
- 個別 build は `pnpm run build:prototype` / `pnpm run build:modeling`、個別 test は `pnpm run test:prototype` / `pnpm run test:modeling` を使う。
- `SettingsWindow` と `SceneStatusHud` は共有化せず、各 app 内にコピーして分離している。片方の UI 変更がもう片方に必要な場合は、意図してコピー先も更新する。

## Separation Follow-up

- 今回の分離は「同一 repo 内で完全に別起動できる」状態を優先しており、重複コードは許容している。
- 後工程で整理する場合は、まず `apps/prototype` から modeling 専用の component/store/lib/test を削る。
- 次に `apps/modeling` から prototype 専用の component/store/data/test を削る。
- `SettingsWindow`、`SceneStatusHud`、`uiStore` は app ごとに必要な state だけ残して縮小する。共有 package 化は、両 app で本当に同じ責務が残ったものだけ検討する。
- 後工程では localStorage key の衝突を避ける。Prototype は `naname-prototype-ui-settings`、Modeling は `naname-modeling-ui-settings` を使う。
- 大きな削除を行うときは、片 app ずつ `pnpm run test:<app>` と `pnpm run build:<app>` を通してから次へ進む。

## E2E / Playwright Operations

- `pnpm run e2e` / `pnpm run e2e:ui` は build 後の `vite preview` を対象に確認する。リリース前の最終確認はこちらを優先する。
- 個別 E2E は `pnpm run e2e:prototype` / `pnpm run e2e:modeling` を使う。
- `pnpm run dev` を起動したまま確認したいときは `pnpm run e2e:dev` / `pnpm run e2e:dev:ui` を使う。開発中の反復確認ではこちらを優先してよい。
- Playwright の接続先は `localhost` ではなく `127.0.0.1` を使う。別ポートで dev server を立てた場合は `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port>` を明示する。
- `playwright-interactive` skill はこの環境で動作確認済み。ただし `js_repl` では `await import("playwright")` の返り値が `default` 配下に本体を持つことがあるため、`const playwright = module.default ?? module` の形で吸収する。
- `pnpm run e2e:dev*` は既存の dev server にぶら下がる前提なので、サーバー未起動のまま実行しない。

## Current Guardrails

- `PrototypeScene` は `App` から lazy load している。3D 関連の重い依存は、可能な限りこの遅延境界の内側に閉じ込める。
- Scene のローディング中でも `SettingsWindow` と `SceneStatusHud` は表示される前提。UI 追加時もこの即時表示を壊さない。
- `@react-three/rapier` の `Physics` は `Canvas` 内の `Suspense` 配下で扱う。外側の `Suspense` まで巻き上げると dev で描画不安定になりやすい。
- `pnpm run build` では chunk size 警告が出ることがある。まずは lazy split を維持し、安易に `manualChunks` を追加しない。
