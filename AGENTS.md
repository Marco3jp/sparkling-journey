# AGENTS.md

Cursor Cloud エージェントがこのリポジトリで作業する際の標準手順。

## プロジェクト概要

Sparkling Journey は読んだ作品・タグを LocalStorage で管理する React SPA。
デプロイ先: GitHub Pages (`/sparkling-journey/` サブパス)

技術スタック: React 19, TypeScript ~5.9, Vite 8, Tailwind CSS 4, React Router 7, Playwright 1.x

## よく使うコマンド

- `npm run dev` — 開発サーバー起動 (http://localhost:5173/sparkling-journey/)
- `npm run build` — TypeScript コンパイル + Vite ビルド
- `npm run lint` — ESLint チェック
- `npm run test` — Vitest でユニットテストを実行
- `npm run screenshot` — 全ページのスクリーンショット取得 → `screenshots/` に保存

## コード変更時のチェックリスト

UI やロジックを変更したら PR を出す前に以下を実行してエラーがないことを確認する。

```bash
npm run lint
npm run test -- --run
```

## スクリーンショットの取得と PR への添付

UI に影響する変更を加えた場合は必ずスクリーンショットを取得して PR に添付する。

### 取得手順

```bash
npm run screenshot
```

Vite dev サーバーを自動起動し、シードデータをブラウザの LocalStorage に注入した状態で撮影する。
撮影後 `screenshots/` に以下のファイルが生成される。

- `screenshots/home.png` — ホーム (`/`)
- `screenshots/work-detail.png` — 作品詳細 (`/works/w1`)
- `screenshots/tag-detail.png` — タグ詳細 (`/tags/t1`)
- `screenshots/search.png` — 検索 (`/search?text=fantasy`)
- `screenshots/settings.png` — 設定 (`/settings`)

### コミットと PR への埋め込み

```bash
git add screenshots/
git commit -m "screenshot: update screenshots"
git rev-parse HEAD
```

PR の body に以下の形式で埋め込む。`COMMIT_HASH` は上記コマンドで得たフルハッシュ、`REPO` は `オーナー/リポジトリ名`。
ブランチ名ではなくコミットハッシュを使う理由: ブランチ削除後もリンクが切れない。

```markdown
## スクリーンショット

| ホーム | 作品詳細 |
|---|---|
| ![home](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/home.png) | ![work-detail](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/work-detail.png) |

| タグ詳細 | 検索 | 設定 |
|---|---|---|
| ![tag-detail](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/tag-detail.png) | ![search](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/search.png) | ![settings](https://raw.githubusercontent.com/REPO/COMMIT_HASH/screenshots/settings.png) |
```

変更していないページのスクリーンショットも含めることで、意図しないレイアウト崩れをレビュアーが確認できる。
変更のたびにコミットハッシュを更新すること。

## ページ構成とルーティング

- `/` — `HomePage`: 作品・タグ一覧、追加フォーム
- `/works/:uuid` — `WorkDetailPage`: 作品詳細・タグ紐付け
- `/tags/:uuid` — `TagDetailPage`: タグ詳細・紐付き作品一覧
- `/search?text=` — `SearchPage`: テキスト検索結果
- `/settings` — `SettingsPage`: JSON エクスポート / インポート

## データモデル

ドメインモデルの定義は以下のファイルを直接参照する。

- `src/domain/models/Tag.ts` — タグ
- `src/domain/models/Work.ts` — 作品・作品タグ (WorkTag)
- `src/infrastructure/storage/` — LocalStorage への永続化実装

LocalStorage のキー:
- `app:works:v1` — `Work[]`
- `app:tags:v1` — `Tag[]`

## テストの書き方規約

テストファイルは `tests/` に配置する。Vitest は `tests/**/*.test.ts` を実行する。

### フィクスチャとテストコードの分離

テストデータ（`Tag`・`Work` などのサンプルオブジェクト）はファイル先頭の `const` として定義する。`it()` や `beforeEach()` の中にインラインで書いてはいけない。

良い例:
```ts
const tagA: Tag = { uuid: "t1", name: "Fantasy", description: "..." };
const baseWork: Work = { uuid: "w1", title: "Work 1", workTags: [] };

describe("...", () => {
  it("...", async () => {
    const repo = new InMemoryTagRepository([tagA]);
  });
});
```

悪い例:
```ts
describe("...", () => {
  it("...", async () => {
    const tag = { uuid: "t1", name: "Fantasy", description: "..." }; // NG
    const repo = new InMemoryTagRepository([tag]);
  });
});
```

### describe の単位

1 つのユースケース・クラス・メソッドごとに `describe` を分ける。複数の関連機能を 1 ファイルにまとめる場合も、それぞれ独立した `describe` ブロックにする。

### テストファイルの配置先

- ユースケース: `tests/domain/usecases/`
- インフラ層 (Storage): `tests/infrastructure/storage/`
- ヘルパー: `tests/helpers/`

追加ケースは既存ファイルに統合する。"Additional" や "EdgeCases" などサフィックス付きの分離ファイルを作らない。

## CI

`main` へのPR作成・更新時に `.github/workflows/ci.yml` が自動で lint と vitest を実行する。
PRをプッシュしたら CI が green になっていることを確認してから作業完了とする。

## 改修時に必要ならやること

### AGENTS.md の更新

以下に該当する場合のみこのファイルを更新する。

- ドメインモデルに新しい概念が加わるなど、データ構造に大きな変更があった
- コードを読んで AGENTS.md の記述と矛盾していることに気づいた
- AGENTS.md に記載された箇所を改修した

作業メモや細かい補足を都度書き込むことは禁止する。

### シードデータのメンテナンス

改修した内容から「このデータをスクリーンショットに含めるべき」と判断した場合は `scripts/take-screenshots.mjs` の `seedTags` / `seedWorks` 配列を更新する。

## 既知のハマりポイント・作業ロスの記録

大きな作業ロスの原因となった事項が判明した場合はここに追記する。PR レビュー時にレビュアーが確認する。

追記形式: `- YYYY-MM-DD: <内容と回避策の要約>`

<!-- 以下に記録を追記する -->
- 2026-03-23: `npm run test` (Vitest) が Vite 8 beta との互換性問題で正常動作しない。テストは現在利用停止中。
- 2026-04-10: Vite 8 正式版 (8.0.8) へのアップグレードに伴い Vitest を 4.1.4 へ更新することでテストが復活。`@tailwindcss/vite` と `@vitejs/plugin-react` も Vite 8 対応済みの最新版 (4.2.2 / 6.0.1) へ合わせて更新した。
