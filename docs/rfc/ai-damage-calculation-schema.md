# RFC: AI Damage Calculation Input/Output Schema

- Status: Proposed
- Parent: #141
- Blocks: #148
- Related: #147, #149, #169, #170

## Purpose

Define the canonical AI-facing input/output schema for deterministic damage calculation while keeping this RFC documentation-only.

This RFC **does not** implement schemas, adapters, or runtime behavior in this PR.

## Scope

This RFC covers:

- AI-facing input schema contract
- AI-facing output schema contract
- Validation and defaulting responsibilities
- Schema ownership boundaries with normalization tooling

This RFC does **not** cover:

- Common/meta set inference (#149)
- Alias/fuzzy normalization implementation (#147)
- Trigger/event resolution (#170)
- `isChampion` cleanup implementation (#169)

## Canonical engine-aligned nouns

Use existing engine nouns consistently:

- `attacker`
- `defender`
- `move`
- `field`
- `rolls`
- `koChance`
- `BattleStatus`
- `DamageResult`

Alternative names are out of scope unless explicitly marked as rejected or deferred.

## Top-level input shape (v1)

```ts
{
  attacker: AiBattlerInput;
  defender: AiBattlerInput;
  move: AiMoveInput;
  field?: AiFieldInput;
}
```

Required: `attacker`, `defender`, `move`.
Optional: `field`.

### Explicit exclusions (v1)

- No `isChampion` in AI-facing schema.
- No `calcContext` in v1.
- JSON-safe structures only (no class instances, methods, functions).

## Identity fields

### Battler

- `pokemonId?: number` (canonical identifier)
- `pokemonName?: string` (optional normalized metadata)

### Move

- `moveId?: number` (canonical identifier)
- `moveName?: string` (optional normalized metadata)

Canonical IDs should align with the repository's existing internal data layer identifiers.

The deterministic AI schema must not introduce a second identifier system. Alias handling, fuzzy names, and alternate identifier mapping belong to the normalization layer (#147), not the deterministic damage calculation schema.

## Stats and stat modes

Canonical stat keys only:

- `hp`
- `attack`
- `defense`
- `specialAttack`
- `specialDefense`
- `speed`

No shorthand keys in canonical deterministic schema (`atk`, `def`, `spa`, `spd`, `spe` are rejected).

### Discriminated stat union

`statMode: "derived" | "manual"`

- `derived` mode requires derived inputs (`baseStat`, optional EV/IV/nature), rejects `stats`.
- `manual` mode requires `stats`; `stats` are authoritative.
- Derived-stat fields (`baseStat`, `effortValues`, `individualValues`, `nature`, `level`) may be present as informational metadata in `manual` mode, but they must not override or re-derive `stats`.
- If both `stats` and derived fields exist, the deterministic adapter must calculate from `stats` in `manual` mode.

Derived/manual modes must be mutually exclusive.

## Mechanical defaults and adapter materialization

Documented defaults are canonical and must be aligned between schema docs and adapter normalization:

- `level` → `50`
- missing EVs → `0`
- missing IVs → `31`
- missing stat stages → `0`
- `status` → `"Healthy"`
- `takenDamage` → `0`
- `specialForm` → `"None"`
- `statRuleset` → `"champions"`
- missing flags → omitted/false
- `field.isDouble` → current engine default (`true`)

Even when SDKs validate input, adapter-level default materialization remains required for stable internal construction.

## Stat ruleset and EV validation

`statRuleset: "champions" | "mainSeries"`

- `champions`: each EV `0..32`, total `<= 66`
- `mainSeries`: each EV `0..252`, total `<= 510`

Effort-value validation is ruleset-dependent and must reject impossible totals.


## Manual mode legality validation

`manual` mode changes stat authority semantics, but it does not disable legality validation.

The implementation should reject obviously impossible battle states when enough information is available.

Examples include:

- invalid level values
- negative stats
- impossible stat ranges
- invalid `statRuleset` values
- mechanically impossible stat combinations when sufficient metadata is provided

This validation should be best-effort in v1.

The goal is to preserve deterministic battle correctness without requiring full cartridge legality validation or full team-builder reconstruction logic.

Exhaustive legality validation is out of scope for v1.

## Special form and status

- Use `specialForm` (not `isTera`).
- `teraType` is configuration; active Tera damage state is represented by `specialForm: "Tera"`.
- `status` values mirror existing `Pokemon.status` values.

## Field and flags alignment

- `field` mirrors `BattleFieldStatus`.
- Battler `flags` mirror existing `PokemonFlags`.

No new side-shape abstractions (for example `attackerSide`/`defenderSide`) in v1 unless engine representation changes first.

## Output schema

The v1 AI-facing output schema should remain structurally identical to the existing `DamageResult` shape.

`AiDamageCalcOutput` should be compatible with `DamageResult` rather than introducing an adapter-specific projection.

If richer AI-specific output is needed in the future, it should be introduced additively in a separate version or wrapper.

Canonical output fields remain:

- `rolls`
- `koChance`
- `factors`

`rolls` is output-only, deterministic, and ordered from lowest to highest damage.

## Unknown keys, aliases, and errors

- Strict unknown-key rejection.
- Do not silently strip unsupported fields.
- Aliases are normalization-layer responsibilities (#147), not deterministic schema responsibilities.
- Validation errors should be path-aware, actionable, and point to canonical names.

## Trigger/event handling (out of scope v1)

Deterministic calculation accepts already-resolved battle state only.

Out of scope for v1 (future work #170):

- Trigger/event interpretation
- Turn-by-turn state transition resolution

## Schema responsibilities

- `AiDamageCalcInputSchema`: tool-call argument contract.
- `AiDamageCalcOutputSchema`: tool-result contract.

Both should be exported along with inferred TS types:

- `AiDamageCalcInputSchema` / `AiDamageCalcInput`
- `AiDamageCalcOutputSchema` / `AiDamageCalcOutput`

## Validation ownership

- Input validation source of truth: `AiDamageCalcInputSchema`.
- Core adapter may accept typed validated input directly.
- Optional safe wrapper may parse `unknown` before calling core.

## Output validation ownership

- Output schema should be exported for tests/SDK contracts/inference.
- Production adapter path may return engine-shaped `DamageResult` without mandatory re-parse on every call.

## Normalized internal input type

Public tool-call type and internal normalized type are distinct:

- Public: `AiDamageCalcInput`
- Internal: `NormalizedAiDamageCalcInput`

Internal normalized type exists to represent fully-defaulted deterministic inputs for adapter construction and tests.

## Schema examples

### Example A: derived attacker + manual defender

```json
{
  "attacker": {
    "statMode": "derived",
    "pokemonId": 987,
    "pokemonName": "flutter-mane",
    "level": 50,
    "types": ["Ghost", "Fairy"],
    "baseStat": {
      "hp": 55,
      "attack": 55,
      "defense": 55,
      "specialAttack": 135,
      "specialDefense": 135,
      "speed": 135
    },
    "statRuleset": "mainSeries",
    "effortValues": {
      "hp": 4,
      "specialAttack": 252,
      "speed": 252
    },
    "individualValues": {
      "attack": 0
    },
    "ability": "Protosynthesis",
    "item": "Choice Specs",
    "teraType": "Fairy",
    "specialForm": "Tera",
    "status": "Healthy"
  },
  "defender": {
    "statMode": "manual",
    "pokemonId": 645,
    "pokemonName": "landorus-therian",
    "types": ["Ground", "Flying"],
    "stats": {
      "hp": 165,
      "attack": 165,
      "defense": 110,
      "specialAttack": 112,
      "specialDefense": 100,
      "speed": 143
    },
    "statStage": {
      "specialDefense": -1
    }
  },
  "move": {
    "moveId": 585,
    "moveName": "moonblast",
    "base": 95,
    "type": "Fairy",
    "category": "Special",
    "target": "selectedTarget"
  },
  "field": {
    "isDouble": true
  }
}
```

### Example B: minimal mechanical-default input

```json
{
  "attacker": {
    "statMode": "derived",
    "types": ["Normal"],
    "baseStat": {
      "hp": 100,
      "attack": 100,
      "defense": 100,
      "specialAttack": 100,
      "specialDefense": 100,
      "speed": 100
    }
  },
  "defender": {
    "statMode": "manual",
    "types": ["Normal"],
    "stats": {
      "hp": 100,
      "attack": 100,
      "defense": 100,
      "specialAttack": 100,
      "specialDefense": 100,
      "speed": 100
    }
  },
  "move": {
    "base": 100,
    "type": "Normal",
    "category": "Special",
    "target": "selectedTarget"
  }
}
```

## Acceptance criteria

- RFC doc exists in-repo at `docs/rfc/ai-damage-calculation-schema.md`.
- Top-level input shape is `attacker`/`defender`/`move`/`field?`.
- `isChampion` is excluded from AI-facing schema.
- `calcContext` is excluded from v1.
- JSON-safe structures only.
- `pokemonId`/`moveId` plus optional name metadata are documented.
- Full stat keys only are documented.
- `statMode` discriminated union and mutual exclusivity are documented.
- Mechanical defaults and adapter-level default materialization are documented.
- `statRuleset` EV rules are documented.
- `specialForm` (not `isTera`) is documented.
- Status/field/flags/output alignment with existing engine contracts is documented.
- `rolls` output-only and low→high ordering are documented.
- Strict unknown-key rejection is documented.
- Alias handling belongs to normalization tooling (#147).
- Path-aware actionable validation errors are required.
- Trigger/event handling is explicitly out of scope for v1 (#170).
- Input/output schema responsibilities and validation ownership are documented.
- Normalized internal input type is documented.
- Schema examples are included.
