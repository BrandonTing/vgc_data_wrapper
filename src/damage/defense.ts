import type { BattleStatus, Move } from "./config";
import {
	checkAtkIsHighest,
	checkMatchType,
	modifyStatByStageChange,
	pipeModifierHelper,
} from "./utils";

function checkUsePhysicalHelper(move: Move): boolean {
	return move.category === "Physical" || move.id === 473 || move.id === 540; // Psyshock & Psystrike
}

export function getDefense({
	attacker,
	defender,
	move,
	field,
}: BattleStatus): number {
	const usePhysicalDef = checkUsePhysicalHelper(move);
	let defStat = usePhysicalDef
		? defender.stat.defense
		: defender.stat.specialDefense; // Psyshock & Psystrike
	const stageChanges = usePhysicalDef
		? defender.statStage.defense
		: defender.statStage.specialDefense;
	if (
		!move.flags?.isCriticalHit &&
		move.id !== 533 // sacred sword
	) {
		defStat = modifyStatByStageChange(defStat, stageChanges);
	}

	const result = Math.round(
		(defStat *
			pipeModifierHelper(
				4096 as number,
				[modifyByWeather, modifyByDefenderAbility, modifyByItem, modifyByRuin],
				(pre, cur) => {
					return Math.round(
						pre *
							cur({
								defender,
								move,
								field,
							}),
					);
				},
			)) /
			4096 -
			0.001,
	);

	return result;
}

function modifyByWeather({
	defender,
	field: { weather },
	move: { category },
}: Pick<BattleStatus, "defender" | "field" | "move">): number {
	// Snow
	if (
		checkMatchType(defender, "Ice") &&
		weather === "Snow" &&
		category === "Physical"
	) {
		return 1.5;
	}
	// Sand
	if (
		checkMatchType(defender, "Rock") &&
		weather === "Sand" &&
		category === "Special"
	) {
		return 1.5;
	}
	return 1;
}

function modifyByDefenderAbility({
	defender,
	move,
	field,
}: Pick<BattleStatus, "defender" | "move" | "field">): number {
	const { abilityId } = defender;
	// Fur Coat
	if (abilityId === 169 && move.category === "Physical") {
		return 2;
	}
	// Marvel Scale
	if (
		abilityId === 63 &&
		defender.status === "Burned" &&
		move.category === "Physical"
	) {
		return 1.5;
	}
	if (
		// Quark Drive
		((abilityId === 282 &&
			(defender.item === "Booster Energy" || field.terrain === "Electric")) ||
			// Protosynthesis
			(abilityId === 281 &&
				(defender.item === "Booster Energy" || field.weather === "Sun"))) &&
		((move.category === "Physical" &&
			checkAtkIsHighest(defender.stat, "defense")) ||
			(move.category === "Special" &&
				checkAtkIsHighest(defender.stat, "specialDefense")))
	) {
		return 1.3;
	}
	return 1;
}

function modifyByItem({
	defender: { item, flags },
	move,
}: Pick<BattleStatus, "defender" | "move">): number {
	if (item === "Assault Vest" && move.category === "Special") {
		return 1.5;
	}
	if (item === "Eviolite" && flags?.hasEvolution) {
		return 1.5;
	}
	return 1;
}

function modifyByRuin({
	defender,
	move,
	field,
}: Pick<BattleStatus, "move" | "field" | "defender">) {
	// ruin ability doesn't affect owner
	const usePhysicalDef = checkUsePhysicalHelper(move);
	// Sword
	if (field.ruin === "Sword" && usePhysicalDef && defender.abilityId !== 285) {
		return 0.75;
	}
	// Beads
	if (field.ruin === "Beads" && !usePhysicalDef && defender.abilityId !== 287) {
		return 0.75;
	}
	return 1;
}
