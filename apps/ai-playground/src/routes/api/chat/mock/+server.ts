import { createMockDamageTextAdapter } from "$lib/adapters/mock-damage-text";
import { calculateAiDamageTool } from "$lib/tools/calculate-ai-damage";
import {
  chat,
  chatParamsFromRequest,
  toServerSentEventsResponse,
} from "@tanstack/ai";
import { json, type RequestHandler } from "@sveltejs/kit";

/** Streams a provider-free mock-model turn through the real TanStack AI agent loop. */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const params = await chatParamsFromRequest(request);
    const rawStructuredInput = params.forwardedProps.rawStructuredInput;
    const stream = chat({
      adapter: createMockDamageTextAdapter(rawStructuredInput),
      messages: params.messages,
      tools: [calculateAiDamageTool],
      threadId: params.threadId,
      runId: params.runId,
      parentRunId: params.parentRunId,
    });
    return toServerSentEventsResponse(stream);
  } catch (error) {
    if (error instanceof Response) return error;
    return json(
      { error: error instanceof Error ? error.message : "Mock AI turn failed" },
      { status: 400 },
    );
  }
};
