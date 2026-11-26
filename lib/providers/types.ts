import type { AnalysisInput, AnalysisResult } from "../types";

export interface AtsProvider {
  readonly name: "hybrid-local" | "llm";
  analyze(input: AnalysisInput): Promise<AnalysisResult>;
}
