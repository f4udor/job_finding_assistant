import type { JobSpec, TailoringPlan, UserProfile } from "@/schemas";
import { tailoringPlanSchema } from "@/schemas";
import { keywordOverlap } from "@/lib/pipeline/utils";

function collectUserEvidence(user: UserProfile): string[] {
  return [
    ...(user.summary ? [user.summary] : []),
    ...user.skills.map((s) => `Skill: ${s}`),
    ...user.experiences.flatMap((exp) => [
      `${exp.role} at ${exp.company}`,
      ...exp.bullets.map((b) => `${exp.role} - ${b}`)
    ]),
    ...user.projects.flatMap((p) => [p.name, p.description, ...(p.impact ? [p.impact] : [])])
  ];
}

export function buildTailoringPlan(userProfile: UserProfile, jobSpec: JobSpec): TailoringPlan {
  const evidencePool = collectUserEvidence(userProfile);
  const requirements = [...jobSpec.requirements_must, ...jobSpec.requirements_nice];

  const mapping = requirements.map((req) => {
    const ranked = evidencePool
      .map((entry) => ({ entry, overlap: keywordOverlap(req.label, entry) }))
      .sort((a, b) => b.overlap - a.overlap);

    const selected = ranked.filter((r) => r.overlap > 0).slice(0, 2).map((r) => r.entry);
    const bestScore = ranked[0]?.overlap ?? 0;

    const status = bestScore >= 3 ? "covered" : bestScore > 0 ? "partial" : "missing";

    return {
      requirement_label: req.label,
      requirement_evidence: req.evidence,
      user_evidence: selected,
      status
    };
  });

  const covered = mapping.filter((m) => m.status === "covered");
  const missing = mapping.filter((m) => m.status === "missing");
  const partial = mapping.filter((m) => m.status === "partial");

  const highlightBullets = covered.slice(0, 5).map((m) => {
    const evidence = m.user_evidence[0] ?? "No direct proof provided yet";
    return `Match ${m.requirement_label} with profile evidence: ${evidence}`;
  });

  const gaps = missing.map((m) => m.requirement_label);

  const questions = [
    ...missing.map(
      (m) => `Do you have concrete experience for: '${m.requirement_label}'? Share measurable outcomes if available.`
    ),
    ...partial.map(
      (m) => `Can you provide stronger evidence (project, metric, scope) for: '${m.requirement_label}'?`
    )
  ];

  const positioningSummary = [
    `Target role: ${jobSpec.role} (${jobSpec.seniority}).`,
    `Covered requirements: ${covered.length}/${requirements.length}.`,
    missing.length > 0
      ? `There are ${missing.length} missing requirement(s) requiring clarification.`
      : "No critical requirement gaps detected from available profile data."
  ].join(" ");

  return tailoringPlanSchema.parse({
    jobId: jobSpec.id,
    positioning_summary: positioningSummary,
    highlight_bullets: highlightBullets,
    gaps,
    questions,
    mapping
  });
}
