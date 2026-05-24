/**
 * Reverse requirement helpers for damage planning.
 *
 * What this module does:
 * - `getMinDefRequirement`: finds the minimum defensive investment that satisfies
 *   a survival target against a given attack.
 * - `getMinAtkRequirement`: finds the minimum offensive investment that satisfies
 *   a KO target against a given defender.
 *
 * Key behaviors:
 * - Reuses the existing forward pipeline (`Battle#getDamage`) for every candidate,
 *   so reverse results always match normal damage calculation behavior.
 * - Supports `guaranteed`, `chance`, and `guaranteed-2hit` targets.
 * - Respects ruleset limits (`mainSeries` vs `champions`) and provided nature.
 * - Deterministic tie-break by iterating from lower investment to higher investment
 *   and keeping the first valid minimum candidate.
 */
import { Pokemon } from "../pokemon";
import type { StatRuleset } from "../pokemon/base";
import { Battle } from "./battle";
import type { Move } from "./config";

export type RequirementTarget =
  | { type: "guaranteed" }
  | { type: "chance"; value: number }
  | { type: "guaranteed-2hit" };

type RequirementFailure = { satisfied: false; target: RequirementTarget; reason: string; statRuleset: StatRuleset };

type RequirementSuccess = {
  satisfied: true;
  target: RequirementTarget;
  investment: Partial<Record<"hp"|"attack"|"defense"|"specialAttack"|"specialDefense", number>>;
  finalStats: Partial<Record<"hp"|"attack"|"defense"|"specialAttack"|"specialDefense", number>>;
  damage: ReturnType<Battle["getDamage"]>;
  statRuleset: StatRuleset;
};

export type MinRequirementResult = RequirementSuccess | RequirementFailure;

const maxPerStat = (ruleset: StatRuleset) => ruleset === "mainSeries" ? 252 : 32;
const maxTotal = (ruleset: StatRuleset) => ruleset === "mainSeries" ? 510 : 66;

// Interpret forward `koChance` as either KO success (atk mode) or survival success (def mode).
function meetsTarget(koChance: number, target: RequirementTarget, mode: "atk"|"def") {
  const surviveChance = 100 - koChance;
  if (target.type === "guaranteed") return mode === "atk" ? koChance === 100 : surviveChance === 100;
  if (target.type === "chance") return mode === "atk" ? koChance >= target.value : surviveChance >= target.value;
  // guaranteed-2hit
  if (mode === "atk") return koChance > 0;
  return koChance < 100;
}

export function getMinDefRequirement({ attacker, defender, move, field, target }: { attacker: Pokemon; defender: Pokemon; move: Move; field?: ConstructorParameters<typeof Battle>[0]["field"]; target: RequirementTarget; }): MinRequirementResult {
  const ruleset = defender.statRuleset;
  const defKey = move.category === "Physical" ? "defense" : "specialDefense";
  const max = maxPerStat(ruleset);
  const totalMax = maxTotal(ruleset);
  let best: RequirementSuccess | null = null;

  // Brute-force defensive EV pairs in ascending order; first valid minimum wins by deterministic tie-break.
  for (let hp = 0; hp <= max; hp++) {
    // Only the move-relevant defense stat is searched (`defense` for Physical, `specialDefense` for Special).
    for (let def = 0; def <= max; def++) {
      if (hp + def > totalMax) continue;
      const mon = new Pokemon({ ...defender, effortValues: { ...defender.effortValues, hp, [defKey]: def } });
      // Validate candidate with the normal forward damage pipeline (single source of truth).
      const damage = new Battle({ attacker, defender: mon, move, field }).getDamage();
      if (!meetsTarget(damage.koChance, target, "def")) continue;
      const candidate: RequirementSuccess = {
        satisfied: true,
        target,
        investment: { hp, [defKey]: def },
        finalStats: { hp: mon.getStat("hp"), [defKey]: mon.getStat(defKey) },
        damage,
        statRuleset: ruleset,
      };
      if (!best || hp + def < (best.investment.hp ?? 0) + (best.investment[defKey] ?? 0) || (hp + def === (best.investment.hp ?? 0) + (best.investment[defKey] ?? 0) && hp < (best.investment.hp ?? 0))) best = candidate;
    }
  }
  return best ?? { satisfied: false, target, reason: "No valid investment satisfies the target", statRuleset: ruleset };
}

export function getMinAtkRequirement({ attacker, defender, move, field, target }: { attacker: Pokemon; defender: Pokemon; move: Move; field?: ConstructorParameters<typeof Battle>[0]["field"]; target: RequirementTarget; }): MinRequirementResult {
  const ruleset = attacker.statRuleset;
  const atkKey = move.category === "Physical" ? "attack" : "specialAttack";
  const max = maxPerStat(ruleset);
  let best: RequirementSuccess | null = null;
  // Brute-force the move-relevant offensive EV stat from low to high for deterministic minimum search.
  for (let atk = 0; atk <= max; atk++) {
    const mon = new Pokemon({ ...attacker, effortValues: { ...attacker.effortValues, [atkKey]: atk } });
    const damage = new Battle({ attacker: mon, defender, move, field }).getDamage();
    if (!meetsTarget(damage.koChance, target, "atk")) continue;
    const candidate: RequirementSuccess = {
      satisfied: true,
      target,
      investment: { [atkKey]: atk },
      finalStats: { [atkKey]: mon.getStat(atkKey) },
      damage,
      statRuleset: ruleset,
    };
    if (!best || atk < (best.investment[atkKey] ?? 999)) best = candidate;
  }
  return best ?? { satisfied: false, target, reason: "No valid investment satisfies the target", statRuleset: ruleset };
}
