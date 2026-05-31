import { describe, expect, test } from "bun:test";
import {
  evaluateDeterministicInput,
  SAMPLE_AI_DAMAGE_INPUT_TEXT,
} from "../src/lib/playground-state";

describe("evaluateDeterministicInput", () => {
  test("materializes defaults and executes deterministic damage", () => {
    const evaluation = evaluateDeterministicInput(SAMPLE_AI_DAMAGE_INPUT_TEXT);

    expect(evaluation.parseError).toBeNull();
    expect(evaluation.snapshot?.validation).toEqual({
      isValid: true,
      issues: [],
    });
    expect(evaluation.snapshot?.normalizedInput?.attacker.level).toBe(50);
    expect(evaluation.snapshot?.normalizedInput?.field.isDouble).toBe(true);
    expect(evaluation.snapshot?.result?.rolls.length).toBeGreaterThan(0);
    expect(evaluation.snapshot?.groundingNotes).toContain(
      "field.isDouble defaulted to true",
    );
  });

  test("returns a path-aware schema issue for invalid structured input", () => {
    const evaluation = evaluateDeterministicInput(
      JSON.stringify({
        attacker: { statMode: "derived", types: ["Normal"] },
        defender: { statMode: "manual", types: ["Normal"], stats: {} },
        move: { base: 100, type: "Normal", category: "Special" },
      }),
    );

    expect(evaluation.parseError).toBeNull();
    expect(evaluation.snapshot?.validation.isValid).toBe(false);
    expect(evaluation.snapshot?.validation.issues).toContainEqual({
      path: "move.target",
      message: "Required",
    });
    expect(evaluation.snapshot?.normalizedInput).toBeNull();
    expect(evaluation.snapshot?.result).toBeNull();
  });

  test("keeps malformed JSON separate from schema validation", () => {
    const evaluation = evaluateDeterministicInput("{");

    expect(evaluation.parseError).not.toBeNull();
    expect(evaluation.snapshot).toBeNull();
  });
});
