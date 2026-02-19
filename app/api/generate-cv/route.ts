import { NextResponse } from "next/server";
import {
  absPath,
  readJsonFile,
  writeJsonFile
} from "@/lib/io";
import {
  generateDiffReport,
  renderLatexCV
} from "@/lib/pipeline";
import {
  cvArtifactSchema,
  tailoringPlanSchema,
  type TailoringPlan,
  type UserProfile,
  userProfileSchema
} from "@/schemas";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const payload = await req.json();
    const jobId = String(payload.jobId ?? "").trim();
    if (!jobId) {
      return NextResponse.json({ ok: false, error: "jobId is required" }, { status: 400 });
    }

    const profileRaw = await readJsonFile<UserProfile>(absPath("data", "user_profile.json"));
    const planRaw =
      (await readJsonFile<TailoringPlan>(absPath("data", "jobs", jobId, "tailoring_plan.json"))) ??
      (await readJsonFile<TailoringPlan>(absPath("data", "tailoring_plan.json")));

    if (!profileRaw || !planRaw) {
      return NextResponse.json(
        { ok: false, error: "Missing user profile or tailoring plan." },
        { status: 400 }
      );
    }

    const profile = userProfileSchema.parse(profileRaw);
    const plan = tailoringPlanSchema.parse(planRaw);

    const basePlan: TailoringPlan = {
      ...plan,
      highlight_bullets: [],
      positioning_summary: profile.summary || "Base CV without job-specific tailoring",
      questions: [],
      gaps: [],
      mapping: []
    };

    const baseCV = (await renderLatexCV(profile, basePlan, { outputId: `${jobId}_base`, persist: false })).content;
    const tailored = await renderLatexCV(profile, plan, { outputId: jobId, persist: true });
    const diff = await generateDiffReport(baseCV, tailored.content, plan);

    const artifact = cvArtifactSchema.parse({
      jobId,
      generatedAt: new Date().toISOString(),
      baseTemplatePath: tailored.baseTemplatePath,
      outputTexPath: tailored.filePath,
      diffReportPath: diff.filePath
    });

    await writeJsonFile(absPath("data", "jobs", jobId, "cv_artifact.json"), artifact);

    return NextResponse.json({
      ok: true,
      artifact,
      preview: {
        latex: tailored.content,
        diff: diff.content
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "CV generation failed" },
      { status: 400 }
    );
  }
}
