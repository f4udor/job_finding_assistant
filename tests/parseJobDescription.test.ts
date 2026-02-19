import { describe, expect, it } from "vitest";
import { parseJobDescription } from "@/lib/pipeline";

describe("parseJobDescription", () => {
  it("extracts must requirements with evidence", async () => {
    const jd = `Senior Backend Engineer\nMust have 5+ years of Node.js experience.\nPreferred: Kubernetes knowledge.\nYou will build APIs and collaborate with product.`;
    const spec = await parseJobDescription(jd);

    expect(spec.role.length).toBeGreaterThan(0);
    expect(spec.requirements_must.length).toBeGreaterThan(0);
    expect(spec.requirements_must[0].evidence.length).toBeGreaterThan(0);
    expect(spec.requirements_must[0].label).toContain("Must have");
  });
});
