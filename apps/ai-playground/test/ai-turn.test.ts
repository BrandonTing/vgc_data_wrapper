import { describe, expect, test } from "bun:test";
import { buildStubbedAiToolTurn } from "../src/lib/ai-turn";
import { SAMPLE_AI_DAMAGE_INPUT } from "../src/lib/playground-state";
import {
  CALCULATE_AI_DAMAGE_TOOL_NAME,
  inspectCalculateAiDamageToolCall,
} from "../src/lib/tools/calculate-ai-damage";

describe("calculateAiDamage AI tool turn", () => {
  test("executes the deterministic tool before creating a grounded stub explanation", () => {
    const turn = buildStubbedAiToolTurn(SAMPLE_AI_DAMAGE_INPUT);

    expect(turn.mode).toBe("stub");
    expect(turn.trace.toolName).toBe(CALCULATE_AI_DAMAGE_TOOL_NAME);
    expect(turn.trace.schemaValidation).toEqual({ isValid: true, issues: [] });
    expect(turn.trace.normalizedArguments?.field.isDouble).toBe(true);
    expect(turn.trace.stateTransitions).toEqual([
      "awaiting-input",
      "input-streaming",
      "input-complete",
      "executing",
      "complete",
    ]);
    expect(turn.trace.rawDeterministicResult?.rolls.length).toBeGreaterThan(0);
    expect(turn.modelResponse).toContain("deterministic calculateAiDamage tool returned");
    expect(turn.groundingNotes).toEqual([]);
  });

  test("records validation failure without executing deterministic damage", () => {
    const trace = inspectCalculateAiDamageToolCall({});

    expect(trace.schemaValidation.isValid).toBe(false);
    expect(trace.normalizedArguments).toBeNull();
    expect(trace.rawDeterministicResult).toBeNull();
    expect(trace.stateTransitions.at(-1)).toBe("error");
  });
});
