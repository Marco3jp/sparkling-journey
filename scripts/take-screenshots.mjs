/**
 * スクリーンショット取得スクリプト
 *
 * 使用方法:
 *   node scripts/take-screenshots.mjs
 *
 * Vite dev サーバーを起動し、シードデータを localStorage に注入した状態で
 * 全ページのスクリーンショットを screenshots/ ディレクトリに保存します。
 * システムの Google Chrome を使用します (ネットワーク制限がある環境でも動作)。
 */

import { chromium } from "@playwright/test";
import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const screenshotsDir = join(rootDir, "screenshots");

// --- シードデータ ---

const seedTags = [
  { uuid: "t1", name: "Fantasy", description: "魔法と剣の世界観を持つ作品 参考: https://example.com/fantasy-guide" },
  { uuid: "t2", name: "SF", description: "宇宙・テクノロジーをテーマにした作品" },
  { uuid: "t3", name: "日記", description: "日々の出来事を記録した作品" },
  { uuid: "t4", name: "短編", description: "短い読み切り作品" },
  { uuid: "t5", name: "ラブコメ", description: "恋愛とコメディが混ざった作品" },
];

const seedTagRelations = [
  { uuid: "r1", sourceTagId: "t1", targetTagId: "t2", weight: 40, note: "異世界 × 科学技術" },
  { uuid: "r2", sourceTagId: "t1", targetTagId: "t5", weight: 60, note: "ファンタジーラブコメ多い" },
  { uuid: "r3", sourceTagId: "t3", targetTagId: "t4", weight: 80, note: "日記は短編が多い" },
];

const seedWorks = [
  {
    uuid: "w1",
    title: "異世界ファンタジー大作",
    workTags: [
      { tag: seedTags[0], note: "長編シリーズ。主人公は高校生の転生者 https://example.com/work/w1" },
      { tag: seedTags[4], note: "ヒロインとの掛け合いが面白い" },
    ],
  },
  {
    uuid: "w2",
    title: "宇宙船の旅",
    workTags: [{ tag: seedTags[1], note: "宇宙人との交流がテーマ" }],
  },
  {
    uuid: "w3",
    title: "ただの日記",
    workTags: [
      { tag: seedTags[2], note: "プライベートな記録。感情の整理に使っている" },
    ],
  },
  {
    uuid: "w4",
    title: "5分で読める話",
    workTags: [
      { tag: seedTags[3], note: "通勤中に読んだ" },
      { tag: seedTags[0], note: "世界観が好き" },
    ],
  },
  {
    uuid: "w5",
    title: "青春ラブコメ傑作選",
    workTags: [{ tag: seedTags[4], note: "" }],
  },
];

// --- ユーティリティ ---

function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      fetch(url)
        .then((res) => {
          if (res.ok) resolve();
          else retry();
        })
        .catch(retry);
    };
    const retry = () => {
      if (Date.now() - start >= timeout) {
        reject(new Error(`サーバーが ${timeout}ms 以内に起動しませんでした: ${url}`));
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

// --- メイン処理 ---

async function main() {
  await mkdir(screenshotsDir, { recursive: true });

  // Vite dev サーバーを起動
  const server = spawn("npx", ["vite", "--port", "5173"], {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: rootDir,
  });
  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));

  try {
    const baseUrl = "http://localhost:5173/sparkling-journey";
    console.log("Vite dev サーバーの起動を待機中...");
    await waitForServer(`${baseUrl}/`);
    console.log("サーバー起動を確認。スクリーンショット取得を開始します。");

    // システムの Google Chrome を使用
    const executablePath =
      process.env.CHROME_PATH ??
      "/usr/bin/google-chrome-stable";

    const browser = await chromium.launch({
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: "dark",
    });

    // localStorage にシードデータを注入
    await context.addInitScript(
      ({ works, tags, tagRelations }) => {
        localStorage.setItem("app:works:v1", JSON.stringify(works));
        localStorage.setItem("app:tags:v1", JSON.stringify(tags));
        localStorage.setItem("app:tag-relations:v1", JSON.stringify(tagRelations));
      },
      { works: seedWorks, tags: seedTags, tagRelations: seedTagRelations }
    );

    const page = await context.newPage();

    const pages = [
      { name: "home", path: "/" },
      { name: "work-detail", path: "/works/w1" },
      { name: "tag-detail", path: "/tags/t1" },
      { name: "search", path: "/search?text=fantasy" },
      { name: "settings", path: "/settings" },
    ];

    for (const { name, path } of pages) {
      const url = `${baseUrl}${path}`;
      console.log(`  撮影中: ${name} (${url})`);
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const dest = join(screenshotsDir, `${name}.png`);
      await page.screenshot({ path: dest, fullPage: true });
      console.log(`  保存完了: ${dest}`);
    }

    await browser.close();
    console.log("\nすべてのスクリーンショットを保存しました:", screenshotsDir);
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
