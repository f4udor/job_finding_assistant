import { NextResponse } from "next/server";
import { absPath, readJsonFile, writeJsonFile } from "@/lib/io";
import { buildTailoringPlan, generateQuestions } from "@/lib/pipeline";
import { jobSpecSchema, type TailoringPlan, tailoringPlanSchema, type UserProfile, userProfileSchema } from "@/schemas";

type QA = { question: string; answer: string };

function mergeAnswers(plan: TailoringPlan, answers: QA[]): TailoringPlan {
  if (!answers.length) return plan;

  const nonEmptyAnswers = answers.filter((a) => a.answer.trim().length > 0);
  if (!nonEmptyAnswers.length) return plan;

  const updatedMapping = plan.mapping.map((mapEntry) => {
    const hits = nonEmptyAnswers
      .filter((qa) => qa.question.includes(mapEntry.requirement_label))
      .map((qa) => qa.answer.trim());

    if (!hits.length) return mapEntry;

    return {
      ...mapEntry,
      user_evidence: [...mapEntry.user_evidence, ...hits],
      status: mapEntry.status === "missing" ? "partial" : mapEntry.status
    };
  });

  const unanswered = plan.questions.filter(
    (q) => !nonEmptyAnswers.some((qa) => qa.question === q && qa.answer.trim().length > 0)
  );

  return tailoringPlanSchema.parse({
    ...plan,
    questions: unanswered,
    mapping: updatedMapping,
    highlight_bullets: [
      ...plan.highlight_bullets,
      ...nonEmptyAnswers.map((a) => `Additional user evidence provided: ${a.answer.trim()}`)
    ]
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const payload = await req.json();
    const jobId = String(payload.jobId ?? "").trim();
    const answers = (payload.answers ?? []) as QA[];

    if (!jobId) {
      return NextResponse.json({ ok: false, error: "jobId is required" }, { status: 400 });
    }

    const profileRaw = await readJsonFile<UserProfile>(absPath("data", "user_profile.json"));
    const jobSpecRaw = await readJsonFile(absPath("data", "jobs", jobId, "job_spec.json"));

    if (!profileRaw || !jobSpecRaw) {
      return NextResponse.json(
        { ok: false, error: "Missing user profile or job spec. Complete earlier steps first." },
        { status: 400 }
      );
    }

    const profile = userProfileSchema.parse(profileRaw);
    const jobSpec = jobSpecSchema.parse(jobSpecRaw);
    const basePlan = buildTailoringPlan(profile, jobSpec);
    const plan = mergeAnswers(basePlan, answers);

    await writeJsonFile(absPath("data", "tailoring_plan.json"), plan);
    await writeJsonFile(absPath("data", "jobs", jobId, "tailoring_plan.json"), plan);

    return NextResponse.json({ ok: true, tailoringPlan: plan, questions: generateQuestions(plan) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Tailoring failed" },
      { status: 400 }
    );
  }
}
