import { analyzeResume } from "../analysis";
import type { AnalysisInput, AnalysisResult } from "../types";
import type { AtsProvider } from "./types";

export class HybridLocalProvider implements AtsProvider {
  readonly name = "hybrid-local" as const;

  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    return analyzeResume(input);
  }
}
