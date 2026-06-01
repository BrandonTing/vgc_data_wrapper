import { describe, expect, test } from "bun:test";
import { chat, type StreamChunk } from "@tanstack/ai";
import { createMockDamageTextAdapter } from "../src/lib/adapters/mock-damage-text";
import { SAMPLE_AI_DAMAGE_INPUT } from "../src/lib/playground-state";
import {
  CALCULATE_AI_DAMAGE_TOOL_NAME,
  CALCULATE_AI_DAMAGE_TRACE_EVENT,
  calculateAiDamageTool,
  inspectCalculateAiDamageToolCall,
  type CalculateAiDamageTrace,
} from "../src/lib/tools/calculate-ai-damage";

async function runMockedTanStackTurn(): Promise<StreamChunk[]> {
  const chunks: StreamChunk[] = [];
  const stream = chat({
    adapter: createMockDamageTextAdapter(SAMPLE_AI_DAMAGE_INPUT),
    messages: [{ role: "user", content: "Calculate deterministic damage" }],
    tools: [calculateAiDamageTool],
  });
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
}

describe("calculateAiDamage AI tool turn", () => {
  test("runs the deterministic tool through the mocked TanStack AI agent loop", async () => {
    const chunks = await runMockedTanStackTurn();
    const types = chunks.map((chunk) => chunk.type);
    const traceEvent = chunks.find(
      (chunk) => chunk.type === "CUSTOM" && chunk.name === CALCULATE_AI_DAMAGE_TRACE_EVENT,
    );
    const trace = traceEvent?.type === "CUSTOM" ? (traceEvent.value as CalculateAiDamageTrace) : null;
    const response = chunks
      .filter((chunk) => chunk.type === "TEXT_MESSAGE_CONTENT")
      .map((chunk) => chunk.delta)
      .join("");

    expect(types).toContain("TOOL_CALL_START");
    expect(types).toContain("TOOL_CALL_ARGS");
    expect(types).toContain("TOOL_CALL_END");
    expect(types).toContain("TOOL_CALL_RESULT");
    expect(types.indexOf("TOOL_CALL_RESULT")).toBeLessThan(types.indexOf("TEXT_MESSAGE_CONTENT"));
    expect(trace?.schemaValidation).toEqual({ isValid: true, issues: [] });
    expect(trace?.normalizedArguments?.field.isDouble).toBe(true);
    expect(trace?.rawDeterministicResult?.rolls.length).toBeGreaterThan(0);
    expect(response).toContain("deterministic calculateAiDamage tool returned");
  });

  test("records validation failure without executing deterministic damage", () => {
    const trace = inspectCalculateAiDamageToolCall({});

    expect(trace.toolName).toBe(CALCULATE_AI_DAMAGE_TOOL_NAME);
    expect(trace.schemaValidation.isValid).toBe(false);
    expect(trace.normalizedArguments).toBeNull();
    expect(trace.rawDeterministicResult).toBeNull();
    expect(trace.stateTransitions.at(-1)).toBe("error");
  });

  test("emits the validation trace before rejecting invalid tool arguments", async () => {
    const events: Array<{ eventType: string; data: unknown }> = [];
    const context = {
      emitCustomEvent(eventType: string, data: unknown) {
        events.push({ eventType, data });
      },
    } as Parameters<typeof calculateAiDamageTool.execute>[1];

    await expect(calculateAiDamageTool.execute({}, context)).rejects.toThrow(
      "Invalid calculateAiDamage tool arguments",
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe(CALCULATE_AI_DAMAGE_TRACE_EVENT);
    expect((events[0]?.data as CalculateAiDamageTrace).schemaValidation.isValid).toBe(false);
    expect((events[0]?.data as CalculateAiDamageTrace).rawArguments).toEqual({});
  });
});
