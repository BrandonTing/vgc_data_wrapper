# AI Playground Implementation Process (Phase 1)

Status: Draft (updated 2026-05-26)

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

### Step 1: Foundation wiring

- Create SvelteKit app workspace (`apps/ai-playground`).
- Wire local package import of `vgc_data_wrapper` deterministic adapter exports.
- Add server endpoint that streams model events in SvelteKit.

### Step 2: Deterministic contract panels (no model yet)

- Implement panel 1-4 from structured JSON input.
- Show schema errors with paths/messages.
- Show normalized/defaulted JSON as produced by adapter.

### Step 3: TanStack AI tool-calling integration

- Define the deterministic damage tool with strict input schema and description.
- Integrate tool execution through TanStack AI server flow.
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
2. `bunx tsc`
3. `bun knip`
4. `bun lint`
5. `bun test-pokemon`
6. `bun test-damage`
7. Confirm workspace/package shape before app work:
   - root workspace manifest exists (`package.json` with `workspaces`)
   - package is under `packages/vgc_data_wrapper`
8. Start Milestone B execution from the checklist in this doc (scaffold `apps/ai-playground`).

### Bootstrap deliverables for first coding block

In the first focused coding block, target only:

- `apps/ai-playground` scaffold with SvelteKit + TypeScript
- local import wiring to `vgc_data_wrapper`
- minimal `/` route render smoke

Do **not** begin TanStack AI route/tool work until scaffold + deterministic import compile is verified.

### Bootstrap acceptance gate

Before moving to Milestone C/D, confirm all are true:

- app workspace exists and boots
- deterministic package imports compile in app
- required repo checks above are still passing


## Next phase execution checklist (Milestone B + C + D)

1. Scaffold `apps/ai-playground` with SvelteKit and TypeScript.
2. Add deterministic state store and panel components.
3. Add TanStack AI server route with deterministic tool definition.
4. Add client `createChat` integration and tool-call trace rendering.
5. Add app smoke e2e for tool-call trace + deterministic panels.
