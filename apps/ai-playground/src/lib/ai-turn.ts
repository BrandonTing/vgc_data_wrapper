import { buildGroundingNotes } from "vgc_data_wrapper";
import {
  executeCalculateAiDamageToolCall,
  type CalculateAiDamageTrace,
} from "./tools/calculate-ai-damage";

/** Observable model-turn data rendered by the Tool Call Trace panel. */
export type AiToolTurn = {
  mode: "stub" | "openai";
  trace: CalculateAiDamageTrace;
  modelResponse: string;
  groundingNotes: string[];
};

/** Runs a provider-free deterministic tool turn and creates a grounded CI-safe explanation. */
export function buildStubbedAiToolTurn(rawArguments: unknown): AiToolTurn {
  const { trace, result } = executeCalculateAiDamageToolCall(rawArguments);
  const lowRoll = result.rolls.at(0);
  const highRoll = result.rolls.at(-1);
  const damageRange =
    lowRoll && highRoll
      ? `${lowRoll.number}-${highRoll.number} damage (${lowRoll.percentage}-${highRoll.percentage}%)`
      : "no damage rolls";
  const modelResponse = `The deterministic calculateAiDamage tool returned ${damageRange} with a ${result.koChance}% OHKO chance.`;

  return {
    mode: "stub",
    trace,
    modelResponse,
    groundingNotes: buildGroundingNotes(result, modelResponse),
  };
}
