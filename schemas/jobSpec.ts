import { z } from "zod";

export const requirementSchema = z.object({
  label: z.string().min(1),
  evidence: z.string().min(1),
  priority: z.enum(["high", "medium", "low"])
});

export const jobSpecSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  seniority: z.string().min(1),
  responsibilities: z.array(requirementSchema).default([]),
  requirements_must: z.array(requirementSchema).default([]),
  requirements_nice: z.array(requirementSchema).default([]),
  stack: z.array(z.string().min(1)).default([])
});

export type Requirement = z.infer<typeof requirementSchema>;
export type JobSpec = z.infer<typeof jobSpecSchema>;
