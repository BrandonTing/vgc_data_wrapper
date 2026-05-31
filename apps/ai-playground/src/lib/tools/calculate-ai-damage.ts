import { toolDefinition, type JSONSchema } from "@tanstack/ai";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  AiDamageCalcInputSchema,
  AiDamageCalcOutputSchema,
  buildAiPlaygroundSnapshot,
  type PlaygroundSnapshot,
} from "vgc_data_wrapper";

export const CALCULATE_AI_DAMAGE_TOOL_NAME = "calculateAiDamage";
export const CALCULATE_AI_DAMAGE_TRACE_EVENT = "calculateAiDamageTrace";

export type ToolStateTransition =
  | "awaiting-input"
  | "input-streaming"
  | "input-complete"
  | "executing"
  | "complete"
  | "error";

export type CalculateAiDamageTrace = {
  toolName: typeof CALCULATE_AI_DAMAGE_TOOL_NAME;
  rawArguments: unknown;
  schemaValidation: PlaygroundSnapshot["validation"];
  normalizedArguments: PlaygroundSnapshot["normalizedInput"];
  stateTransitions: ToolStateTransition[];
  rawDeterministicResult: PlaygroundSnapshot["result"];
};

const inputJsonSchema = zodToJsonSchema(
  AiDamageCalcInputSchema,
) as JSONSchema;
const outputJsonSchema = zodToJsonSchema(
  AiDamageCalcOutputSchema,
) as JSONSchema;

export function inspectCalculateAiDamageToolCall(
  rawArguments: unknown,
): CalculateAiDamageTrace {
  const snapshot = buildAiPlaygroundSnapshot(rawArguments);
  const didExecute = snapshot.validation.isValid && snapshot.result !== null;

  return {
    toolName: CALCULATE_AI_DAMAGE_TOOL_NAME,
    rawArguments,
    schemaValidation: snapshot.validation,
    normalizedArguments: snapshot.normalizedInput,
    stateTransitions: didExecute
      ? [
          "awaiting-input",
          "input-streaming",
          "input-complete",
          "executing",
          "complete",
        ]
      : ["awaiting-input", "input-streaming", "input-complete", "error"],
    rawDeterministicResult: snapshot.result,
  };
}

export function executeCalculateAiDamageToolCall(rawArguments: unknown): {
  trace: CalculateAiDamageTrace;
  result: NonNullable<CalculateAiDamageTrace["rawDeterministicResult"]>;
} {
  const trace = inspectCalculateAiDamageToolCall(rawArguments);
  if (!trace.schemaValidation.isValid || !trace.rawDeterministicResult) {
    const issues = trace.schemaValidation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid calculateAiDamage tool arguments: ${issues}`);
  }

  return { trace, result: trace.rawDeterministicResult };
}

export const calculateAiDamageDefinition = toolDefinition({
  name: CALCULATE_AI_DAMAGE_TOOL_NAME,
  description:
    "Execute deterministic Pokemon damage calculation from resolved structured battle state. Always call this before making damage or KO claims.",
  inputSchema: inputJsonSchema,
  outputSchema: outputJsonSchema,
});

export const calculateAiDamageTool = calculateAiDamageDefinition.server(
  async (rawArguments, context) => {
    const { trace, result } = executeCalculateAiDamageToolCall(rawArguments);
    context?.emitCustomEvent(CALCULATE_AI_DAMAGE_TRACE_EVENT, trace);
    return result;
  },
);
