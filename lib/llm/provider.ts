import type { JobSpec } from "@/schemas";

export interface LLMProvider {
  parseJobDescription?(jdText: string): Promise<Partial<JobSpec> | null>;
}

export class MockLLMProvider implements LLMProvider {
  async parseJobDescription(): Promise<null> {
    return null;
  }
}

export const defaultLLMProvider = new MockLLMProvider();
