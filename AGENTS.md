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
| Playwright | 1.x |

デプロイ先: GitHub Pages (`/sparkling-journey/` サブパス)

---

## よく使うコマンド

| コマンド | 用途 |
|---|---|
| `npm run dev` | 開発サーバー起動 (http://localhost:5173/sparkling-journey/) |
| `npm run build` | TypeScript コンパイル + Vite ビルド |
| `npm run lint` | ESLint チェック |
| `npm run screenshot` | 全ページのスクリーンショット取得 → `screenshots/` に保存 |

> **テストについて**
> `npm run test` (Vitest) は現在 Vite のバージョン制約により正常に動作しないため、利用していません。

---

## コード変更時のチェックリスト

UI やロジックを変更したら、PR を出す前に以下を確認してください。

```bash
npm run lint   # リントエラーがないことを確認
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

ドメインモデルの定義は以下のファイルを直接参照してください。データ構造はアプリケーションの設計を反映しています。

- `src/domain/models/Tag.ts` — タグ
- `src/domain/models/Work.ts` — 作品・作品タグ (`WorkTag`)
- `src/infrastructure/storage/` — LocalStorage への永続化実装

LocalStorage のキー:

| キー | 内容 |
|---|---|
| `app:works:v1` | `Work[]` |
| `app:tags:v1` | `Tag[]` |

---

## 改修時に必要ならやること

### AGENTS.md の更新

以下のような大規模な変更が発生した場合のみ、このファイルを更新してください。

- 新しい概念が登場してデータ構造全体が変わった
- ドメインモデルに大きな構造変更があった

作業メモや細かい補足を都度書き込むことは禁止します。

### シードデータのメンテナンス

改修した内容から「このデータをスクリーンショットに含めるべき」と判断した場合は、
`scripts/take-screenshots.mjs` の `seedTags` / `seedWorks` 配列を更新してください。

例: 新しい UI 要素を見せるために特定のデータパターンが必要になった場合など。
