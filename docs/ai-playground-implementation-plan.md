# AI Playground Implementation Plan (Phase 1)

Status: Milestones B/C/D complete; hardening and optional real-provider verification are next
Date: 2026-05-30

## Planning inputs

### Current codebase findings

- Deterministic adapter contract exists and is production-ready for phase-1 substrate in `packages/vgc_data_wrapper/src/aiDamage.ts`.
- Adapter supports required schema, normalization defaults, deterministic execution, and safe parsing.
- Milestone B added the `apps/ai-playground` SvelteKit scaffold and proved local `vgc_data_wrapper` imports compile through the workspace package contract.

### Documentation findings

- RFC defines canonical input/output schema, default materialization, and out-of-scope items (`docs/rfc/ai-damage-calculation-schema.md`).
- Boundary doc explicitly positions deterministic adapter vs normalization/tool orchestration (`docs/ai-tool-boundaries.md`).

### External documentation (latest checked)

- TanStack AI Svelte quick-start and SSE server pattern:
  - https://tanstack.com/ai/latest/docs/getting-started/quick-start-svelte
- TanStack AI tools guide:
  - https://tanstack.com/ai/latest/docs/tools/tools
- TanStack AI tool architecture:
  - https://tanstack.com/ai/latest/docs/tools/tool-architecture
- TanStack `@tanstack/ai-svelte` API:
  - https://tanstack.com/ai/latest/docs/api/ai-svelte
- SvelteKit project structure/routing (`+page.svelte`, `+server.ts`) docs:
  - https://svelte.dev/docs/kit

### Verified TanStack AI API correction (2026-05-30)

Earlier pseudocode in this plan used Vercel AI SDK-style APIs. The current TanStack AI documentation uses a different integration shape:

| Concern | Stale sketch | Current TanStack AI API |
| --- | --- | --- |
| server chat stream | `streamText(...)` | `chat(...)` |
| SSE response | `.toDataStreamResponse()` | `toServerSentEventsResponse(stream)` |
| tool declaration | `tool(...)` | `toolDefinition(...)` followed by `.server(...)` or `.client(...)` |
| OpenAI adapter | `createOpenAI(...)` from `@ai-sdk/openai` | `openaiText(...)` from `@tanstack/ai-openai` |
| Svelte transport | `DefaultChatTransport` | `fetchServerSentEvents(...)` passed as the `connection` option to `createChat(...)` |
| client request context | message `metadata` / legacy body-shaped context | `forwardedProps` (`body` remains deprecated compatibility behavior) |

Treat the corrected pseudocode below as a design sketch and re-check the official docs immediately before Milestone D implementation because TanStack AI is still evolving.

## Target outcome of the next step

Milestones B, C, and D have established the runnable SvelteKit scaffold, deterministic panels, TanStack AI tool definition, SvelteKit streaming route, Svelte client integration, visible Tool Call Trace, and CI-safe stubbed turn. The next step is hardening: add browser-level mocked/stubbed coverage and optionally run a manual OpenAI-key verification without making the real provider a default CI dependency.

## Milestone breakdown

### Milestone A — Workspace setup and package migration safety

Deliverables:

- Introduce workspace layout (`apps/*`, `packages/*`).
- Move current package to `packages/vgc_data_wrapper`.
- Preserve package behavior (`name`, `exports`, `files`, build output).

Acceptance criteria:

- Existing package builds successfully after move.
- `npm pack --json` artifact list matches expected publish payload (`dist/*`, `data/*`) and no accidental omissions/additions.
- Existing package tests continue to pass.

### Milestone B — App scaffold and integration

Deliverables:

- `apps/ai-playground` SvelteKit app scaffold.
- Workspace linkage to import deterministic adapter exports.
- Basic route at `/` with deterministic playground shell.

Acceptance criteria:

- App boots and renders.
- Imports from package compile cleanly.

### Milestone C — Deterministic pipeline UI (Panels 1-4)

Deliverables:

- Raw structured JSON editor panel.
- Schema validation panel (valid + issue list).
- Normalized/defaulted input panel.
- Raw deterministic `DamageResult` panel.

Acceptance criteria:

- Editing JSON and executing refreshes all deterministic panels.
- Invalid JSON/schema does not crash UI; it renders actionable errors.

### Milestone D — TanStack AI tool-calling integration (required)

Deliverables:

- SvelteKit `+server.ts` streaming route using TanStack AI server flow.
- Deterministic damage tool definition with strict schema-backed args.
- UI tool-call trace showing tool name, args, states, and tool result payload.
- Client integration via `@tanstack/ai-svelte` (`createChat` + SSE adapter).

Acceptance criteria:

- At least one model turn executes the deterministic tool call end-to-end.
- Tool-call trace shows arguments and returned deterministic payload.
- No natural-language reconstruction logic is introduced.

## Suggested file plan

- `package.json` (workspace root updates)
- `apps/ai-playground/package.json`
- `apps/ai-playground/svelte.config.js`
- `apps/ai-playground/src/routes/+page.svelte`
- `apps/ai-playground/src/lib/playground-state.ts`
- `apps/ai-playground/src/lib/components/JsonPanel.svelte`
- `apps/ai-playground/src/routes/api/chat/+server.ts`
- `apps/ai-playground/src/lib/tools/calculate-ai-damage.ts`
- `apps/ai-playground/src/lib/components/ToolCallTrace.svelte`
- `packages/vgc_data_wrapper/*` (migrated package contents)

## Risks and mitigations

1. **Workspace migration drift (publish behavior)***
   - Mitigation: enforce package parity checks (`build` + `npm pack --json`) during migration PR.
2. **Schema error UX confusion**
   - Mitigation: normalize all errors to `path + message` rows.
3. **AI overclaims**
   - Mitigation: keep deterministic JSON in-context and add explicit grounding checks before UI release.

## Explicit exclusions for this step

- no NL input parsing
- no alias/fuzzy normalization layer
- no common/meta-set retrieval
- no multi-tool orchestration
- no MCP integration

## Exit criteria for next PR (application-focused)

### Core package regression gate

- Passes:
  - `bunx tsc`
  - `bun knip`
  - `bun lint`
  - `bun test-pokemon`
  - `bun test-damage`

### Application-specific gate

- SvelteKit app can run locally (`bun run dev` in app workspace).
- Deterministic panels 1-4 are interactive and render expected state transitions.
- At least one model turn executes and emits a visible tool-call trace entry.
- At least one app-level automated test exists (recommended: Playwright e2e smoke test for tool-call flow).
- CI-friendly non-interactive app checks are defined (e.g., app typecheck + test command).

### E2E feasibility note

- Yes, e2e is feasible in this environment.
- Preferred initial approach: Playwright smoke test that:
  1. loads `/`,
  2. pastes valid structured JSON,
  3. verifies validation panel indicates valid,
  4. verifies tool-call trace row appears with tool name + args,
  5. verifies normalized/defaulted panel renders,
  6. verifies raw `DamageResult` panel renders.


## Next phase detailed implementation plan (Milestone B/C/D)

### 1) App scaffold (SvelteKit)

Pseudo code:

```txt
create apps/ai-playground/
  package.json (sveltekit, vite)
  svelte.config.js
  vite.config.ts
  src/routes/+page.svelte

# Deferred until Milestone D:
  src/routes/api/chat/+server.ts
  @tanstack/ai, @tanstack/ai-svelte, @tanstack/ai-openai
```

```ts
// +page.svelte (shape)
const rawInputText = $state(JSON.stringify(sampleInput, null, 2));
const snapshot = $state<PlaygroundSnapshot | null>(null);
const parseError = $state<string | null>(null);

function runDeterministicPanels() {
  try {
    const raw = JSON.parse(rawInputText);
    snapshot = buildAiPlaygroundSnapshot(raw);
    parseError = null;
  } catch (err) {
    parseError = String(err);
    snapshot = null;
  }
}
```

### 2) Deterministic panel rendering (Panels 1-4)

Pseudo code:

```ts
// playground-state.ts
export type DeterministicPanels = {
  rawStructuredInput: unknown;
  schemaValidation: { isValid: boolean; issues: { path: string; message: string }[] };
  normalizedInput: unknown | null;
  rawDamageResult: unknown | null;
};

export function buildDeterministicPanels(rawInput: unknown): DeterministicPanels {
  const snapshot = buildAiPlaygroundSnapshot(rawInput);
  return {
    rawStructuredInput: rawInput,
    schemaValidation: snapshot.validation,
    normalizedInput: snapshot.normalizedInput,
    rawDamageResult: snapshot.result,
  };
}
```

### 3) TanStack AI tool-call route (SvelteKit server)

Pseudo code:

```ts
// lib/tools/calculate-ai-damage.ts
import { toolDefinition, type JSONSchema } from '@tanstack/ai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  AiDamageCalcInputSchema,
  AiDamageCalcOutputSchema,
  buildAiPlaygroundSnapshot,
} from 'vgc_data_wrapper';

export const calculateAiDamageDef = toolDefinition({
  name: 'calculateAiDamage',
  description: 'Execute deterministic damage calculation from structured input',
  inputSchema: zodToJsonSchema(AiDamageCalcInputSchema) as JSONSchema,
  outputSchema: zodToJsonSchema(AiDamageCalcOutputSchema) as JSONSchema,
});

export const calculateAiDamageTool = calculateAiDamageDef.server(async (args) => {
  const snapshot = buildAiPlaygroundSnapshot(args);
  if (!snapshot.validation.isValid || !snapshot.result) throw new Error('Invalid tool arguments');
  return snapshot.result;
});
```

```ts
// routes/api/chat/+server.ts
import { chat, chatParamsFromRequest, toServerSentEventsResponse } from '@tanstack/ai';
import { openaiText } from '@tanstack/ai-openai';
import { calculateAiDamageTool } from '$lib/tools/calculate-ai-damage';

export async function POST({ request }) {
  const params = await chatParamsFromRequest(request);
  const stream = chat({
    adapter: openaiText('gpt-4o-mini'),
    messages: params.messages,
    tools: [calculateAiDamageTool],
  });
  return toServerSentEventsResponse(stream);
}
```

The Milestone D implementation must also preserve the raw tool arguments, validation result, normalized/defaulted arguments, tool state transitions, raw deterministic result, model response, and grounding mismatch notes for the visible trace. The deterministic adapter remains the source of truth; trace recording is additive around that call.

### 4) TanStack AI client integration + tool-call trace

Pseudo code:

```ts
// +page.svelte
import { createChat, fetchServerSentEvents } from '@tanstack/ai-svelte';

const chat = createChat({
  connection: fetchServerSentEvents('/api/chat'),
});

async function runToolCallAndExplain() {
  chat.updateForwardedProps({
    rawStructuredInput: JSON.parse(rawInputText),
  });
  await chat.sendMessage(
    'Call the deterministic damage tool for this structured state, then explain strictly from tool output.',
  );
}

const toolCalls = $derived(extractToolCalls(chat.messages));
```

```ts
// ToolCallTrace.svelte concept
for each toolCall in toolCalls:
  render toolCall.name
  render toolCall.args (raw JSON)
  render toolCall.state (awaiting-input/input-streaming/input-complete/approval-requested/approval-responded)
  render toolCall.resultState (streaming/complete/error)
  render toolCall.result (raw JSON)
```

### 5) E2E smoke test (no OpenAI key required)

Pseudo code:

```ts
// playwright test
test('deterministic panel + tool trace smoke', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="raw-input"]', validJsonFixture);
  await page.click('[data-testid="run-deterministic"]');
  await expect(page.getByTestId('schema-valid')).toContainText('Valid');
  await expect(page.getByTestId('normalized-panel')).toBeVisible();
  await expect(page.getByTestId('result-panel')).toBeVisible();

  // stub /api/chat response with one tool-call trace entry
  await page.click('[data-testid="ask-ai"]');
  await expect(page.getByTestId('tool-trace')).toContainText('calculateAiDamage');
});
```

### 6) Exit criteria additions for this phase

- App has explicit `typecheck`, `test`, and `e2e` scripts.
- Tool-call trace includes raw args and raw result payload.
- Smoke e2e runs without real provider key (mock/stub mode).
- Optional real-provider integration test is non-blocking/nightly only.

### 7) Optional manual OpenAI verification

1. Copy `apps/ai-playground/.env.example` to `apps/ai-playground/.env`.
2. Set `OPENAI_API_KEY` in that local ignored file.
3. Start the SvelteKit app and run the CI-safe stubbed tool turn first.
4. Click **Run optional OpenAI turn** and inspect the visible trace.
5. Record model schema, retry, and grounding issues separately from deterministic adapter behavior.
