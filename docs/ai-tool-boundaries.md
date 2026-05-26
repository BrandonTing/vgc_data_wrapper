# AI Tool Boundaries: Deterministic Damage Adapter

This document defines what the deterministic AI damage contract **does** and **does not** do.

Source of truth: [`docs/rfc/ai-damage-calculation-schema.md`](./rfc/ai-damage-calculation-schema.md).

## In scope (v1)

The deterministic adapter is responsible for:

- Accepting machine-structured battle state with top-level `attacker` / `defender` / `move` / optional `field`.
- Enforcing strict, JSON-safe, schema-based validation.
- Rejecting unknown keys and non-canonical stat naming.
- Supporting `statMode: "derived" | "manual"`.
- Applying documented mechanical defaults for stable adapter construction.
- Executing deterministic damage calculation through the existing engine.
- Returning output compatible with `DamageResult` (`rolls`, `koChance`, `factors`).

## Out of scope (v1)

The deterministic adapter intentionally does **not** handle:

- Alias/fuzzy name normalization.
- Common/meta set inference.
- Trigger/event interpretation or turn-state progression.
- Natural-language parsing.
- Playground UX concerns.
- Tool orchestration policy (e.g., which scenarios should call damage tools).

These concerns belong to separate layers/features referenced by the RFC.

## Ownership split: deterministic adapter vs normalization layer

### Deterministic adapter

- Requires already-resolved mechanics-compatible inputs.
- Validates contract shape and mechanical plausibility.
- Produces deterministic calculation outputs.

### Normalization layer (separate)

- Handles aliasing and fuzzy mapping.
- Resolves human-friendly or partial text into canonical IDs/fields.
- May enrich inputs before deterministic execution.

A good mental model: normalization prepares data; deterministic adapter computes with strict contracts.

## Stat-mode authority rules

### `derived`

- Derived fields drive calculation.
- `stats` should not be provided as override.

### `manual`

- `stats` are authoritative.
- Derived metadata can coexist for context but must not re-derive/override `stats`.

## Validation boundaries

The contract should reject obviously impossible states when practical (best-effort), such as:

- invalid level values
- invalid ruleset values
- negative/mechanically invalid stat values
- EV totals/ranges that violate selected `statRuleset`

Full cartridge legality validation remains out of scope in v1.

## Integration guidance

When wiring tool/eval/playground integrations:

- Treat this adapter as the deterministic compute kernel.
- Keep input normalization/parsing outside this contract.
- Preserve raw structured output for downstream scoring/evaluation.
- Prefer additive wrappers for future expansions rather than mutating v1 contract semantics.
