import {
  AiDamageCalcOutputSchema,
  type AiDamageCalcOutput,
} from "vgc_data_wrapper";
import {
  EventType,
  type AnyTextAdapter,
  type ModelMessage,
  type StreamChunk,
} from "@tanstack/ai";
import { CALCULATE_AI_DAMAGE_TOOL_NAME } from "../tools/calculate-ai-damage";

const MOCK_MODEL = "mock-damage-explainer";
const TOOL_CALL_ID = "mock-calculate-ai-damage";

function findDeterministicResult(messages: ModelMessage[]): AiDamageCalcOutput | null {
  const toolMessage = messages.findLast(
    (message) => message.role === "tool" && message.toolCallId === TOOL_CALL_ID,
  );
  // Tool content can be non-text; only JSON text is valid deterministic output.
  if (typeof toolMessage?.content !== "string") return null;

  try {
    return AiDamageCalcOutputSchema.parse(JSON.parse(toolMessage.content));
  } catch {
    return null;
  }
}

function explainDeterministicResult(result: AiDamageCalcOutput): string {
  const lowRoll = result.rolls.at(0);
  const highRoll = result.rolls.at(-1);
  const damageRange =
    lowRoll && highRoll
      ? `${lowRoll.number}-${highRoll.number} damage (${lowRoll.percentage}-${highRoll.percentage}%)`
      : "no damage rolls";
  return `The deterministic calculateAiDamage tool returned ${damageRange} with a ${result.koChance}% OHKO chance.`;
}

/** Creates a provider-free model adapter that exercises the real TanStack AI tool loop. */
export function createMockDamageTextAdapter(rawArguments: unknown): AnyTextAdapter {
  return {
    kind: "text",
    name: "mock-damage",
    model: MOCK_MODEL,
    "~types": {
      providerOptions: {},
      inputModalities: ["text"],
      messageMetadataByModality: {},
      toolCapabilities: [],
      toolCallMetadata: undefined,
      systemPromptMetadata: undefined,
    },
    async *chatStream(options): AsyncIterable<StreamChunk> {
      const runId = options.runId ?? crypto.randomUUID();
      const threadId = options.threadId ?? crypto.randomUUID();
      const timestamp = Date.now();
      yield { type: EventType.RUN_STARTED, runId, threadId, timestamp, model: MOCK_MODEL };

      const result = findDeterministicResult(options.messages);
      if (!result) {
        const rawArgumentsJson = JSON.stringify(rawArguments);
        yield {
          type: EventType.TOOL_CALL_START,
          toolCallId: TOOL_CALL_ID,
          toolCallName: CALCULATE_AI_DAMAGE_TOOL_NAME,
          toolName: CALCULATE_AI_DAMAGE_TOOL_NAME,
          timestamp,
          model: MOCK_MODEL,
        };
        yield {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: TOOL_CALL_ID,
          delta: rawArgumentsJson,
          args: rawArgumentsJson,
          timestamp,
          model: MOCK_MODEL,
        };
        yield {
          type: EventType.TOOL_CALL_END,
          toolCallId: TOOL_CALL_ID,
          toolCallName: CALCULATE_AI_DAMAGE_TOOL_NAME,
          toolName: CALCULATE_AI_DAMAGE_TOOL_NAME,
          input: rawArguments,
          timestamp,
          model: MOCK_MODEL,
        };
        yield {
          type: EventType.RUN_FINISHED,
          runId,
          threadId,
          finishReason: "tool_calls",
          timestamp,
          model: MOCK_MODEL,
        };
        return;
      }

      const messageId = crypto.randomUUID();
      const explanation = explainDeterministicResult(result);
      yield {
        type: EventType.TEXT_MESSAGE_START,
        messageId,
        role: "assistant",
        timestamp,
        model: MOCK_MODEL,
      };
      yield {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        delta: explanation,
        content: explanation,
        timestamp,
        model: MOCK_MODEL,
      };
      yield { type: EventType.TEXT_MESSAGE_END, messageId, timestamp, model: MOCK_MODEL };
      yield {
        type: EventType.RUN_FINISHED,
        runId,
        threadId,
        finishReason: "stop",
        timestamp,
        model: MOCK_MODEL,
      };
    },
    async structuredOutput() {
      throw new Error("Mock damage adapter does not support structured output");
    },
  };
}
