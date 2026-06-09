import type { CalculateAiDamageTrace } from "./tools/calculate-ai-damage";

/** Observable model-turn data rendered by the Tool Call Trace panel. */
export type AiToolTurn = {
  mode: "mock" | "openai";
  trace: CalculateAiDamageTrace;
  modelResponse: string;
  /** Locally derived checks comparing the model response with deterministic output. */
  groundingNotes: string[];
};
