import { LlmProvider } from "./llm";
import type { AtsProvider } from "./types";

/** LlmProvider falls back to the deterministic engine when no key is configured. */
export function getProvider(): AtsProvider {
  return new LlmProvider();
}
