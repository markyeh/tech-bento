````md
# MVP：tech-bento

## 專案目標

建立一個 SvelteKit 靜態網站，每天透過 GitHub Actions 自動：

- 抓取英文科技新聞 RSS
- 挑選每日 Top 5
- 使用 Gemini API 產生繁體中文標題與摘要
- 產生靜態 JSON
- 部署到 GitHub Pages

專案名稱：

```text
tech-bento
```

網站定位：

```text
每日英文科技新聞便當：自動挑選、翻譯、摘要 Top 5 科技新聞。
```

---

# 技術架構

- Frontend: SvelteKit
- Hosting: GitHub Pages
- Scheduler: GitHub Actions
- LLM: Gemini API
- Data format: JSON
- Runtime: Node.js + TypeScript
- Local GitHub Actions testing: act

---

# Repo 結構

```text
tech-bento/
  .github/
    workflows/
      daily.yml
  scripts/
    sources.ts
    fetch-news.ts
    rank-news.ts
    translate-news.ts
    generate-daily.ts
  src/
    routes/
      +page.svelte
      archive/
        +page.svelte
  static/
    data/
      latest.json
      archive.json
  .gitignore
  package.json
  svelte.config.js
```

---

# SvelteKit base path

因為 GitHub Pages URL 會是：

```text
https://<username>.github.io/tech-bento/
```

所以 `svelte.config.js` 要設定：

```js
import adapter from "@sveltejs/adapter-static";

const config = {
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    paths: {
      base: process.env.NODE_ENV === "production" ? "/tech-bento" : ""
    }
  }
};

export default config;
```

---

# 第一版 RSS 來源

建立 `scripts/sources.ts`：

```ts
export const sources = [
  {
    id: "ars-technica",
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index"
  },
  {
    id: "the-verge",
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml"
  },
  {
    id: "techcrunch",
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/"
  },
  {
    id: "mit-tech-review",
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/"
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    url: "https://news.ycombinator.com/rss"
  }
];
```

---

# 摘要與原文連結策略

為了降低版權風險，MVP 不做全文翻譯，只做「新聞摘要」。

每篇新聞卡片必須包含：

- 繁體中文標題
- 300 字內中文摘要
- 來源名稱
- 發布時間
- Tags
- 原文連結按鈕

原文連結按鈕文字：

```text
閱讀原文
```

原文連結必須使用原始新聞 URL，並使用新分頁開啟：

```html
<a href={item.url} target="_blank" rel="noopener noreferrer">
  閱讀原文
</a>
```

---

# 每日資料 Schema

每日輸出：

```json
{
  "date": "2026-05-24",
  "generatedAt": "2026-05-24T06:00:00+08:00",
  "items": [
    {
      "rank": 1,
      "source": "The Verge",
      "originalTitle": "Example English Title",
      "translatedTitle": "繁體中文標題",
      "summaryZh": "這是一段 300 字以內的繁體中文科技新聞摘要。",
      "url": "https://example.com/news",
      "publishedAt": "2026-05-24T00:00:00Z",
      "score": 87,
      "tags": ["AI", "Google"]
    }
  ]
}
```

輸出檔案：

```text
static/data/latest.json
static/data/YYYY-MM-DD.json
static/data/archive.json
```

---

# npm scripts

`package.json` 需包含：

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "fetch-news": "tsx scripts/fetch-news.ts",
    "rank-news": "tsx scripts/rank-news.ts",
    "translate-news": "tsx scripts/translate-news.ts",
    "generate-daily": "tsx scripts/generate-daily.ts",
    "pipeline": "npm run fetch-news && npm run rank-news && npm run translate-news && npm run generate-daily && npm run build"
  }
}
```

---

# 安裝依賴

```bash
npm install
npm install rss-parser @google/genai zod
npm install -D tsx @sveltejs/adapter-static
```

---

# 實作步驟

## Step 1：抓 RSS

建立 `scripts/fetch-news.ts`

功能：

- 讀取 `sources.ts`
- 抓所有 RSS
- 只保留最近 24 小時文章
- 正規化資料格式
- 去除重複 URL
- 輸出 `.tmp/news.json`

輸出格式：

```json
[
  {
    "source": "The Verge",
    "sourceId": "the-verge",
    "title": "Original English title",
    "description": "RSS summary",
    "url": "https://example.com/news",
    "publishedAt": "2026-05-24T00:00:00Z"
  }
]
```

---

## Step 2：Top 5 排名

建立 `scripts/rank-news.ts`

第一版使用 rule-based score：

```text
score =
  sourceWeight
  + recencyScore
  + keywordScore
```

建議關鍵字權重：

```ts
const keywordWeights = {
  AI: 20,
  TSMC: 15,
  NVIDIA: 15,
  OpenAI: 14,
  Anthropic: 14,
  Google: 12,
  Gemini: 12,
  Microsoft: 12,
  Meta: 12,
  Amazon: 12,
  Deepseek: 12,
  xAI: 10,
  Grok: 10,
  Apple: 10,
  Intel: 10,
  AMD: 10,
  chip: 10,
  semiconductor: 10,
  security: 10,
  vulnerability: 10
};
```

輸出：

```text
.tmp/top5.json
```

---

## Step 3：Gemini 翻譯摘要

建立 `scripts/translate-news.ts`

要求：

- 從環境變數讀取 `GEMINI_API_KEY`
- 讀取 `.tmp/top5.json`
- 對每篇新聞產生：
  - `translatedTitle`
  - `summaryZh`
  - `tags`
- 輸出 `.tmp/translated.json`

環境變數讀取：

```ts
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}
```

---

# Gemini Prompt

```text
你是台灣科技媒體編輯。

請根據以下英文科技新聞資訊，產生繁體中文 JSON。

重要要求：

- 這不是全文翻譯，而是新聞摘要
- 不要逐句翻譯
- 不要保留原文段落結構
- 請用自己的方式整理重點
- 使用繁體中文
- 使用台灣常見科技媒體用語
- 不要使用中國用語
- 保留重要英文專有名詞，例如 OpenAI、Gemini、NVIDIA、Microsoft、Google
- 摘要必須控制在 300 個中文字以內
- 摘要要讓沒有讀原文的人也能理解重點
- 不要加入原文沒有提到的資訊
- 不要輸出 markdown
- 輸出必須是 valid JSON

輸出格式：

{
  "translatedTitle": "...",
  "summaryZh": "...",
  "tags": ["AI", "NVIDIA"]
}

新聞資訊：

Title: ...
Source: ...
Description: ...
URL: ...
Published At: ...
```

---

## translate-news.ts 驗證要求

---

## Step 4：產生靜態資料

建立 `scripts/generate-daily.ts`

功能：

- 讀取 `.tmp/translated.json`
- 產生今日日期檔案
- 更新 `latest.json`
- 更新 `archive.json`

輸出：

```text
static/data/latest.json
static/data/YYYY-MM-DD.json
static/data/archive.json
```

---

# Svelte 頁面需求

`src/routes/+page.svelte`

功能：

- 讀取 `/data/latest.json`
- 顯示網站名稱 `tech-bento`
- 顯示副標題：`每日英文科技新聞中文摘要`
- 顯示今日日期
- 顯示 Top 5 卡片

每張卡片包含：

```text
#1
繁體中文標題

300 字內摘要

Tags: AI / NVIDIA

來源：The Verge
發布時間：2026-05-24 08:30

[閱讀原文]
```

注意：

- `閱讀原文` 必須清楚可見
- 必須使用新分頁開啟
- 必須導回原始新聞網站

資料讀取：

```ts
import { base } from "$app/paths";

const res = await fetch(`${base}/data/latest.json`);
```

---

# GitHub Actions workflow

建立 `.github/workflows/daily.yml`

```yaml
name: Daily News Update

on:
  schedule:
    - cron: "0 22 * * *" # UTC 22:00 = 台灣時間 06:00
  workflow_dispatch:

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  update-news:
    runs-on: ubuntu-latest

    env:
      GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Fetch news
        run: npm run fetch-news

      - name: Rank news
        run: npm run rank-news

      - name: Translate news
        run: npm run translate-news

      - name: Generate daily data
        run: npm run generate-daily

      - name: Build Svelte site
        run: npm run build

      - name: Commit generated data
        run: |
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
          git add static/data
          git commit -m "chore: update daily news data" || echo "No changes to commit"
          git push

      - name: Upload Pages artifact
        if: ${{ !env.ACT }}
        uses: actions/upload-pages-artifact@v3
        with:
          path: build

      - name: Deploy to GitHub Pages
        if: ${{ !env.ACT }}
        uses: actions/deploy-pages@v4
```

---

# GitHub Secrets 設定方式

GitHub repo：

```text
Settings
→ Secrets and variables
→ Actions
→ Repository secrets
→ New repository secret
```

新增：

```text
Name: GEMINI_API_KEY
Value: 你的 Gemini API key
```

Workflow 使用：

```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

---

# 本機驗證流程

目標：

```text
在 push 到 GitHub 前，先確認 scripts 與 GitHub Actions workflow 大致可跑。
```

---

## 1. 本機先測 npm pipeline

建立本機 `.env` 或 export：

```bash
export GEMINI_API_KEY="你的 Gemini API key"
```

執行：

```bash
npm run fetch-news
npm run rank-news
npm run translate-news
npm run generate-daily
npm run build
```

或一次跑：

```bash
npm run pipeline
```

確認產生：

```text
.tmp/news.json
.tmp/top5.json
.tmp/translated.json
static/data/latest.json
static/data/archive.json
build/
```

---

## 2. 安裝 act 測 GitHub Actions

macOS 安裝：

```bash
brew install act
```

建立 `.secrets`：

```bash
GEMINI_API_KEY=你的 Gemini API key
```

把 `.secrets` 加到 `.gitignore`：

```gitignore
.secrets
.env
.tmp
```

本機測 workflow：

```bash
act workflow_dispatch \
  -W .github/workflows/daily.yml \
  --secret-file .secrets
```

也可以直接帶 secret：

```bash
act workflow_dispatch \
  -W .github/workflows/daily.yml \
  -s GEMINI_API_KEY=你的 Gemini API key
```

---

## 3. act 測試注意事項

`act` 適合測：

- checkout
- setup node
- npm ci
- npm scripts
- build

但不一定能完整測：

- GitHub Pages deploy
- OIDC
- deploy-pages
- artifact upload

所以本機驗證時，可以接受 Pages deploy step 被跳過。

---

## 4. 建議開發流程

```text
本機 npm run pipeline
        ↓
本機 act workflow_dispatch
        ↓
push 到 GitHub feature branch
        ↓
GitHub Actions workflow_dispatch 手動跑一次
        ↓
確認成功後再啟用 schedule
```

---

# 安全注意事項

不要：

```ts
const apiKey = "AIza...";
```

不要放在：

```text
src/
static/
public/
```

不要在 Svelte 前端呼叫 Gemini API。

正確做法：

```text
GitHub Actions 呼叫 Gemini
產生 JSON
前端只讀 JSON
```

---

# MVP 不做的事情

第一版先不要做：

- 全文翻譯
- 逐段翻譯
- 大量引用原文
- 抓付費牆文章
- Playwright 爬完整文章
- 資料庫
- 登入系統
- 後端 server
- 前端即時呼叫 Gemini API
- 隱藏原文來源
- 取代原始新聞網站內容

---

# 完成標準

MVP 完成時應該可以：

- 本機 `npm run pipeline` 成功
- 本機 `act workflow_dispatch` 能跑主要流程
- GitHub Actions 手動執行成功
- GitHub Pages 顯示首頁
- 首頁顯示今日 Top 5 中文科技新聞摘要
- 每篇新聞可點擊「閱讀原文」
- 每篇摘要控制在 300 中文字內
- 每日自動更新 JSON 資料
````
