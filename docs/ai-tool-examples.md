# AI Tool Examples: Deterministic Damage Calculation

This document provides integration-oriented examples for the deterministic AI damage calculation contract.

Source of truth: [`docs/rfc/ai-damage-calculation-schema.md`](./rfc/ai-damage-calculation-schema.md).

## Purpose

Use this interface when an AI/tooling layer already has (or can provide) resolved mechanical battle state and needs deterministic damage output from the existing engine.

- Input contract: `AiDamageCalcInputSchema`
- Output contract: `AiDamageCalcOutputSchema`
- Core adapter: `calculateAiDamage(input)`
- Safe wrapper: `safeCalculateAiDamage(inputUnknown)`

## Top-level input shape

```json
{
  "attacker": { "...": "AiBattlerInput" },
  "defender": { "...": "AiBattlerInput" },
  "move": { "...": "AiMoveInput" },
  "field": { "...": "AiFieldInput" }
}
```

Required keys: `attacker`, `defender`, `move`.
Optional key: `field`.

## Example A: Derived attacker + manual defender

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

## Example B: Minimal mechanical-default input

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

## Output shape

The AI-facing output is compatible with `DamageResult` and includes:

- `rolls` (ordered low → high)
- `koChance` (percentage in `0..100`, not `0..1`)
- `factors`

Example (abridged):

```json
{
  "rolls": [
    { "number": 168, "percentage": 92.3 },
    { "number": 169, "percentage": 92.9 }
  ],
  "koChance": 37.5,
  "factors": {
    "attacker": {},
    "defender": {},
    "field": {},
    "move": {}
  }
}
```

## Validation reminders for callers

- Use canonical full stat keys only (`hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed`).
- Shorthand stat keys (`atk`, `def`, `spa`, `spd`, `spe`) are invalid.
- Unknown keys are rejected (strict schema).
- `isChampion` and `calcContext` are out of contract for v1.
- In `manual` mode, `stats` are authoritative.
- In `derived` mode, derived inputs are authoritative and `stats` should not be provided.

## Suggested integration pattern

1. Build tool-call payload from upstream state.
2. Validate using `AiDamageCalcInputSchema` (or call safe wrapper).
3. Call deterministic adapter.
4. Return structured JSON output directly to evaluator/agent.

This keeps deterministic battle mechanics in one engine path and avoids LLM-side emulation.
