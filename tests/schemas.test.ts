import { describe, expect, it } from "vitest";
import { userProfileSchema } from "@/schemas";

describe("userProfileSchema", () => {
  it("accepts a minimal valid profile", () => {
    const profile = userProfileSchema.parse({
      fullName: "Jane Doe",
      experiences: [],
      projects: [],
      education: [],
      skills: [],
      languages: [],
      preferences: { locations: [] }
    });

    expect(profile.fullName).toBe("Jane Doe");
  });

  it("rejects empty fullName", () => {
    const result = userProfileSchema.safeParse({
      fullName: "",
      experiences: [],
      projects: [],
      education: [],
      skills: [],
      languages: [],
      preferences: { locations: [] }
    });

    expect(result.success).toBe(false);
  });
});
