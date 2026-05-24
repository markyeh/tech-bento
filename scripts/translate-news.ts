import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { rankedNewsPath } from "./config.js";
import { rankedNewsItemSchema, translatedNewsItemSchema } from "./schema.js";
import { readJson, writeJson } from "./utils.js";

const inputSchema = z.array(rankedNewsItemSchema);
const modelResultSchema = z.object({
  translatedTitle: z.string(),
  summaryZh: z.string(),
  tags: z.array(z.string())
});
const outputSchema = z.array(translatedNewsItemSchema);
const inputPath = process.env.RANK_INPUT ?? rankedNewsPath;
const outputPath = process.env.TRANSLATED_OUTPUT ?? ".tmp/translated.json";
const retryCount = Number(process.env.GEMINI_RETRY_COUNT ?? 10);
const retryDelayMs = Number(process.env.GEMINI_RETRY_DELAY_MS ?? 60_000);

type GeminiKey = {
  name: string;
  value: string;
};

function promptFor(item: z.infer<typeof rankedNewsItemSchema>): string {
  return `你是台灣科技媒體編輯。

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

Title: ${item.title}
Source: ${item.source}
Description: ${item.description}
URL: ${item.url}
Published At: ${item.publishedAt}`;
}

function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed);
}

function geminiApiKeys(): GeminiKey[] {
  return [
    ["GEMINI_API_KEY", process.env.GEMINI_API_KEY],
    ["GEMINI_API_KEY_2", process.env.GEMINI_API_KEY_2],
    ["GEMINI_API_KEY_3", process.env.GEMINI_API_KEY_3]
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => ({ name, value }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const value = "status" in error ? error.status : undefined;
  return typeof value === "number" ? value : undefined;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isQuotaError(error: unknown): boolean {
  const text = errorText(error).toLowerCase();
  return (
    errorCode(error) === 429 ||
    text.includes("resource_exhausted") ||
    text.includes("quota") ||
    text.includes("rate limit")
  );
}

function isRetryableError(error: unknown): boolean {
  const code = errorCode(error);
  return code === 408 || code === 500 || code === 502 || code === 503 || code === 504;
}

async function generateTranslation(
  item: z.infer<typeof rankedNewsItemSchema>,
  keys: GeminiKey[]
): Promise<z.infer<typeof modelResultSchema>> {
  let lastError: unknown;

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const key = keys[keyIndex];
    const ai = new GoogleGenAI({ apiKey: key.value });

    for (let attempt = 1; attempt <= retryCount; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptFor(item),
          config: {
            responseMimeType: "application/json"
          }
        });
        const text = response.text ?? "";
        return modelResultSchema.parse(parseJsonResponse(text));
      } catch (error) {
        lastError = error;

        if (isQuotaError(error) && keyIndex < keys.length - 1) {
          console.warn(`${key.name} quota/rate limited. Switching to ${keys[keyIndex + 1].name}.`);
          break;
        }

        if (isRetryableError(error) && attempt < retryCount) {
          const delay = retryDelayMs * attempt;
          console.warn(
            `Gemini request failed with ${errorCode(error) ?? "unknown status"} for rank ${
              item.rank
            }. Retrying in ${Math.round(delay / 1000)}s (${attempt + 1}/${retryCount}).`
          );
          await sleep(delay);
          continue;
        }

        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function main(): Promise<void> {
  const apiKeys = geminiApiKeys();

  if (apiKeys.length === 0) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const rankedItems = await readJson(inputPath, inputSchema);
  const translated = [];

  for (const item of rankedItems) {
    const result = await generateTranslation(item, apiKeys);

    translated.push({
      ...item,
      originalTitle: item.title,
      translatedTitle: result.translatedTitle,
      summaryZh: result.summaryZh,
      tags: result.tags
    });
  }

  await writeJson(outputPath, outputSchema.parse(translated));
  console.log(`Wrote ${translated.length} translated items to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
