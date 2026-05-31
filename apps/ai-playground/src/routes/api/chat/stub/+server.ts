import { buildStubbedAiToolTurn } from "$lib/ai-turn";
import { json, type RequestHandler } from "@sveltejs/kit";

/** Executes the provider-free tool turn used by CI and local trace debugging. */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: unknown = await request.json();
    const rawStructuredInput =
      typeof body === "object" && body !== null && "rawStructuredInput" in body
        ? body.rawStructuredInput
        : undefined;
    return json(buildStubbedAiToolTurn(rawStructuredInput));
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Stubbed AI turn failed" },
      { status: 400 },
    );
  }
};
