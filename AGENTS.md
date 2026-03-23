# AGENTS.md — Cursor Cloud エージェント向け開発ガイド

このドキュメントは Cursor Cloud 上のエージェントが本リポジトリで作業する際の標準手順を定めます。

---

## プロジェクト概要

**Sparkling Journey** — 読んだ作品・タグを LocalStorage で管理する React SPA です。

| 技術 | バージョン |
|---|---|
| React | 19 |
| TypeScript | ~5.9 |
| Vite | 8 |
| Tailwind CSS | 4 |
| React Router | 7 |
| Vitest | 2 |
| Playwright | 1.x |

デプロイ先: GitHub Pages (`/sparkling-journey/` サブパス)

---

## 環境セットアップ

```bash
npm ci
```

> **Cursor Cloud 環境について**
> このリポジトリのクラウドエージェント環境は、Node.js と Google Chrome (`/usr/bin/google-chrome-stable`) が利用できる状態を前提としています。
> Playwright のブラウザダウンロードは不要です (システムの Chrome を使用します)。
> 環境設定の変更が必要な場合は [cursor.com/onboard](https://cursor.com/onboard) の Env Setup Agent を利用してください。

---

## よく使うコマンド

| コマンド | 用途 |
|---|---|
| `npm run dev` | 開発サーバー起動 (http://localhost:5173/sparkling-journey/) |
| `npm run build` | TypeScript コンパイル + Vite ビルド |
| `npm run lint` | ESLint チェック |
| `npm run test` | Vitest でユニットテスト実行 |
| `npm run screenshot` | 全ページのスクリーンショット取得 → `screenshots/` に保存 |

---

## コード変更時のチェックリスト

UI やロジックを変更したら、PR を出す前に以下を確認してください。

```bash
npm run lint   # リントエラーがないことを確認
npm run test   # テストがすべてパスすることを確認
```

---

## スクリーンショットの取得と PR への添付

**UI に影響する変更を加えた場合は必ずスクリーンショットを取得して PR に添付してください。**

### 1. スクリーンショットを取得する

```bash
npm run screenshot
```

- Vite dev サーバーを自動起動し、シードデータをブラウザの LocalStorage に注入した状態で撮影します。
- 撮影後、`screenshots/` ディレクトリに以下のファイルが生成されます。

| ファイル | ページ |
|---|---|
| `screenshots/home.png` | ホーム (`/`) |
| `screenshots/work-detail.png` | 作品詳細 (`/works/w1`) |
| `screenshots/tag-detail.png` | タグ詳細 (`/tags/t1`) |
| `screenshots/search.png` | 検索 (`/search?text=fantasy`) |
| `screenshots/settings.png` | 設定 (`/settings`) |

### 2. スクリーンショットをコミットする

```bash
git add screenshots/
git commit -m "screenshot: update screenshots"
```

### 3. PR 説明にスクリーンショットを貼り付ける

PR の説明 (ManagePullRequest ツール / `body`) に以下の形式で画像を埋め込んでください。
`BRANCH_NAME` は現在のブランチ名、`REPO` は `オーナー/リポジトリ名` に置き換えてください。

```markdown
## スクリーンショット

| ホーム | 作品詳細 |
|---|---|
| ![home](https://raw.githubusercontent.com/REPO/BRANCH_NAME/screenshots/home.png) | ![work-detail](https://raw.githubusercontent.com/REPO/BRANCH_NAME/screenshots/work-detail.png) |

| タグ詳細 | 検索 | 設定 |
|---|---|---|
| ![tag-detail](https://raw.githubusercontent.com/REPO/BRANCH_NAME/screenshots/tag-detail.png) | ![search](https://raw.githubusercontent.com/REPO/BRANCH_NAME/screenshots/search.png) | ![settings](https://raw.githubusercontent.com/REPO/BRANCH_NAME/screenshots/settings.png) |
```

> 変更していないページのスクリーンショットも含めることで、意図しないレイアウト崩れが発生していないことをレビュアーが一目で確認できます。

---

## ページ構成とルーティング

| パス | ページコンポーネント | 説明 |
|---|---|---|
| `/` | `HomePage` | 作品・タグ一覧、追加フォーム |
| `/works/:uuid` | `WorkDetailPage` | 作品詳細・タグ紐付け |
| `/tags/:uuid` | `TagDetailPage` | タグ詳細・紐付き作品一覧 |
| `/search?text=` | `SearchPage` | テキスト検索結果 |
| `/settings` | `SettingsPage` | JSON エクスポート / インポート |

---

## データモデル

```typescript
interface Tag {
  uuid: string;
  name: string;
  description: string;
}

interface WorkTag {
  tag: Tag;
  note: string;
}

interface Work {
  uuid: string;
  title: string;
  workTags: WorkTag[];
}
```

データは `localStorage` の以下のキーに JSON として保存されます。

| キー | 内容 |
|---|---|
| `app:works:v1` | `Work[]` |
| `app:tags:v1` | `Tag[]` |

---

## シードデータについて

`scripts/take-screenshots.mjs` にシードデータがインラインで定義されています。
スクリーンショット撮影時のみ使用され、アプリ本体のデータには影響しません。

シードデータを変更したい場合は同ファイルの `seedTags` / `seedWorks` 配列を編集してください。

---

## Cursor Cloud 環境設定 (AGENTS.md 以外の方法)

Cursor Cloud のエージェント環境は以下の 2 つの方法で設定できます。

### AGENTS.md (このファイル)
エージェントへの作業手順・規約の伝達に使います。コードの変更と同様に Git で管理されるため、チームで共有・レビューできます。

### Env Setup Agent (cursor.com/onboard)
エージェントが起動するベースイメージとスタートアップスクリプトを設定します。
以下のようなリポジトリ固有のセットアップを自動化できます。

- `npm ci` の自動実行 (依存関係のプリインストール)
- Node.js バージョンの固定
- システムレベルのツール導入

本リポジトリで推奨するスタートアップスクリプトの内容:

```bash
#!/bin/bash
cd /workspace
npm ci
```

Env Setup Agent を利用することで、エージェントが毎回 `npm ci` を実行する手間が省け、作業開始までの時間を短縮できます。
