import { z } from "zod";

const requirementMappingSchema = z.object({
  requirement_label: z.string().min(1),
  requirement_evidence: z.string().min(1),
  user_evidence: z.array(z.string()).default([]),
  status: z.enum(["covered", "partial", "missing"])
});

export const tailoringPlanSchema = z.object({
  jobId: z.string().min(1),
  positioning_summary: z.string().min(1),
  highlight_bullets: z.array(z.string().min(1)).default([]),
  gaps: z.array(z.string().min(1)).default([]),
  questions: z.array(z.string().min(1)).default([]),
  mapping: z.array(requirementMappingSchema).default([])
});

export type TailoringPlan = z.infer<typeof tailoringPlanSchema>;
