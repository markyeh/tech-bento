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

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  const rankedItems = await readJson(inputPath, inputSchema);
  const translated = [];

  for (const item of rankedItems) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptFor(item),
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text ?? "";
    const result = modelResultSchema.parse(parseJsonResponse(text));

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
