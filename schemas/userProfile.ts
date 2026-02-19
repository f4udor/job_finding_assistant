import { z } from "zod";

const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  bullets: z.array(z.string().min(1)).default([])
});

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string()).default([]),
  impact: z.string().optional()
});

const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const languageSchema = z.object({
  name: z.string().min(1),
  level: z.string().min(1)
});

const preferencesSchema = z.object({
  targetRole: z.string().optional(),
  locations: z.array(z.string()).default([]),
  remote: z.boolean().optional()
});

export const userProfileSchema = z.object({
  fullName: z.string().min(1),
  headline: z.string().optional(),
  summary: z.string().optional(),
  experiences: z.array(experienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(z.string().min(1)).default([]),
  languages: z.array(languageSchema).default([]),
  preferences: preferencesSchema.default({ locations: [] })
});

export type UserProfile = z.infer<typeof userProfileSchema>;
