import type { TailoringPlan } from "@/schemas";

export function generateQuestions(tailoringPlan: TailoringPlan): string[] {
  return tailoringPlan.questions;
}
