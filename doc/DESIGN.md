## Overview

モデリングとプロトタイプの両画面で、HUD とツールが重ならず、情報を小さく密に並べても読みやすい UI を目指す。

## Direction

- 画面全体は「大きな角丸カード」ではなく、「薄い罫線で区切る作業面」に寄せる。
- 背景は暗めのブルーグレー基調を維持しつつ、UI 面は半透明パネルよりも細い線と弱い面差で整理する。
- 情報密度を上げるため、全体の文字サイズを一段小さくする。
- ボタンやツールの visible text はタイトルのみとし、補足説明は hover / focus 時の tooltip に逃がす。

## Layout Rules

- アプリ全体は `header`, `scene shell`, `overlay tools`, `bottom HUD` の 4 層で構成する。
- scene shell は大きな角丸をやめ、`1px` の線と控えめな内側余白で区切る。
- 左上 toolbar と右上 settings は縦方向に積むが、幅を小さく保ち、各項目は単一行中心にする。
- HUD は左下固定のカードではなく、画面下端に横並びで流す。狭い幅では折り返してよい。
- mobile では overlay を画面端いっぱいに広げず、上端と下端に水平ストリップとして置く。

## Typography

- 画面タイトル: `0.8rem` 前後、uppercase、tracking 強め。
- 本文・操作名: `0.78rem` 前後。
- 補助ラベル: `0.62rem` 前後。
- HUD の値表示は本文より少し強く、説明文は長文化しない。

## Components

### Header

- 画面切り替えボタンはラベルのみ表示する。
- 説明文は `title` 属性で tooltip 化する。

### Toolbars

- 各ツールはアイコンと短いラベルのみを表示する。
- 3D Pointer 配下のサブツールも同じルールで統一する。
- アイコンは現行より一回り小さくする。
- inactive は薄い文字と細線、active は明るい線と軽い背景差で示す。

### Settings

- 外周は線のみで構成し、セクションは罫線区切りにする。
- セクションナビもラベルのみ表示する。
- 展開ヘッダはコンパクトな 1 行構成にする。

### HUD

- 1 枚の大きなカードにしない。
- `Screen`, `Tool`, `Mesh`, `Pointer`, `Snap` などの単位で横並びブロック化する。
- helper text は下部の短い 1 行に抑える。

## Interaction Notes

- tooltip は native tooltip を基本とし、最低限 `title` と `aria-label` を持たせる。
- hover が使えない mobile でも操作不能にならないよう、tooltip は補足情報に限定する。
- 重要な状態は tooltip に隠さず、active state と HUD で分かるようにする。

## Current Scope

- App shell
- Prototype / Modeling toolbar
- Settings window
- Scene HUD
- Loading fallback
