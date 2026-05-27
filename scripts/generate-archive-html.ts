import { readdir } from "node:fs/promises";
import { writeHtml, readJson } from "./utils.js";
import { dailyDataSchema, type DailyData } from "./schema.js";

const dailySchema = dailyDataSchema;

async function main(): Promise<void> {
  const dataDir = "static/data";
  const files = await readdir(dataDir);
  const jsonFiles = files.filter(f => f.endsWith(".json") && f !== "archive.json");

  for (const file of jsonFiles) {
    const date = file.replace(".json", "");
    const jsonPath = `${dataDir}/${file}`;
    const htmlPath = `${dataDir}/${date}.html`;

    try {
      const data = await readJson(jsonPath, dailySchema);
      await writeHtml(htmlPath, data);
      console.log(`Generated HTML for ${date}`);
    } catch (err) {
      console.error(`Failed to generate HTML for ${date}:`, err);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
