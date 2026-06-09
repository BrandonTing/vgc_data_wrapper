<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { createChat, fetchServerSentEvents } from "@tanstack/ai-svelte";
  import { buildGroundingNotes } from "vgc_data_wrapper";
  import JsonPanel from "$lib/components/JsonPanel.svelte";
  import ToolCallTrace from "$lib/components/ToolCallTrace.svelte";
  import type { AiToolTurn } from "$lib/ai-turn";
  import type {
    CalculateAiDamageTrace,
    ToolStateTransition,
  } from "$lib/tools/calculate-ai-damage";
  import { CALCULATE_AI_DAMAGE_TRACE_EVENT } from "$lib/tools/calculate-ai-damage";
  import {
    evaluateDeterministicInput,
    SAMPLE_AI_DAMAGE_INPUT_TEXT,
  } from "$lib/playground-state";

  let rawInputText = $state(SAMPLE_AI_DAMAGE_INPUT_TEXT);
  // Keep the last explicit run separate from in-progress editor text.
  let evaluation = $state(evaluateDeterministicInput(SAMPLE_AI_DAMAGE_INPUT_TEXT));
  type AiTurnState =
    | { status: "idle" }
    | { status: "complete"; turn: AiToolTurn }
    | { status: "error"; message: string };
  let aiTurnState = $state<AiTurnState>({ status: "idle" });
  // SSR buttons stay disabled until their client-side chat handlers are attached.
  let isHydrated = $state(false);

  const snapshot = $derived(evaluation.snapshot);
  const validation = $derived(
    evaluation.parseError
      ? {
          isValid: false,
          issues: [{ path: "root", message: evaluation.parseError }],
        }
      : snapshot?.validation,
  );
  function createTraceChat(connectionUrl: string, mode: AiToolTurn["mode"]) {
    let trace: CalculateAiDamageTrace | null = null;
    let states: ToolStateTransition[] = [];

    function recordState(state: ToolStateTransition) {
      if (states.at(-1) !== state) states.push(state);
    }

    const client = createChat({
      connection: fetchServerSentEvents(connectionUrl),
      onChunk(chunk) {
        if (chunk.type === "TOOL_CALL_START") recordState("awaiting-input");
        if (chunk.type === "TOOL_CALL_ARGS") recordState("input-streaming");
        if (chunk.type === "TOOL_CALL_END") {
          recordState("input-complete");
          recordState("executing");
        }
        if (chunk.type === "TOOL_CALL_RESULT") recordState("complete");
        if (chunk.type === "RUN_ERROR") recordState("error");
      },
      onCustomEvent(eventType, data) {
        if (eventType === CALCULATE_AI_DAMAGE_TRACE_EVENT) {
          trace = data as CalculateAiDamageTrace;
        }
      },
      onError(error) {
        aiTurnState = {
          status: "error",
          message: error.message,
        };
      },
      onFinish(message) {
        if (!trace?.rawDeterministicResult) {
          aiTurnState = {
            status: "error",
            message: trace
              ? "The calculateAiDamage tool finished without a deterministic result. The model response is not grounded."
              : "The model finished without calling calculateAiDamage. The model response is not grounded.",
          };
          return;
        }
        const modelResponse = message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.content)
          .join("\n");
        aiTurnState = {
          status: "complete",
          turn: {
            mode,
            trace: {
              ...trace,
              stateTransitions: states.length > 0 ? states : trace.stateTransitions,
            },
            modelResponse,
            groundingNotes: buildGroundingNotes(trace.rawDeterministicResult, modelResponse),
          },
        };
      },
    });

    return {
      client,
      reset() {
        trace = null;
        states = [];
        client.clear();
      },
    };
  }

  const mockChat = createTraceChat("/api/chat/mock", "mock");
  const openAiChat = createTraceChat("/api/chat", "openai");

  onMount(() => {
    isHydrated = true;
  });

  onDestroy(() => {
    mockChat.client.dispose();
    openAiChat.client.dispose();
  });

  function runDeterministicPanels() {
    evaluation = evaluateDeterministicInput(rawInputText);
  }

  function resetSample() {
    rawInputText = SAMPLE_AI_DAMAGE_INPUT_TEXT;
    aiTurnState = { status: "idle" };
    runDeterministicPanels();
  }

  function getValidRawInput(): unknown | null {
    runDeterministicPanels();
    if (!evaluation.snapshot?.validation.isValid) {
      aiTurnState = {
        status: "error",
        message: "Resolve structured input validation errors before running an AI tool turn.",
      };
      return null;
    }
    return evaluation.snapshot.rawInput;
  }

  async function runStreamedAiTurn(
    activeChat: ReturnType<typeof createTraceChat>,
  ) {
    const rawStructuredInput = getValidRawInput();
    if (!rawStructuredInput) return;
    aiTurnState = { status: "idle" };
    activeChat.reset();
    activeChat.client.updateForwardedProps({ rawStructuredInput });
    try {
      await activeChat.client.sendMessage(
        "Call calculateAiDamage for the provided structured state, then explain only its deterministic result.",
      );
    } catch (error) {
      aiTurnState = {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async function runMockAiTurn() {
    await runStreamedAiTurn(mockChat);
  }

  async function runOpenAiTurn() {
    await runStreamedAiTurn(openAiChat);
  }
</script>

<svelte:head>
  <title>AI Damage Tool Playground</title>
  <meta
    name="description"
    content="Inspect structured deterministic AI damage adapter inputs and outputs."
  />
</svelte:head>

<main data-hydrated={isHydrated}>
  <header class="hero">
    <div>
      <p class="eyebrow">Milestone D · AI tool-call observability</p>
      <h1>AI Damage Tool Playground</h1>
      <p class="lede">
        Inspect how authored structured battle state becomes validated,
        defaulted, and executed by the deterministic damage adapter. Model
        tool-call trace now remains visibly grounded in that kernel.
      </p>
    </div>
  </header>

  <section class="pipeline" aria-label="Deterministic adapter pipeline">
    <span>Raw authored input</span>
    <b aria-hidden="true">→</b>
    <span>Schema validation</span>
    <b aria-hidden="true">→</b>
    <span>Normalized state</span>
    <b aria-hidden="true">→</b>
    <span>DamageResult</span>
  </section>

  <section class="editor panel" aria-labelledby="raw-input-heading">
    <header class="panel-heading">
      <div>
        <p class="eyebrow">Panel 1</p>
        <h2 id="raw-input-heading">Raw Structured Input</h2>
      </div>
      <div class="actions">
        <button class="secondary" type="button" onclick={resetSample}>
          Reset sample
        </button>
        <button
          type="button"
          onclick={runDeterministicPanels}
        >
          Run deterministic adapter
        </button>
      </div>
    </header>
    <p class="panel-copy">
      Edit canonical <code>AiDamageCalcInput</code> JSON. The adapter rejects
      unsupported aliases and materializes omitted mechanical defaults.
    </p>
    <textarea
      bind:value={rawInputText}
      spellcheck="false"
      aria-label="Raw structured AI damage input"
    ></textarea>
  </section>

  <section class="panel validation" aria-labelledby="schema-validation-heading">
    <header class="panel-heading">
      <div>
        <p class="eyebrow">Panel 2</p>
        <h2 id="schema-validation-heading">Schema Validation Result</h2>
      </div>
      {#if validation?.isValid}
        <strong class="status success" role="status">Valid</strong>
      {:else}
        <strong class="status error" role="status">Invalid</strong>
      {/if}
    </header>

    {#if validation?.isValid}
      <p class="success-copy">The authored JSON matches <code>AiDamageCalcInputSchema</code>.</p>
    {:else if validation}
      <ul class="issues">
        {#each validation.issues as issue}
          <li>
            <code>{issue.path}</code>
            <span>{issue.message}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="observability-grid" aria-label="Deterministic observability panels">
    <JsonPanel
      eyebrow="Panel 3"
      title="Normalized / Defaulted Input"
      value={snapshot?.normalizedInput}
      panelId="normalized-panel"
    />
    <JsonPanel
      eyebrow="Panel 4"
      title="Raw DamageResult"
      value={snapshot?.result}
      panelId="result-panel"
    />
  </section>

  {#if snapshot?.groundingNotes.length}
    <section class="panel defaults" aria-labelledby="defaults-heading">
      <header>
        <p class="eyebrow">Adapter materialization notes</p>
        <h2 id="defaults-heading">Defaults applied before execution</h2>
      </header>
      <ul>
        {#each snapshot.groundingNotes as note}
          <li>{note}</li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="panel ai-controls" aria-labelledby="ai-tool-turn-heading">
    <header class="panel-heading">
      <div>
        <p class="eyebrow">AI tool turn</p>
        <h2 id="ai-tool-turn-heading">Invoke calculateAiDamage before explanation</h2>
      </div>
      <div class="actions">
        <button type="button" disabled={!isHydrated || mockChat.client.isLoading} onclick={runMockAiTurn}>
          {mockChat.client.isLoading ? "Running TanStack mock…" : "Run CI-safe TanStack mock"}
        </button>
        <button class="secondary" type="button" disabled={!isHydrated || openAiChat.client.isLoading} onclick={runOpenAiTurn}>
          {openAiChat.client.isLoading ? "Waiting for OpenAI…" : "Run optional OpenAI turn"}
        </button>
      </div>
    </header>
    <p class="panel-copy">
      The default mock runs through TanStack AI chat orchestration and executes the deterministic tool without a provider key. The optional OpenAI turn uses the server-only <code>OPENAI_API_KEY</code> when configured.
    </p>
    {#if aiTurnState.status === "error"}<p class="ai-error" role="alert">{aiTurnState.message}</p>{/if}
  </section>

  <ToolCallTrace turn={aiTurnState.status === "complete" ? aiTurnState.turn : null} />
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    background: #f3f5f1;
    color: #18251e;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  main {
    width: min(100% - 2rem, 76rem);
    margin: 0 auto;
    padding: 4rem 0 6rem;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    max-width: 12ch;
    margin-bottom: 1rem;
    font-size: clamp(3rem, 8vw, 5.5rem);
    letter-spacing: -0.08em;
    line-height: 0.95;
  }

  h2 {
    margin-bottom: 0;
    font-size: 1.2rem;
  }

  code,
  textarea {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  }

  .hero {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2rem;
    align-items: end;
  }

  .eyebrow {
    margin-bottom: 0.5rem;
    color: #53685d;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .lede {
    max-width: 48rem;
    margin-bottom: 0;
    color: #405149;
    font-size: 1.1rem;
    line-height: 1.65;
  }

  .panel,
  .pipeline {
    border: 1px solid #d0dbd3;
    border-radius: 0.9rem;
    background: #fbfcfa;
    box-shadow: 0 1rem 2.5rem rgb(49 78 62 / 7%);
  }

  .status {
    display: inline-block;
    padding: 0.42rem 0.65rem;
    border-radius: 999px;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .success {
    background: #dcefe2;
    color: #26633b;
  }

  .error {
    background: #f6dddd;
    color: #8f2929;
  }

  .pipeline {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
    margin: 2.5rem 0 1rem;
    padding: 0.85rem 1rem;
    color: #53685d;
    font-size: 0.78rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pipeline b {
    color: #a1afa7;
  }

  .panel {
    padding: 1.2rem;
  }

  .panel-heading {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
  }

  .panel-copy,
  .success-copy {
    color: #53685d;
    font-size: 0.9rem;
    line-height: 1.55;
  }

  .panel-copy {
    margin: 0.9rem 0;
  }

  textarea {
    width: 100%;
    min-height: 25rem;
    resize: vertical;
    padding: 1rem;
    border: 1px solid #c4d0c9;
    border-radius: 0.55rem;
    outline: none;
    background: #18251e;
    color: #e5f2e9;
    font-size: 0.8rem;
    line-height: 1.55;
  }

  textarea:focus {
    border-color: #648e74;
    box-shadow: 0 0 0 3px rgb(100 142 116 / 20%);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    justify-content: flex-end;
  }

  button {
    padding: 0.68rem 0.85rem;
    border: 1px solid #28633d;
    border-radius: 0.55rem;
    background: #28633d;
    color: #fff;
    cursor: pointer;
    font-weight: 750;
  }

  button:hover {
    background: #1e4e2f;
  }

  button.secondary {
    border-color: #c4d0c9;
    background: #fff;
    color: #405149;
  }

  .validation,
  .observability-grid,
  .defaults,
  .ai-controls {
    margin-top: 1rem;
  }

  .success-copy {
    margin: 0.9rem 0 0;
  }

  .ai-error {
    margin: 0.8rem 0 0;
    color: #8f2929;
    font-size: 0.9rem;
  }

  .issues {
    display: grid;
    gap: 0.55rem;
    margin: 0.9rem 0 0;
    padding: 0;
    list-style: none;
  }

  .issues li {
    display: grid;
    gap: 0.3rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: #faecec;
    color: #7b3333;
    font-size: 0.9rem;
  }

  .observability-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .defaults ul {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 0;
    padding-left: 1.2rem;
    color: #53685d;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  @media (max-width: 48rem) {
    main {
      padding-top: 2rem;
    }

    .hero,
    .observability-grid {
      grid-template-columns: 1fr;
    }

    .panel-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .actions {
      justify-content: flex-start;
    }
  }
</style>
