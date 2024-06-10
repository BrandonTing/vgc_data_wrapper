import { createFactorHelper, type TemporalFactor } from "./battle";
import type { BattleStatus } from "./config";
import {
	checkStatOfMoveCategoryIsHighest,
	mergeFactorList,
	modifyStatByStageChange,
	pipeModifierHelper
} from "./utils";

export function getAttack(option: BattleStatus): TemporalFactor {
	const {
		attacker,
		defender,
		move,
	} = option
	const isPhysicalMove = move.category === "Physical"
	let atkStat =
		isPhysicalMove
			? attacker.getStat("attack")
			: attacker.getStat("specialAttack");
	let stageChanges =
		move.category === "Physical"
			? attacker.statStage.attack
			: attacker.statStage.specialAttack;
	let factors: TemporalFactor["factors"] = {
		attacker: {
			atk: isPhysicalMove ? "attack" : "specialAttack",
			statFrom: "Attacker"
		},
		defender: {
			def: isPhysicalMove ? "defense" : "specialDefense"
		}
	}
	// body press
	if (move.id === 776) {
		atkStat = attacker.getStat("defense");
		stageChanges = attacker.statStage.defense;
		factors = mergeFactorList(factors, {
			attacker: {
				atk: "defense"
			}
		})
	}
	// foul play
	if (move.id === 492) {
		atkStat = defender.getStat("attack");
		stageChanges = defender.statStage.attack;
		factors = mergeFactorList(factors, {
			attacker: {
				statFrom: "Defender"
			}
		})
	}
	if (!move.flags?.isCriticalHit) {
		atkStat = modifyStatByStageChange(atkStat, stageChanges);
	}
	const operator = pipeModifierHelper(
		{ operator: 4096, factors } as TemporalFactor,
		[
			modifyAtkByAttackAbility,
			modifyByDefenderAbility,
			modifyByItem,
			modifyByRuin,
		],
		(pre, cur) => {
			const { operator, factors } = cur(option)
			return { operator: Math.round(pre.operator * operator), factors: mergeFactorList(pre.factors, factors) };
		},
	)
	factors = operator.factors
	const result = Math.round(
		(atkStat *
			operator.operator) /
		4096 -
		0.001,
	);

	return { operator: result, factors };
}


function modifyAtkByAttackAbility({
	attacker,
	move,
	field,
}: Pick<BattleStatus, "attacker" | "field" | "move">): TemporalFactor {
	const { ability } = attacker;
	const getFactor = createFactorHelper({
		attacker: {
			ability: true
		}
	})
	// Quark Drive & Protosynthesis
	if (ability === "Quark Drive") {
		let factors: TemporalFactor["factors"] = {}
		let activated = false
		if (attacker.item === "Booster Energy") {
			activated = true;
			factors = {
				attacker: {
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
		if (activated && checkStatOfMoveCategoryIsHighest(move.category, attacker.getStats())) {
			return getFactor(1.3, factors)
		}
	}
	if (ability === "Protosynthesis") {
		let factors: TemporalFactor["factors"] = {}
		let activated = false
		if (attacker.item === "Booster Energy") {
			activated = true;
			factors = {
				attacker: {
					ability: true,
				},
			}
		}
		if (field?.weather === "Sun") {
			activated = true;
			factors = {
				attacker: {
					weather: true
				}
			}
		}
		if (activated && checkStatOfMoveCategoryIsHighest(move.category, attacker.getStats())) {
			return getFactor(1.3, factors)
		}
	}

	// Orichalcum Pulse
	if (
		ability === "Orichalcum Pulse" &&
		move.category === "Physical" &&
		field?.weather === "Sun"
	) {
		return getFactor(1.333, {
			attacker: { weather: true }
		});
	}
	// Hadron Engine
	if (
		ability === "Hadron Engine" &&
		move.category === "Special" &&
		field?.terrain === "Electric"
	) {
		return getFactor(1.333, {
			field: {
				terrain: true
			}
		})
	}
	// Transistor
	if (ability === "Transistor" && move.type === "Electric") {
		return getFactor(1.33);
	}
	// Overgrow & Blaze & Torrent & Swarm
	if (
		(ability === "Overgrow" && move.type === "Grass") ||
		(ability === "Blaze" && move.type === "Fire") ||
		(ability === "Torrent" && move.type === "Water") ||
		(ability === "Swarm" && move.type === "Bug")
	) {
		return getFactor(1.5);
	}
	// Flash Fire
	if (ability === "Flash Fire" && move.type === "Fire") {
		return getFactor(1.5);
	}
	// Solar power
	if (
		ability === "Solar Power" &&
		field?.weather === "Sun" &&
		move.category === "Special"
	) {
		return getFactor(1.5, {
			attacker: {
				weather: true
			}
		});
	}
	// Plus / Minus
	if (ability === "Plus Minus" && move.category === "Special") {
		return getFactor(1.5);
	}
	// Guts
	if (
		ability === "Guts" &&
		move.category === "Physical" &&
		attacker.status === "Burned"
	) {
		return getFactor(1.5, {
			attacker: {
				status: true
			}
		});
	}
	// Rocky Payload
	if (ability === "Rocky Payload" && move.type === "Rock") {
		return getFactor(1.5);
	}
	// Dragon Maw
	if (ability === "Dragon's Maw" && move.type === "Dragon") {
		return getFactor(1.5);
	}
	// Huge Power & Pure Power
	if (
		(ability === "Huge Power" || ability === "Pure Power") &&
		move.category === "Physical"
	) {
		return getFactor(2);
	}
	// Stakeout
	if (ability === "Stakeout") {
		return getFactor(2);
	}
	// Water Bubble
	if (ability === "Water Bubble" && move.type === "Water") {
		return getFactor(2);
	}
	return {
		operator: 1
	};
}
function modifyByDefenderAbility({
	defender: { ability },
	move: { type },
}: Pick<BattleStatus, "defender" | "move">): TemporalFactor {
	const getFactor = createFactorHelper({
		defender: {
			ability: true
		}
	})
	// Thick Fat
	if (ability === "Thick Fat" && (type === "Fire" || type === "Ice")) {
		return getFactor(0.5);
	}
	// Purifying Salt
	if (ability === "Purifying Salt" && type === "Ghost") {
		return getFactor(0.5);
	}
	// Water Bubble
	if (ability === "Water Bubble" && type === "Fire") {
		return getFactor(0.5);
	}
	return { operator: 1 };
}
function modifyByItem({
	attacker: { item, id, name },
	move: { category },
}: Pick<BattleStatus, "attacker" | "move">): TemporalFactor {
	const getFactor = createFactorHelper({ attacker: { item: true } })
	// Choice item
	if (
		(item === "Choice Band" && category === "Physical") ||
		(item === "Choice Specs" && category === "Special")
	) {
		return getFactor(1.5);
	}
	// Light Ball on Pikachu
	if ((id === 25 || name?.toLowerCase() === "pikachu") && item === "Light Ball") {
		return getFactor(2);
	}
	return { operator: 1 };
}
function modifyByRuin({
	attacker,
	move,
	field,
}: Pick<BattleStatus, "move" | "field" | "attacker">): TemporalFactor {
	const getFactor = createFactorHelper({ defender: { ruin: true } })
	// ruin ability doesn't affect owner
	// Tablets
	if (
		field?.ruin?.includes("Tablets") &&
		move.category === "Physical" &&
		attacker.ability !== "Tablets of Ruin"
	) {
		return getFactor(0.75);
	}
	// Vessel
	if (
		field?.ruin?.includes("Vessel") &&
		move.category === "Special" &&
		attacker.ability !== "Vessel of Ruin"
	) {
		return getFactor(0.75);
	}
	return { operator: 1 };
}