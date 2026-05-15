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
- Windows ネイティブ環境でも動かす前提。npm scripts で環境変数を渡す場合は POSIX 形式 (`FOO=bar command`) にせず、`cross-env` などクロスプラットフォームな方法を使う。
- Playwright のブラウザは WSL2 と Windows で共有されない。Windows 側で e2e を走らせる前に `pnpm run e2e:install` を実行する。
- Windows の大文字小文字非区別ファイルシステムで衝突するため、同じディレクトリに大小文字だけが違うファイル名を作らない。
- Playwright の `webServer.command` は Windows でも引数が崩れない形にする。`pnpm run preview -- --host ...` ではなく、現状の `pnpm exec vite preview ...` を維持する。
