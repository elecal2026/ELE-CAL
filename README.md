# ELE-CAL

電気設備計算ツール集です。Next.js App Router で構成されています。

## 主要ページ

- `/` - TOP
- `/allowable_current` - 許容電流
- `/breaker` - ブレーカー選定
- `/apartment_main` - 集合住宅幹線設計
- `/pipe_size` - 配管サイズ選定
- `/cable_rack` - ラックサイズ選定
- `/voltage_drop_v2` - 電圧降下計算
- `/questions` - Q&A
- `/feedback` - 要望BOX

## 開発コマンド

PowerShell では `npm` が `npm.ps1` に解決されて ExecutionPolicy で止まる場合があるため、基本は `npm.cmd` を使います。

```bash
npm.cmd run dev -- -p 3000
npm.cmd run lint
npm.cmd run build
npm.cmd run start -- -p 3000
```

ローカル確認だけを安定させたい場合は、`npm.cmd run build` 後に `npm.cmd run start -- -p 3000` でビルド済みの本番サーバーを起動します。

## レスポンシブ入力UIの基本ルール

入力行は `flex` ではなく `grid` を基本にします。特に「番号 / セレクト / 数値 / 単位 / 削除」のような行は、`grid-template-columns` と `minmax()` で各セルの最低幅を守り、狭い画面では潰すより折り返す方針です。

共通フォームクラスは [src/app/globals.css](src/app/globals.css) にまとめています。

- `tool-form-field` - ラベルと入力を縦にまとめる基本単位
- `tool-form-label` - 入力ラベル
- `tool-control-with-unit` - 入力欄と単位を横並びにする
- `tool-control-unit` - `kW`、`m`、`%` などの単位表示
- `tool-responsive-grid` - 入力群を画面幅に応じて折り返す共通グリッド
- `tool-form-block` - 入力ブロックのまとまり

スマホではラベル横並びを避け、原則として「ラベル上 / 入力下」にします。単位は入力欄の外に出し、placeholder は説明文ではなく入力例だけに使います。

## 3000番ポート確認メモ

ポートが固まった場合は、まず PID を確認します。

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Next dev の表示が古い、CSSが反映されない、または応答が詰まる場合は、Next を停止して `.next/dev` または `.next` を削除してから再起動します。Windows + 日本語パスでは Turbopack のキャッシュやロックが残ることがあります。

Codex のサンドボックス内で `Start-Process` したサーバーは、コマンド終了時に片付けられることがあります。ユーザーに見せ続ける確認サーバーは、必要に応じて外側で `npm.cmd run start -- -p 3000` を起動します。

## 確認手順

変更後は最低限以下を確認します。

```bash
npm.cmd run lint
npm.cmd run build
```

画面確認時は主要ページが `HTTP 200` で返ることも確認します。
