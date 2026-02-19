import { describe, expect, it } from "vitest";
import { buildTailoringPlan } from "@/lib/pipeline";
import type { JobSpec, UserProfile } from "@/schemas";

describe("buildTailoringPlan", () => {
  it("marks missing requirements and asks questions", () => {
    const user: UserProfile = {
      fullName: "Alex",
      headline: "Engineer",
      summary: "Built React dashboards",
      experiences: [],
      projects: [],
      education: [],
      skills: ["React"],
      languages: [],
      preferences: { locations: [] }
    };

    const job: JobSpec = {
      id: "job_x",
      role: "Backend Engineer",
      seniority: "senior",
      responsibilities: [],
      requirements_must: [
        { label: "5+ years Node.js", evidence: "Must have 5+ years of Node.js", priority: "high" }
      ],
      requirements_nice: [],
      stack: ["node"]
    };

    const plan = buildTailoringPlan(user, job);
    expect(plan.gaps.length).toBe(1);
    expect(plan.questions.length).toBeGreaterThan(0);
  });
});
