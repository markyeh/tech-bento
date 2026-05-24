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
