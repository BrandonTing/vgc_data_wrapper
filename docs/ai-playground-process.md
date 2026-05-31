# AI Playground Implementation Process (Phase 1)

Status: Draft (updated 2026-05-30)

## Purpose

Define the execution process for building the first SvelteKit-based AI playground focused on:

1. AI ↔ tool contract observability,
2. deterministic schema/default transparency,
3. grounding checks against deterministic tool output.

This is intentionally **not** a general-purpose chat UX project.

## Source constraints

This process follows the current repository contracts and docs:

- `packages/vgc_data_wrapper/src/aiDamage.ts` (`AiDamageCalcInputSchema`, `normalizeAiDamageCalcInput`, `calculateAiDamage`, `safeCalculateAiDamage`)
- RFC contract and defaults (`docs/rfc/ai-damage-calculation-schema.md`)
- adapter boundary rules (`docs/ai-tool-boundaries.md`)

## Latest external references consulted

- TanStack AI Svelte quick start: https://tanstack.com/ai/latest/docs/getting-started/quick-start-svelte
- TanStack AI tools guide (tool execution flow + states): https://tanstack.com/ai/latest/docs/tools/tools
- TanStack AI tool architecture: https://tanstack.com/ai/latest/docs/tools/tool-architecture
- TanStack `@tanstack/ai-svelte` API: https://tanstack.com/ai/latest/docs/api/ai-svelte
- SvelteKit docs (`+page.svelte`, `+server.ts`): https://svelte.dev/docs/kit

### Verified TanStack AI API shape (2026-05-30)

The current TanStack AI documentation differs from earlier implementation-plan pseudocode that used Vercel AI SDK-style APIs. For Milestone D, use the current TanStack AI APIs:

- server streaming: `chat(...)` and `toServerSentEventsResponse(...)` from `@tanstack/ai`;
- OpenAI adapter: `openaiText(...)` from `@tanstack/ai-openai`;
- tool schema definition: `toolDefinition(...)` from `@tanstack/ai`, followed by a `.server(...)` implementation;
- Svelte client: `createChat({ connection: fetchServerSentEvents("/api/chat") })` from `@tanstack/ai-svelte`;
- structured client-controlled request context: `forwardedProps`, not the deprecated `body` option.

Do not copy older pseudocode using `streamText(...)`, `tool(...)`, `DefaultChatTransport`, or `.toDataStreamResponse()` into the application.

## Process principles

1. **Tool-call-first observability**: first-class UI for model tool calls and tool results.
2. **Deterministic kernel reuse**: adapter logic remains the source of truth; playground does not re-implement validation/normalization rules.
3. **Layer separation**: keep authored input, tool arguments, normalized input, deterministic output, and model response visibly distinct.
4. **Grounding over prose**: correctness is measured by deterministic alignment, not writing quality.
5. **Incremental delivery**: thin vertical slices with passing checks at each milestone.

## Required phase-1 panels

The playground must preserve this explicit panel order:

1. Raw Structured Input
2. Schema Validation Result
3. Normalized / Defaulted Input
4. Raw DamageResult
5. AI Explanation
6. Grounding / Validation Notes

Additionally, phase 1 must include a visible **Tool Call Trace** section showing:

- tool name,
- raw tool-call arguments,
- tool-call state transitions,
- tool result payload returned to model.

## Delivery workflow

### Step 1: Foundation wiring (Milestone B, complete)

- Create SvelteKit app workspace (`apps/ai-playground`).
- Wire local package import of `vgc_data_wrapper` deterministic adapter exports.
- Prove the app boots and the deterministic package imports compile before adding model integration.

### Step 2: Deterministic contract panels (Milestone C, complete)

- Implement panel 1-4 from structured JSON input.
- Show schema errors with paths/messages.
- Show normalized/defaulted JSON as produced by adapter.

### Step 3: TanStack AI tool-calling integration (Milestone D, complete)

- Define the deterministic damage tool with `toolDefinition(...)`, the strict input schema, the output schema, and a description.
- Attach the deterministic implementation with `.server(...)` and integrate it through `chat(...)` plus `toServerSentEventsResponse(...)`.
- Connect the Svelte client with `createChat(...)` plus `fetchServerSentEvents(...)`.
- Render tool-call events and arguments in UI trace.
- Confirm model response is produced **after** tool result inclusion.

### Step 4: Grounding and mismatch notes

- Compare model claims against deterministic tool output.
- Flag overclaims (e.g., guaranteed OHKO mismatch).
- Keep raw model output visible; avoid silent rewriting.

### Step 5: Hardening + smoke e2e

- Add fixtures for valid/invalid structured inputs.
- Add one app-level smoke e2e covering tool-call trace and deterministic panels.
- Lock app checks in CI-friendly scripts.

## Definition of done for first runnable playground

A phase-1 build is complete when:

- app runs locally via SvelteKit;
- structured JSON can be edited and evaluated;
- schema validation is explicit and path-aware;
- normalized/defaulted input is visible;
- raw deterministic `DamageResult` is visible;
- at least one model turn performs a visible deterministic tool call;
- tool-call arguments + result are inspectable in trace UI;
- grounding notes can flag model/tool mismatches.

## Non-goals (explicitly deferred)

- natural-language parsing and fuzzy normalization
- common/meta set inference
- multi-tool orchestration
- provider abstraction matrix
- MCP/server infrastructure
- production auth/deploy concerns



## Session bootstrap (next-session quick start)

Use this exact startup sequence at the beginning of the next implementation session:

1. `bun install`
2. `bunx tsc --build`
3. `bun knip`
4. `bun lint`
5. `bun test-pokemon`
6. `bun test-damage`
7. Confirm workspace/package shape before app work:
   - root workspace manifest exists (`package.json` with `workspaces`)
   - package is under `packages/vgc_data_wrapper`
8. Confirm the completed Milestone D tool-calling slice still passes `bun test:ai-playground` and `bun check:ai-playground`.
9. Run the CI-safe stubbed AI tool turn before any optional real-provider verification.
10. Optionally set `OPENAI_API_KEY` and run one manual OpenAI turn to evaluate real model tool-calling reliability.

### Next validation block: hardening + optional real-provider verification

The next focused block should:

- add browser-level mocked/stubbed coverage for the deterministic panels and visible Tool Call Trace;
- keep the default test path provider-key-free;
- optionally run a manual OpenAI-key verification after the CI-safe path passes;
- record any real-model schema ergonomics, grounding, or retry issues without weakening the deterministic adapter contract.

### Optional manual OpenAI verification

1. Copy `apps/ai-playground/.env.example` to `apps/ai-playground/.env`.
2. Set `OPENAI_API_KEY` in that local ignored file.
3. Start the app with `bun run --filter @vgc/ai-playground dev`.
4. Run the CI-safe stub first, then click **Run optional OpenAI turn**.
5. Inspect the visible trace: raw args, schema validation, normalized/defaulted args, state transitions, raw deterministic result, model response, and grounding notes.

The key stays server-side and real-provider verification remains optional and non-blocking.

### Milestone D acceptance gate

Before hardening, confirm all are true:

- the stubbed AI turn invokes the deterministic tool before explanation;
- the visible trace includes raw args, validation, normalization, state transitions, raw result, explanation, and grounding notes;
- the real-provider route uses TanStack AI `chat(...)` and `toServerSentEventsResponse(...)`;
- missing `OPENAI_API_KEY` fails explicitly without affecting the default stubbed flow.


## Next phase execution checklist (Milestone B + C + D)

1. ✅ Scaffold `apps/ai-playground` with SvelteKit and TypeScript (Milestone B complete).
2. ✅ Add deterministic state store and panel components (Milestone C complete).
3. ✅ Add TanStack AI server route with deterministic tool definition (Milestone D complete).
4. ✅ Add client `createChat(...)` plus `fetchServerSentEvents(...)` integration and tool-call trace rendering (Milestone D complete).
5. **Next:** add app smoke e2e for tool-call trace + deterministic panels and optionally run a manual OpenAI-key verification.
