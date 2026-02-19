import { z } from "zod";

export const cvArtifactSchema = z.object({
  jobId: z.string().min(1),
  generatedAt: z.string().min(1),
  baseTemplatePath: z.string().min(1),
  outputTexPath: z.string().min(1),
  diffReportPath: z.string().min(1)
});

export const interviewSessionSchema = z.object({
  transcript: z.array(z.string()).default([]),
  rubricScores: z.record(z.number()).default({})
});

export type CVArtifact = z.infer<typeof cvArtifactSchema>;
export type InterviewSession = z.infer<typeof interviewSessionSchema>;
