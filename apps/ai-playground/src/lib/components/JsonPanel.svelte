<script lang="ts">
  let {
    title,
    eyebrow,
    value,
    panelId,
    emptyMessage = "Unavailable until the structured input is valid.",
  }: {
    title: string;
    eyebrow: string;
    value: unknown;
    panelId: string;
    emptyMessage?: string;
  } = $props();

  const formattedValue = $derived(
    value === null || value === undefined ? null : JSON.stringify(value, null, 2),
  );
</script>

<section class="panel" aria-labelledby={`${panelId}-heading`}>
  <header>
    <p class="eyebrow">{eyebrow}</p>
    <h2 id={`${panelId}-heading`}>{title}</h2>
  </header>

  {#if formattedValue}
    <pre>{formattedValue}</pre>
  {:else}
    <p class="empty">{emptyMessage}</p>
  {/if}
</section>

<style>
  .panel {
    min-width: 0;
    padding: 1.2rem;
    border: 1px solid #d0dbd3;
    border-radius: 0.85rem;
    background: #fbfcfa;
  }

  header {
    margin-bottom: 0.9rem;
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1.05rem;
  }

  .eyebrow {
    margin-bottom: 0.35rem;
    color: #65756c;
    font-size: 0.67rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  pre {
    max-height: 28rem;
    margin: 0;
    overflow: auto;
    padding: 1rem;
    border-radius: 0.55rem;
    background: #18251e;
    color: #e5f2e9;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 0.76rem;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .empty {
    color: #718078;
    font-size: 0.9rem;
    line-height: 1.55;
  }
</style>
