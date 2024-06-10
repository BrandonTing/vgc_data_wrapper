import { createFactorHelper, type TemporalFactor } from "./battle";
import type { BattleStatus, Move } from "./config";
import {
	checkMatchType,
	checkStatOfMoveCategoryIsHighest,
	mergeFactorList,
	modifyStatByStageChange,
	pipeModifierHelper
} from "./utils";

export function getDefense(
	option: Pick<BattleStatus, "defender" | "move">,
): TemporalFactor {
	const { move, defender } = option;
	const usePhysicalDef = checkUsePhysicalHelper(move);
	let defStat = usePhysicalDef
		? defender.getStat("defense")
		: defender.getStat("specialDefense");
	const stageChanges = usePhysicalDef
		? defender.statStage.defense
		: defender.statStage.specialDefense;
	if (
		!move.flags?.isCriticalHit &&
		move.id !== 533 // sacred sword
	) {
		defStat = modifyStatByStageChange(defStat, stageChanges);
	}
	const operator = pipeModifierHelper(
		{ operator: 4096, factors: {} } as TemporalFactor,
		[modifyByWeather, modifyByDefenderAbility, modifyByItem, modifyByRuin],
		(pre, cur) => {
			const { operator, factors } = cur(option)
			return { operator: Math.round(pre.operator * operator), factors: mergeFactorList(pre.factors, factors) };
		},
	)
	const result = Math.round(
		(defStat *
			operator.operator) /
		4096 -
		0.001,
	);

	return { operator: result, factors: operator.factors };
}

function modifyByWeather({
	defender,
	field,
	move: { category },
}: Pick<BattleStatus, "defender" | "field" | "move">): TemporalFactor {
	const getFactor = createFactorHelper({
		defender: {
			weather: true
		}
	})
	// Snow
	if (
		checkMatchType(defender, "Ice") &&
		field?.weather === "Snow" &&
		category === "Physical"
	) {
		return getFactor(1.5);
	}
	// Sand
	if (
		checkMatchType(defender, "Rock") &&
		field?.weather === "Sand" &&
		category === "Special"
	) {
		return getFactor(1.5);
	}
	return { operator: 1 };
}

function modifyByDefenderAbility({
	defender,
	move,
	field,
}: Pick<BattleStatus, "defender" | "move" | "field">): TemporalFactor {
	const getFactor = createFactorHelper({
		defender: {
			ability: true
		}
	})

	const { ability } = defender;
	// Fur Coat
	if (ability === "Fur Coat" && move.category === "Physical") {
		return getFactor(2);
	}
	// Marvel Scale
	if (
		ability === "Marvel Scale" &&
		defender.status === "Burned" &&
		move.category === "Physical"
	) {
		return getFactor(1.5, {
			defender: {
				status: true
			}
		});
	}
	// Quark Drive & Protosynthesis
	if (ability === "Quark Drive") {
		let factors: TemporalFactor["factors"] = {}
		let activated = false
		if (defender.item === "Booster Energy") {
			activated = true;
			factors = {
				defender: {
					item: true
				},
			}
		}
		if (field?.terrain === "Electric") {
			activated = true;
			factors = {
				field: {
					terrain: true
				}
			}
		}
		if (activated && checkStatOfMoveCategoryIsHighest(move.category, defender.getStats())) {
			return getFactor(1.3, factors)
		}
	}
	if (ability === "Protosynthesis") {
		let factors: TemporalFactor["factors"] = {}
		let activated = false
		if (defender.item === "Booster Energy") {
			activated = true;
			factors = {
				defender: {
					ability: true,
				},
			}
		}
		if (field?.weather === "Sun") {
			activated = true;
			factors = {
				defender: {
					weather: true
				}
			}
		}
		if (activated && checkStatOfMoveCategoryIsHighest(move.category, defender.getStats())) {
			return getFactor(1.3, factors)
		}
	}

	return { operator: 1 };
}

function modifyByItem({
	defender: { item, flags },
	move,
}: Pick<BattleStatus, "defender" | "move">): TemporalFactor {
	const getFactor = createFactorHelper({
		defender: {
			item: true
		}
	})
	if (item === "Assault Vest" && move.category === "Special") {
		return getFactor(1.5);
	}
	if (item === "Eviolite" && flags?.hasEvolution) {
		return getFactor(1.5);
	}
	return { operator: 1 };
}

function modifyByRuin({
	defender,
	move,
	field,
}: Pick<BattleStatus, "move" | "field" | "defender">): TemporalFactor {
	const getFactor = createFactorHelper({
		field: {
			ruin: true
		}
	})
	// ruin ability doesn't affect owner
	const usePhysicalDef = checkUsePhysicalHelper(move);
	// Sword
	if (
		field?.ruin?.includes("Sword") &&
		usePhysicalDef &&
		defender.ability !== "Sword of Ruin"
	) {
		return getFactor(0.75);
	}
	// Beads
	if (
		field?.ruin?.includes("Beads") &&
		!usePhysicalDef &&
		defender.ability !== "Beads of Ruin"
	) {
		return getFactor(0.75);
	}
	return { operator: 1 };
}

function checkUsePhysicalHelper(move: Move): boolean {
	return move.category === "Physical" || move.id === 473 || move.id === 540; // Psyshock & Psystrike
}
