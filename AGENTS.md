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
git rev-parse HEAD   # ← このハッシュを次のステップで使う
```

### 3. PR 説明にスクリーンショットを貼り付ける

PR の説明 (ManagePullRequest ツール / `body`) に以下の形式で画像を埋め込んでください。
`COMMIT_HASH` は直前のコミットのフルハッシュ、`REPO` は `オーナー/リポジトリ名` に置き換えてください。

> **ブランチ名ではなくコミットハッシュを使う理由**: ブランチ名を使うと PR マージ後にブランチが削除されたときリンクが切れます。コミットハッシュは永続するため、マージ後も画像が表示され続けます。

```markdown
## スクリーンショット

| ホーム | 作品詳細 |
|---|---|
| ![home](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/home.png) | ![work-detail](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/work-detail.png) |

| タグ詳細 | 検索 | 設定 |
|---|---|---|
| ![tag-detail](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/tag-detail.png) | ![search](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/search.png) | ![settings](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/settings.png) |
```

> 変更していないページのスクリーンショットも含めることで、意図しないレイアウト崩れが発生していないことをレビュアーが一目で確認できます。

### 4. 後から変更を加えたときの PR 更新

PR 作成後にさらにコードを修正したり `main` を取り込んだりした場合は、次の手順で PR 説明を更新してください。

1. `npm run screenshot` でスクリーンショットを再取得する
2. `git add screenshots/ && git commit -m "screenshot: ..."` でコミットする
3. `git rev-parse HEAD` で新しいコミットハッシュを取得する
4. `ManagePullRequest` ツールで PR 説明内の `COMMIT_HASH` をすべて新しいハッシュに置き換えて更新する

> スクリーンショットのコミットハッシュが古いままだと、PR に表示される画像が最新の状態を反映しなくなります。変更のたびに必ず更新してください。

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

以下のような大規模なデータ構造変更が発生した場合のみ、このファイルを更新してください。

- ドメインモデルに新しい概念が加わるなど、データ構造に大きな変更があった

また、コードを読んで AGENTS.md の記述と矛盾していることに気づいた場合、または AGENTS.md に記載された箇所を改修した場合は、その都度このファイルを正しい内容に修正してください。

作業メモや細かい補足を都度書き込むことは禁止します。

### シードデータのメンテナンス

改修した内容から「このデータをスクリーンショットに含めるべき」と判断した場合は、
`scripts/take-screenshots.mjs` の `seedTags` / `seedWorks` 配列を更新してください。

例: 新しい UI 要素を見せるために特定のデータパターンが必要になった場合など。

---

## 既知のハマりポイント・作業ロスの記録

作業中にライブラリの挙動など **大きな作業ロスの原因となった事項** が判明した場合は、このセクションに追記してください。
PR レビュー時に必ずレビュアーが確認します。

> 追記形式: `- YYYY-MM-DD: <内容と回避策の要約>`

<!-- 以下に記録を追記する -->
- 2026-03-23: `npm run test` (Vitest) が Vite 8 beta との互換性問題で正常動作しない。テストは現在利用停止中。
