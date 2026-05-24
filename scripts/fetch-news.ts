import Parser from "rss-parser";
import { z } from "zod";
import { sources } from "./sources.js";
import { fetchedNewsItemSchema, type FetchedNewsItem } from "./schema.js";
import { isCommerceOrAd, stripHtml, writeJson } from "./utils.js";

const parser = new Parser();
const outputSchema = z.array(fetchedNewsItemSchema);

function fetchRange(): { from: Date; to: Date; outputPath: string } {
  const now = new Date();
  const windowHours = Number(process.env.NEWS_WINDOW_HOURS ?? 24);
  const from = process.env.NEWS_FROM
    ? new Date(process.env.NEWS_FROM)
    : new Date(now.getTime() - windowHours * 60 * 60 * 1000);
  const to = process.env.NEWS_TO ? new Date(process.env.NEWS_TO) : now;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    throw new Error("Invalid news fetch range");
  }

  return {
    from,
    to,
    outputPath: process.env.NEWS_OUTPUT ?? ".tmp/news.json"
  };
}

function itemDate(item: Parser.Item): Date | null {
  const raw = item.isoDate ?? item.pubDate;
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function itemUrl(item: Parser.Item): string | null {
  const url = item.link ?? item.guid;
  if (!url) return null;

  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const { from, to, outputPath } = fetchRange();
  const seenUrls = new Set<string>();
  const news: FetchedNewsItem[] = [];

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items) {
        const published = itemDate(item);
        const url = itemUrl(item);
        const title = stripHtml(item.title);

        if (
          !published ||
          published < from ||
          published >= to ||
          !url ||
          !title ||
          seenUrls.has(url)
        ) {
          continue;
        }

        const newsItem = {
          source: source.name,
          sourceId: source.id,
          title,
          description: stripHtml(item.contentSnippet ?? item.content ?? item.summary),
          url,
          publishedAt: published.toISOString()
        };

        if (isCommerceOrAd(newsItem)) {
          continue;
        }

        seenUrls.add(url);
        news.push(newsItem);
      }
    } catch (error) {
      console.warn(`Failed to fetch ${source.name}:`, error);
    }
  }

  const sorted = news.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  await writeJson(outputPath, outputSchema.parse(sorted));
  console.log(`Wrote ${sorted.length} news items to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
