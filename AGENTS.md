# Repository Workflow


## Daily Steps

1. 変更前に `git status --short` で作業ツリーを確認する。
2. 実装後に `pnpm run format` を実行する。
3. 次に `pnpm run lint` と `pnpm run test` を実行する。
4. リリース前または画面変更時は `pnpm run e2e` を実行する。
5. 画面変更時は`playwright-interactive` skillで画面を確認する。
6. 最終確認として `pnpm run build` を通す。

## Current Guardrails

- `PrototypeScene` は `App` から lazy load している。3D 関連の重い依存は、可能な限りこの遅延境界の内側に閉じ込める。
- Scene のローディング中でも `SettingsWindow` と `SceneStatusHud` は表示される前提。UI 追加時もこの即時表示を壊さない。
- `@react-three/rapier` の `Physics` は `Canvas` 内の `Suspense` 配下で扱う。外側の `Suspense` まで巻き上げると dev で描画不安定になりやすい。
- `pnpm run build` では chunk size 警告が出ることがある。まずは lazy split を維持し、安易に `manualChunks` を追加しない。
- 画面変更時は、desktop だけでなく mobile 幅でもレイアウト崩れと HUD の重なりを確認する。
