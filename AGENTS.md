# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Sparkling Journey** はクライアントサイドのみで動作する SPA（React + TypeScript + Vite）。データは `localStorage` に保存され、バックエンドやデータベースは不要。

### Services

| Service | Command | Notes |
|---|---|---|
| Dev server | `npm run dev` | Vite dev server with HMR. `--host 0.0.0.0` で外部アクセス可 |
| Lint | `npm run lint` | ESLint。既存コードに pre-existing な lint エラーあり（既知） |
| Test | `npx vitest run` | Vitest 2.x と Vite 8.x-beta の互換性問題により全テスト失敗（`__vite_ssr_exportName__` エラー）。これは既知の pre-existing issue |
| Build | `npm run build` | `tsc -b && vite build`。正常に動作する |

### Caveats

- Node.js 24 が必要（CI の `deploy.yml` に準拠）。nvm で `nvm use 24` を使用。
- `vite.config.ts` の `base` が `/sparkling-journey/` に設定されているため、dev server の URL は `http://localhost:5173/sparkling-journey/`。
- Vitest のテストは Vite 8 beta との非互換で失敗する。`package.json` の `overrides` で Vite 8 を強制しているが、Vitest 2.x はこれに対応していない。テストフレームワークのアップグレードが必要。
