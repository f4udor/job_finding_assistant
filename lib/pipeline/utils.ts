import crypto from "crypto";

const stopWords = new Set([
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "for",
  "with",
  "a",
  "an",
  "on",
  "is",
  "are",
  "as",
  "be",
  "at",
  "by",
  "you",
  "we",
  "our"
]);

export function makeJobId(text: string): string {
  const hash = crypto.createHash("sha1").update(text).digest("hex").slice(0, 10);
  return `job_${hash}`;
}

export function splitSentences(text: string): string[] {
  return text
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function words(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !stopWords.has(token));
}

export function keywordOverlap(left: string, right: string): number {
  const l = new Set(words(left));
  const r = new Set(words(right));
  let count = 0;
  for (const item of l) {
    if (r.has(item)) count += 1;
  }
  return count;
}

export function truncateEvidence(text: string, maxLen = 160): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 3)}...`;
}
