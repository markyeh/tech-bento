import { access, readFile } from "node:fs/promises";
import { z } from "zod";
import {
  archiveEntrySchema,
  dailyDataSchema,
  translatedNewsItemSchema,
  type ArchiveEntry,
  type DailyData
} from "./schema.js";
import { readJson, taipeiDateParts, writeJson, writeHtml } from "./utils.js";

const translatedSchema = z.array(translatedNewsItemSchema);
const archiveSchema = z.array(archiveEntrySchema);

async function readArchive(path: string): Promise<ArchiveEntry[]> {
  try {
    await access(path);
    return archiveSchema.parse(JSON.parse(await readFile(path, "utf8")));
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const translated = await readJson(".tmp/translated.json", translatedSchema);
  const { date, generatedAt } = taipeiDateParts();
  const daily: DailyData = {
    date,
    generatedAt,
    items: translated.map((item) => ({
      rank: item.rank,
      source: item.source,
      originalTitle: item.originalTitle,
      translatedTitle: item.translatedTitle,
      summaryZh: item.summaryZh.slice(0, 300),
      url: item.url,
      publishedAt: item.publishedAt,
      score: item.score,
      tags: item.tags
    }))
  };

  dailyDataSchema.parse(daily);

  const archivePath = "static/data/archive.json";
  const archive = await readArchive(archivePath);
  const entry = {
    date,
    generatedAt,
    path: `/data/${date}.json`,
    count: daily.items.length
  };
  const updatedArchive = [entry, ...archive.filter((item) => item.date !== date)].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  await writeJson("static/data/latest.json", daily);
  await writeJson(`static/data/${date}.json`, daily);
  await writeHtml(`static/data/${date}.html`, daily);
  await writeJson(archivePath, archiveSchema.parse(updatedArchive));
  console.log(`Wrote static data for ${date}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
