<script lang="ts">
  import JsonPanel from "$lib/components/JsonPanel.svelte";
  import type { AiToolTurn } from "$lib/ai-turn";

  let { turn }: { turn: AiToolTurn | null } = $props();
</script>

<section class="trace" data-testid="tool-trace">
  <header>
    <p class="eyebrow">Tool Call Trace</p>
    <h2>AI ↔ deterministic contract</h2>
    <p>
      {#if turn}
        <strong>{turn.mode === "stub" ? "CI-safe stub" : "OpenAI"}</strong>
        executed <code>{turn.trace.toolName}</code> before explanation.
      {:else}
        Run an AI tool turn to inspect the complete contract trace.
      {/if}
    </p>
  </header>

  {#if turn}
    <div class="states" aria-label="Tool-call state transitions">
      {#each turn.trace.stateTransitions as state, index}
        {#if index > 0}<span aria-hidden="true">→</span>{/if}
        <code>{state}</code>
      {/each}
    </div>
    <div class="grid">
      <JsonPanel eyebrow="Tool arguments" title="Raw Tool-Call Arguments" value={turn.trace.rawArguments} testId="trace-raw-args" />
      <JsonPanel eyebrow="Tool validation" title="Schema Validation Result" value={turn.trace.schemaValidation} testId="trace-validation" />
      <JsonPanel eyebrow="Tool normalization" title="Normalized / Defaulted Arguments" value={turn.trace.normalizedArguments} testId="trace-normalized" />
      <JsonPanel eyebrow="Tool result" title="Raw Deterministic Result Returned to Model" value={turn.trace.rawDeterministicResult} testId="trace-result" />
    </div>
    <div class="response">
      <p class="eyebrow">Model response after tool execution</p>
      <p data-testid="ai-explanation">{turn.modelResponse}</p>
    </div>
    <div class="response">
      <p class="eyebrow">Grounding mismatch notes</p>
      {#if turn.groundingNotes.length}
        <ul>{#each turn.groundingNotes as note}<li>{note}</li>{/each}</ul>
      {:else}
        <p data-testid="grounding-clear">No grounding mismatch detected.</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .trace {
    margin-top: 1rem;
    padding: 1.2rem;
    border: 2px solid #acc8b5;
    border-radius: 0.9rem;
    background: #f8fcf8;
  }
  h2, p { margin-top: 0; }
  header p:last-child { margin-bottom: 0; color: #53685d; line-height: 1.5; }
  .eyebrow { margin-bottom: 0.4rem; color: #53685d; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
  .states { display: flex; flex-wrap: wrap; gap: 0.45rem; align-items: center; margin-top: 1rem; padding: 0.8rem; border-radius: 0.55rem; background: #e9f3eb; color: #315e3d; font-size: 0.78rem; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 1rem; }
  .response { margin-top: 1rem; padding: 1rem; border-radius: 0.55rem; background: #eef4ef; color: #405149; line-height: 1.55; }
  .response p:last-child, ul { margin-bottom: 0; }
  code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
  @media (max-width: 48rem) { .grid { grid-template-columns: 1fr; } }
</style>
