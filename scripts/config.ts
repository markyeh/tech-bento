const DEFAULT_TOP_N = 5;

function readPositiveInteger(value: string | undefined, name: string): number | null {
  if (!value) return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

export const topN =
  readPositiveInteger(process.env.TOP_N, "TOP_N") ??
  readPositiveInteger(process.env.TOP_LIMIT, "TOP_LIMIT") ??
  DEFAULT_TOP_N;

export const rankedNewsPath = ".tmp/top-ranked.json";
