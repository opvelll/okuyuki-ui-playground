# Repository Workflow

## Setup

```bash
pnpm install
pnpm run e2e:install
```

## Daily Steps

1. 変更前に `git status --short` で作業ツリーを確認する。
2. 実装後に `pnpm run format` を実行する。
3. 次に `pnpm run lint` と `pnpm run test` を実行する。
4. リリース前または画面変更時は `pnpm run e2e` を実行する。
5. 最終確認として `pnpm run build` を通す。

