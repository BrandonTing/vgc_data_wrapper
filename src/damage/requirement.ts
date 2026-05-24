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

type RequirementFailure = {
	satisfied: false;
	target: RequirementTarget;
	reason: string;
	statRuleset: StatRuleset;
};

type RequirementSuccess = {
	satisfied: true;
	target: RequirementTarget;
	investment: Partial<
		Record<
			"hp" | "attack" | "defense" | "specialAttack" | "specialDefense",
			number
		>
	>;
	finalStats: Partial<
		Record<
			"hp" | "attack" | "defense" | "specialAttack" | "specialDefense",
			number
		>
	>;
	damage: ReturnType<Battle["getDamage"]>;
	statRuleset: StatRuleset;
};

export type MinRequirementResult = RequirementSuccess | RequirementFailure;

const maxPerStat = (ruleset: StatRuleset) =>
	ruleset === "mainSeries" ? 252 : 32;
const maxTotal = (ruleset: StatRuleset) =>
	ruleset === "mainSeries" ? 510 : 66;
const usesPhysicalDefense = (move: Move) =>
	move.category === "Physical" || move.id === 473 || move.id === 540; // Psyshock & Psystrike
const usesDefenseAsAttack = (move: Move) => move.id === 776; // Body Press
const getOffensiveEvKey = (
	move: Move,
): "attack" | "specialAttack" | "defense" =>
	usesDefenseAsAttack(move)
		? "defense"
		: move.category === "Physical"
			? "attack"
			: "specialAttack";

// Interpret forward `koChance` as either KO success (atk mode) or survival success (def mode).
function meetsTarget(
	damage: ReturnType<Battle["getDamage"]>,
	target: RequirementTarget,
	mode: "atk" | "def",
	defenderHp: number,
) {
	const { koChance } = damage;
	const surviveChance = 100 - koChance;
	if (target.type === "guaranteed")
		return mode === "atk" ? koChance === 100 : surviveChance === 100;
	if (target.type === "chance")
		return mode === "atk"
			? koChance >= target.value
			: surviveChance >= target.value;
	// guaranteed-2hit: ensure min roll KOs in 2 hits (atk), or max roll fails to KO in 2 hits (def).
	const minRollDamage = damage.rolls[0]?.number ?? 0;
	const maxRollDamage = damage.rolls[damage.rolls.length - 1]?.number ?? 0;
	if (mode === "atk") return minRollDamage * 2 >= defenderHp;
	return maxRollDamage * 2 < defenderHp;
}

export function getMinDefRequirement({
	attacker,
	defender,
	move,
	field,
	target,
}: {
	attacker: Pokemon;
	defender: Pokemon;
	move: Move;
	field?: ConstructorParameters<typeof Battle>[0]["field"];
	target: RequirementTarget;
}): MinRequirementResult {
	const ruleset = defender.statRuleset;
	const defKey = usesPhysicalDefense(move) ? "defense" : "specialDefense";
	const max = maxPerStat(ruleset);
	const totalMax = maxTotal(ruleset);
	const baseTotal =
		Object.values(defender.effortValues).reduce(
			(sum, value) => sum + value,
			0,
		) -
		defender.effortValues.hp -
		defender.effortValues[defKey];
	let best: RequirementSuccess | null = null;

	// Brute-force defensive EV pairs in ascending order; first valid minimum wins by deterministic tie-break.
	for (let hp = 0; hp <= max; hp++) {
		// Only the move-relevant defense stat is searched (`defense` for Physical, `specialDefense` for Special).
		for (let def = 0; def <= max; def++) {
			if (
				best &&
				hp + def > (best.investment.hp ?? 0) + (best.investment[defKey] ?? 0)
			)
				break;
			const nextEvs = { ...defender.effortValues, hp, [defKey]: def };
			const totalEvs = baseTotal + hp + def;
			if (totalEvs > totalMax) continue;
			const { stats: _ignoredStats, ...defenderBase } = defender;
			const mon = new Pokemon({ ...defenderBase, effortValues: nextEvs });
			// Validate candidate with the normal forward damage pipeline (single source of truth).
			const damage = new Battle({
				attacker,
				defender: mon,
				move,
				field,
			}).getDamage();
			if (!meetsTarget(damage, target, "def", mon.getStat("hp"))) continue;
			const candidate: RequirementSuccess = {
				satisfied: true,
				target,
				investment: { hp, [defKey]: def },
				finalStats: { hp: mon.getStat("hp"), [defKey]: mon.getStat(defKey) },
				damage,
				statRuleset: ruleset,
			};
			if (
				!best ||
				hp + def < (best.investment.hp ?? 0) + (best.investment[defKey] ?? 0) ||
				(hp + def ===
					(best.investment.hp ?? 0) + (best.investment[defKey] ?? 0) &&
					hp < (best.investment.hp ?? 0))
			)
				best = candidate;
		}
	}
	return (
		best ?? {
			satisfied: false,
			target,
			reason: "No valid investment satisfies the target",
			statRuleset: ruleset,
		}
	);
}

export function getMinAtkRequirement({
	attacker,
	defender,
	move,
	field,
	target,
}: {
	attacker: Pokemon;
	defender: Pokemon;
	move: Move;
	field?: ConstructorParameters<typeof Battle>[0]["field"];
	target: RequirementTarget;
}): MinRequirementResult {
	const ruleset = attacker.statRuleset;
	const atkKey = getOffensiveEvKey(move);
	const max = maxPerStat(ruleset);
	const totalMax = maxTotal(ruleset);
	const baseTotal =
		Object.values(attacker.effortValues).reduce(
			(sum, value) => sum + value,
			0,
		) - attacker.effortValues[atkKey];
	// Brute-force the move-relevant offensive EV stat from low to high for deterministic minimum search.
	for (let atk = 0; atk <= max; atk++) {
		const nextEvs = { ...attacker.effortValues, [atkKey]: atk };
		const totalEvs = baseTotal + atk;
		if (totalEvs > totalMax) continue;
		const { stats: _ignoredStats, ...attackerBase } = attacker;
		const mon = new Pokemon({ ...attackerBase, effortValues: nextEvs });
		const damage = new Battle({
			attacker: mon,
			defender,
			move,
			field,
		}).getDamage();
		if (!meetsTarget(damage, target, "atk", defender.getStat("hp"))) continue;
		return {
			satisfied: true,
			target,
			investment: { [atkKey]: atk },
			finalStats: { [atkKey]: mon.getStat(atkKey) },
			damage,
			statRuleset: ruleset,
		};
	}
	return {
		satisfied: false,
		target,
		reason: "No valid investment satisfies the target",
		statRuleset: ruleset,
	};
}
