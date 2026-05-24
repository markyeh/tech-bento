import { z } from "zod";

export const fetchedNewsItemSchema = z.object({
  source: z.string(),
  sourceId: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  publishedAt: z.string()
});

export const rankedNewsItemSchema = fetchedNewsItemSchema.extend({
  rank: z.number().int().positive(),
  score: z.number()
});

export const translatedNewsItemSchema = rankedNewsItemSchema.extend({
  originalTitle: z.string(),
  translatedTitle: z.string(),
  summaryZh: z.string(),
  tags: z.array(z.string())
});

export const dailyDataSchema = z.object({
  date: z.string(),
  generatedAt: z.string(),
  items: z.array(
    z.object({
      rank: z.number().int().positive(),
      source: z.string(),
      originalTitle: z.string(),
      translatedTitle: z.string(),
      summaryZh: z.string(),
      url: z.string().url(),
      publishedAt: z.string(),
      score: z.number(),
      tags: z.array(z.string())
    })
  )
});

export const archiveEntrySchema = z.object({
  date: z.string(),
  generatedAt: z.string(),
  path: z.string(),
  count: z.number().int().nonnegative()
});

export type FetchedNewsItem = z.infer<typeof fetchedNewsItemSchema>;
export type RankedNewsItem = z.infer<typeof rankedNewsItemSchema>;
export type TranslatedNewsItem = z.infer<typeof translatedNewsItemSchema>;
export type DailyData = z.infer<typeof dailyDataSchema>;
export type ArchiveEntry = z.infer<typeof archiveEntrySchema>;
