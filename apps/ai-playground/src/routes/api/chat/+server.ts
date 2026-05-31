import { calculateAiDamageTool } from "$lib/tools/calculate-ai-damage";
import {
  chat,
  chatParamsFromRequest,
  toServerSentEventsResponse,
} from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { json, type RequestHandler } from "@sveltejs/kit";

const SYSTEM_PROMPT = `You are explaining deterministic Pokemon damage output.
You MUST call calculateAiDamage exactly once using the provided resolved structured battle state before making any damage or KO claim.
After tool execution, explain only the raw tool result. Never invent modifiers or guarantees.`;

/** Streams an optional real-provider turn while keeping the OpenAI key server-side. */
export const POST: RequestHandler = async ({ request }) => {
  if (!process.env.OPENAI_API_KEY) {
    return json(
      { error: "OPENAI_API_KEY is required for the optional real-provider turn" },
      { status: 503 },
    );
  }

  try {
    const params = await chatParamsFromRequest(request);
    const rawStructuredInput = params.forwardedProps.rawStructuredInput;
    const stream = chat({
      adapter: openaiText("gpt-4o-mini"),
      messages: [
        ...params.messages,
        {
          role: "user",
          content: `Resolved structured battle state for calculateAiDamage:\n${JSON.stringify(rawStructuredInput)}`,
        },
      ],
      systemPrompts: [SYSTEM_PROMPT],
      tools: [calculateAiDamageTool],
      threadId: params.threadId,
      runId: params.runId,
      parentRunId: params.parentRunId,
    });
    return toServerSentEventsResponse(stream);
  } catch (error) {
    if (error instanceof Response) return error;
    return json(
      { error: error instanceof Error ? error.message : "OpenAI turn failed" },
      { status: 500 },
    );
  }
};
