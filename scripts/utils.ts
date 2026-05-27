import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";

export async function readJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const data = JSON.parse(await readFile(path, "utf8"));
  return schema.parse(data);
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function writeHtml(path: string, dailyData: { date: string; generatedAt: string; items: Array<{ rank: number; source: string; translatedTitle: string; summaryZh: string; tags: string[]; publishedAt: string; url: string }> }): Promise<void> {
  await mkdir(dirname(path), { recursive: true });

  const formatDate = (value: string): string => {
    const d = new Date(`${value}T00:00:00+08:00`);
    return d.toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  const formatTime = (value: string): string => {
    const d = new Date(value);
    return d.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const itemsHtml = dailyData.items.map(item => `
    <article class="news-card">
      <div class="rank">#${item.rank}</div>
      <div class="content">
        <h2>${item.translatedTitle}</h2>
        <p>${item.summaryZh}</p>
        <div class="tags">${item.tags.map(t => `<span>${t}</span>`).join("")}</div>
        <div class="meta">
          <span>來源：${item.source}</span>
          <span>發布時間：${formatTime(item.publishedAt)}</span>
        </div>
        <a class="read-link" href="${item.url}" target="_blank" rel="noopener noreferrer">閱讀原文</a>
      </div>
    </article>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>tech-bento - ${formatDate(dailyData.date)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
    .container { max-width: 920px; margin: 0 auto; padding: 24px; }
    .header { padding: 24px 0; border-bottom: 1px solid #ddd; margin-bottom: 24px; }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    .date-info { color: #999; font-size: 0.95rem; }
    .news-list { display: grid; gap: 14px; }
    .news-card { display: grid; grid-template-columns: 76px 1fr; gap: 20px; padding: 20px; background: white; border: 1px solid #e0e0e0; border-radius: 8px; }
    .rank { font-size: 1.8rem; font-weight: 800; color: #ff6b6b; line-height: 1; }
    .content { min-width: 0; }
    h2 { font-size: 1.3rem; margin-bottom: 12px; line-height: 1.3; }
    .content p { margin: 12px 0; color: #666; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .tags span { padding: 4px 9px; background: #f0f0f0; color: #ff6b6b; border-radius: 999px; font-size: 0.85rem; font-weight: 700; }
    .meta { display: flex; flex-wrap: wrap; gap: 18px; margin: 12px 0; font-size: 0.9rem; color: #999; }
    .read-link { display: inline-block; margin-top: 12px; padding: 8px 16px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 6px; font-weight: 700; }
    .read-link:hover { background: #ff5252; }
    @media (max-width: 640px) {
      .container { padding: 16px; }
      .news-card { grid-template-columns: 1fr; gap: 12px; padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>tech-bento</h1>
      <div class="date-info">${formatDate(dailyData.date)} - Top ${dailyData.items.length} 科技新聞</div>
    </div>
    <section class="news-list">
      ${itemsHtml}
    </section>
  </div>
</body>
</html>`;

  await writeFile(path, html, "utf8");
}

export function stripHtml(value: string | undefined): string {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const commerceTitleOrUrlPatterns = [
  /\bdeals?\b/i,
  /\bdiscounts?\b/i,
  /\bsales?\b/i,
  /\bcoupons?\b/i,
  /\bpromo\b/i,
  /\boffers?\b/i,
  /\bshop(?:ping)?\b/i,
  /\bgift guide\b/i,
  /\bblack friday\b/i,
  /\bcyber monday\b/i,
  /\bprime day\b/i,
  /\bmemorial day\b/i,
  /\bsponsored\b/i,
  /\badvertorial\b/i,
  /\baffiliate\b/i
];

const commerceBodyPatterns = [
  /\bwhere to buy\b/i,
  /\$\d+(?:\.\d{2})?/,
  /\bat (?:amazon|best buy|walmart|target|rei)\b/i,
  /\b(?:amazon|best buy|walmart|target|rei) deal\b/i
];

export function isCommerceOrAd(item: {
  title: string;
  description: string;
  url: string;
}): boolean {
  const titleAndUrl = `${item.title} ${item.url}`;
  if (commerceTitleOrUrlPatterns.some((pattern) => pattern.test(titleAndUrl))) {
    return true;
  }

  return commerceBodyPatterns.some((pattern) => pattern.test(item.description));
}

export function taipeiDateParts(date = new Date()): { date: string; generatedAt: string } {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);

  return { date: dateParts, generatedAt: `${dateParts}T${timeParts}+08:00` };
}
