# AI Playground Implementation Plan (Phase 1)

Status: Planned (next execution cycle)
Date: 2026-05-26

## Planning inputs

### Current codebase findings

- Deterministic adapter contract exists and is production-ready for phase-1 substrate in `packages/vgc_data_wrapper/src/aiDamage.ts`.
- Adapter supports required schema, normalization defaults, deterministic execution, and safe parsing.
- Repository currently has no SvelteKit app directory; only core package and tests are present.

### Documentation findings

- RFC defines canonical input/output schema, default materialization, and out-of-scope items (`docs/rfc/ai-damage-calculation-schema.md`).
- Boundary doc explicitly positions deterministic adapter vs normalization/tool orchestration (`docs/ai-tool-boundaries.md`).

### External documentation (latest checked)

- TanStack AI Svelte quick-start and SSE server pattern:
  - https://tanstack.com/ai/latest/docs/getting-started/quick-start-svelte
- TanStack AI docs overview:
  - https://tanstack.com/ai/latest/docs
- SvelteKit project structure/routing (`+page.svelte`, `+server.ts`) docs:
  - https://svelte.dev/docs/kit

## Target outcome of this next step

Create the first **runnable** SvelteKit playground vertical slice that proves AI tool-calling integration with deterministic damage tooling, including explicit tool-call trace visibility and workspace migration safety checks.

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
  package.json (sveltekit, vite, @tanstack/ai-svelte, playwright)
  svelte.config.js
  vite.config.ts
  src/routes/+page.svelte
  src/routes/api/chat/+server.ts
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
// routes/api/chat/+server.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { AiDamageCalcInputSchema, safeCalculateAiDamage } from 'vgc_data_wrapper';

const calculateAiDamageTool = tool({
  description: 'Execute deterministic damage calculation from structured input',
  inputSchema: AiDamageCalcInputSchema,
  execute: async (args) => {
    const result = safeCalculateAiDamage(args);
    return {
      tool: 'calculateAiDamage',
      validatedInput: args,
      result,
    };
  },
});

export async function POST({ request }) {
  const { messages, rawStructuredInput } = await request.json();
  return streamText({
    model: openai('gpt-4.1-mini'),
    system: `Use tool for deterministic claims. No unsupported guarantees.`,
    messages,
    tools: { calculateAiDamage: calculateAiDamageTool },
    // include rawStructuredInput as context for tool call
  }).toDataStreamResponse();
}
```

### 4) TanStack AI client integration + tool-call trace

Pseudo code:

```ts
// +page.svelte
const chat = createChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});

async function runToolCallAndExplain() {
  await chat.sendMessage({
    role: 'user',
    content: 'Call the deterministic damage tool for this structured state, then explain strictly from tool output.',
    metadata: { rawStructuredInput: JSON.parse(rawInputText) },
  });
}

$: toolCalls = extractToolCalls(chat.messages);
```

```ts
// ToolCallTrace.svelte concept
for each toolCall in toolCalls:
  render toolCall.name
  render toolCall.args (raw JSON)
  render toolCall.state (requested/running/success/error)
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
