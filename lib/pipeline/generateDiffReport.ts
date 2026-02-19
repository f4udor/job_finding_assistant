import path from "path";
import type { TailoringPlan } from "@/schemas";
import { absPath, writeTextFile } from "@/lib/io";

export async function generateDiffReport(
  baseCV: string,
  tailoredCV: string,
  tailoringPlan: TailoringPlan
): Promise<{ filePath: string; content: string }> {
  const baseLines = baseCV.split("\n");
  const tailoredLines = tailoredCV.split("\n");

  const removed: string[] = [];
  const added: string[] = [];

  const max = Math.max(baseLines.length, tailoredLines.length);
  for (let i = 0; i < max; i += 1) {
    const before = baseLines[i] ?? "";
    const after = tailoredLines[i] ?? "";

    if (before !== after) {
      if (before.trim()) removed.push(`- ${before}`);
      if (after.trim()) added.push(`+ ${after}`);
    }
  }

  const diff = [
    `# CV Diff Report (${tailoringPlan.jobId})`,
    "",
    "## Tailoring Summary",
    tailoringPlan.positioning_summary,
    "",
    "## Highlights Applied",
    ...tailoringPlan.highlight_bullets.map((b) => `- ${b}`),
    "",
    "## Added/Updated Lines",
    ...(added.length ? added : ["- No added lines detected"]),
    "",
    "## Removed/Replaced Lines",
    ...(removed.length ? removed : ["- No removed lines detected"]),
    ""
  ].join("\n");

  const outputPath = absPath("outputs", `diff_${tailoringPlan.jobId}.md`);
  await writeTextFile(outputPath, diff);

  return {
    filePath: path.relative(absPath(), outputPath),
    content: diff
  };
}
