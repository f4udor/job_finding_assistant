import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { renderLatexCV } from "@/lib/pipeline";
import type { TailoringPlan, UserProfile } from "@/schemas";

describe("renderLatexCV", () => {
  it("renders content without mutating template", async () => {
    const templateBefore = readFileSync("templates/cv_base.tex", "utf-8");

    const profile: UserProfile = {
      fullName: "Chris Doe",
      headline: "Software Engineer",
      summary: "Shipped production systems",
      experiences: [],
      projects: [],
      education: [],
      skills: ["TypeScript"],
      languages: [{ name: "English", level: "Fluent" }],
      preferences: { locations: [] }
    };

    const plan: TailoringPlan = {
      jobId: "job_render",
      positioning_summary: "Summary",
      highlight_bullets: ["Matched requirement with project evidence"],
      gaps: [],
      questions: [],
      mapping: []
    };

    const result = await renderLatexCV(profile, plan, { persist: false, outputId: "job_render" });
    const templateAfter = readFileSync("templates/cv_base.tex", "utf-8");

    expect(templateBefore).toBe(templateAfter);
    expect(result.content).toContain("Chris Doe");
    expect(result.content).not.toContain("{{FULL_NAME}}");
  });
});
