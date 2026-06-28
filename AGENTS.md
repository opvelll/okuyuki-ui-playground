# Repository Workflow


## Daily Steps

1. 変更前に `git status --short` で作業ツリーを確認する。
2. 実装後に `pnpm run format` を実行する。
3. 次に `pnpm run lint` と `pnpm run test` を実行する。
4. リリース前または画面変更時は `pnpm run e2e` を実行する。
5. 画面変更時は Codex app 標準の in-app Browser（browser/control-in-app-browser）で画面を確認する。
6. 最終確認として `pnpm run build` を通す。

## Smooth Verification Loop

- 実装中の内側ループは `pnpm run lint` と `pnpm run test` を優先し、e2e は UI の流れが固まってから実行する。
- e2e の調査中は、必要なら `pnpm run build` を一度通したあと `pnpm exec playwright test tests/e2e/app.spec.ts -g "<test name>"` で対象を絞って再実行する。
- ブラウザ確認では `pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort` を起動し、Codex app の in-app Browser で `http://127.0.0.1:4173/` を開いて確認する。確認後は起動した preview プロセスを停止する。
- 画面変更の完了前には、対象を絞った確認だけで終わらせず、`pnpm run e2e` と `pnpm run build` を通す。

## Current Guardrails

- `PrototypeScene` は `App` から lazy load している。3D 関連の重い依存は、可能な限りこの遅延境界の内側に閉じ込める。
- Scene のローディング中でも `SettingsWindow` と `SceneStatusHud` は表示される前提。UI 追加時もこの即時表示を壊さない。
- `@react-three/rapier` の `Physics` は `Canvas` 内の `Suspense` 配下で扱う。外側の `Suspense` まで巻き上げると dev で描画不安定になりやすい。
- `pnpm run build` では chunk size 警告が出ることがある。まずは lazy split を維持し、安易に `manualChunks` を追加しない。
- Windows ネイティブ環境でも動かす前提。npm scripts で環境変数を渡す場合は POSIX 形式 (`FOO=bar command`) にせず、`cross-env` などクロスプラットフォームな方法を使う。
- Playwright のブラウザは WSL2 と Windows で共有されない。Windows 側で e2e を走らせる前に `pnpm run e2e:install` を実行する。
- Windows の大文字小文字非区別ファイルシステムで衝突するため、同じディレクトリに大小文字だけが違うファイル名を作らない。
- Playwright の `webServer.command` は Windows でも引数が崩れない形にする。`pnpm run preview -- --host ...` ではなく、現状の `pnpm exec vite preview ...` を維持する。
