import { z } from "zod";
import { rankedNewsPath, topN } from "./config.js";
import { fetchedNewsItemSchema, rankedNewsItemSchema, type FetchedNewsItem } from "./schema.js";
import { isCommerceOrAd, readJson, writeJson } from "./utils.js";

const keywordWeights: Record<string, number> = {
    "ai": 20,
    "artificial intelligence": 20,
  
    "tsmc": 15,
    "nvidia": 15,
  
    "openai": 14,
    "gpt": 14,
    "anthropic": 14,
    "claude": 14,
  
    "google": 12,
    "gemini": 12,
    "microsoft": 12,
    "meta": 12,
    "amazon": 12,
    "deepseek": 12,
    "xai": 12,
  
    "data center": 12,
    "liquid cooling": 10,
    "nuclear": 10,
  
    "spacex": 10,
    "grok": 10,
    "apple": 10,
    "intel": 10,
    "amd": 10,
    "chip": 10,
    "semiconductor": 10,
  
    "robotics": 10,
    "agent": 10,
  
    "security": 10,
    "vulnerability": 10
  };

const sourceWeights: Record<string, number> = {
  "ars-technica": 12,
  "the-verge": 12,
  techcrunch: 10,
  "mit-tech-review": 11,
  "hacker-news": 8
};

const inputSchema = z.array(fetchedNewsItemSchema);
const outputSchema = z.array(rankedNewsItemSchema);
const inputPath = process.env.NEWS_INPUT ?? ".tmp/news.json";
const outputPath = process.env.RANK_OUTPUT ?? rankedNewsPath;

function recencyScore(publishedAt: string): number {
  const ageHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 36e5);
  return Math.max(0, Math.round(24 - ageHours));
}

function keywordScore(item: FetchedNewsItem): number {
  const haystack = `${item.title} ${item.description}`.toLowerCase();

  return Object.entries(keywordWeights).reduce((total, [keyword, weight]) => {
    return haystack.includes(keyword.toLowerCase()) ? total + weight : total;
  }, 0);
}

async function main(): Promise<void> {
  const news = await readJson(inputPath, inputSchema);
  const ranked = news
    .filter((item) => !isCommerceOrAd(item))
    .map((item) => ({
      ...item,
      rank: 0,
      score: (sourceWeights[item.sourceId] ?? 6) + recencyScore(item.publishedAt) + keywordScore(item)
    }))
    .sort((a, b) => b.score - a.score || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, topN)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  await writeJson(outputPath, outputSchema.parse(ranked));
  console.log(`Wrote ${ranked.length} ranked items to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
