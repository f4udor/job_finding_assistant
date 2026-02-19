import type { JobSpec, Requirement } from "@/schemas";
import { jobSpecSchema } from "@/schemas";
import type { LLMProvider } from "@/lib/llm/provider";
import { defaultLLMProvider } from "@/lib/llm/provider";
import { makeJobId, splitSentences, truncateEvidence, unique } from "@/lib/pipeline/utils";

const stackKeywords = [
  "typescript",
  "javascript",
  "react",
  "next.js",
  "node",
  "python",
  "java",
  "go",
  "aws",
  "docker",
  "kubernetes",
  "postgres",
  "sql",
  "graphql",
  "rest"
];

function inferRole(sentences: string[]): string {
  const explicit = sentences.find((s) => /(?:role|position|title)\s*:/i.test(s));
  if (explicit) {
    return explicit.split(":").slice(1).join(":").trim() || explicit;
  }

  const top = sentences[0] ?? "Unknown role";
  return top.length > 80 ? "Unknown role" : top;
}

function inferSeniority(text: string): string {
  const match = text.match(/\b(junior|mid|senior|staff|lead|principal)\b/i);
  return match ? match[1].toLowerCase() : "unspecified";
}

function toRequirement(sentence: string, priority: Requirement["priority"]): Requirement {
  return {
    label: sentence.replace(/^[-*]\s*/, "").trim(),
    evidence: truncateEvidence(sentence),
    priority
  };
}

export async function parseJobDescription(
  jdText: string,
  provider: LLMProvider = defaultLLMProvider
): Promise<JobSpec> {
  const sentences = splitSentences(jdText);
  const lower = jdText.toLowerCase();

  const llmPatch = (await provider.parseJobDescription?.(jdText)) ?? {};

  const responsibilities = sentences
    .filter((s) => /\b(build|design|develop|own|lead|collaborate|deliver|implement|maintain|optimize)\b/i.test(s))
    .map((s) => toRequirement(s, "medium"));

  const requirementsMust = sentences
    .filter((s) => /\b(must|required|requirements|minimum|strong\s+experience|\d+\+?\s+years?)\b/i.test(s))
    .map((s) => toRequirement(s, "high"));

  const requirementsNice = sentences
    .filter((s) => /\b(preferred|nice to have|bonus|plus)\b/i.test(s))
    .map((s) => toRequirement(s, "low"));

  const stack = unique(
    stackKeywords.filter((keyword) =>
      lower.includes(keyword.replace(".", "")) || lower.includes(keyword)
    )
  );

  const spec: JobSpec = {
    id: llmPatch.id || makeJobId(jdText),
    role: llmPatch.role || inferRole(sentences),
    seniority: llmPatch.seniority || inferSeniority(lower),
    responsibilities: llmPatch.responsibilities?.length
      ? llmPatch.responsibilities
      : responsibilities,
    requirements_must: llmPatch.requirements_must?.length
      ? llmPatch.requirements_must
      : requirementsMust,
    requirements_nice: llmPatch.requirements_nice?.length
      ? llmPatch.requirements_nice
      : requirementsNice,
    stack: llmPatch.stack?.length ? llmPatch.stack : stack
  };

  return jobSpecSchema.parse(spec);
}
