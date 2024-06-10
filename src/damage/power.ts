import { getBasePower } from "./basePower";
import { createFactorHelper, type TemporalFactor } from "./battle";
import type { BattleStatus } from "./config";
import {
	checkMatchType,
	checkTeraWIthTypeMatch,
	mergeFactorList,
	pipeModifierHelper,
} from "./utils";

export function getPower(option: BattleStatus): TemporalFactor {
	let factors: TemporalFactor["factors"] = {}
	const basePower = getBasePower(
		option.attacker,
		option.defender,
		option.move,
		option.field,
	);
	factors = basePower.factors
	const modifierAfterModification = pipeModifierHelper(
		{ operator: 4096, factors } as TemporalFactor,
		[
			modifyByAttackerAbility,
			modifyByDefenderAbility,
			modifyByItem,
			modifyByMoveEffect,
			modifyByHelpingHand,
			modifyByPowerSpot,
			modifyBySteelySpirit,
			modifyByCharge,
			modifyByTerrain,
			modifyByAura,
		],
		(pre, cur) => {
			const { operator, factors } = cur(option)
			return { operator: Math.round(pre.operator * operator), factors: mergeFactorList(pre.factors, factors) }
		},
	);
	const result = Math.round(
		(basePower.operator * modifierAfterModification.operator) / 4096 - 0.001,
	);
	factors = modifierAfterModification.factors
	if (
		checkTeraWIthTypeMatch(option.attacker, option.move.type) &&
		result < 60 &&
		!option.move.flags?.isMultihit &&
		!option.move.flags?.isPriority &&
		option.move.id !== 512
	) {
		return { operator: 60, factors: mergeFactorList(factors, { attacker: { isTera: true } }) }
	};

	return { operator: result, factors };
}

function modifyByAttackerAbility({
	attacker,
	defender,
	move,
	field,
}: BattleStatus): TemporalFactor {
	const getFactor = createFactorHelper({
		attacker: {
			ability: true
		},
	})
	// Rivalry
	if (attacker.ability === "Rivalry") {
		if (defender.gender === "Unknown") return getFactor(1);
		if (attacker.gender === defender.gender) return getFactor(1.25);
		return getFactor(0.75);
	}
	// Supreme Overlord
	if (attacker.ability === "Supreme Overlord 1") {
		return getFactor(1 + 0.1 * 1);
	}
	if (attacker.ability === "Supreme Overlord 2") {
		return getFactor(1 + 0.1 * 2);
	}
	if (attacker.ability === "Supreme Overlord 3") {
		return getFactor(1 + 0.1 * 3);
	}
	// skins
	if (
		// Refrigerate
		(attacker.ability === "Refrigerate" ||
			// Pixilate
			attacker.ability === "Pixilate" ||
			// Aerilate
			attacker.ability === "Aerilate" ||
			// Galvanize
			attacker.ability === "Galvanize") &&
		move.type === "Normal"
	) {
		return getFactor(1.2);
	}
	// iron fist
	if (attacker.ability === "Iron Fist" && move.flags?.isPunch) {
		return getFactor(1.2);
	}
	// reckless
	if (attacker.ability === "Reckless" && move.flags?.hasRecoil) {
		return getFactor(1.2);
	}
	// Analytic
	if (attacker.ability === "Analytic") {
		return getFactor(1.3);
	}
	// sheer force
	if (attacker.ability === "Sheer Force" && move.flags?.hasSecondary) {
		return getFactor(1.3);
	}
	// Tough Claws
	if (attacker.ability === "Tough Claws" && move.flags?.isContact) {
		return getFactor(1.3);
	}
	// Sand Force
	if (
		attacker.ability === "Sand Force" &&
		(move.type === "Rock" || move.type === "Steel" || move.type === "Ground") &&
		field?.weather === "Sand"
	) {
		return getFactor(1.3, {
			attacker: {
				weather: true
			}
		});
	}
	// Punk Rock
	if (attacker.ability === "Punk Rock" && move.flags?.isSound) {
		return getFactor(1.3);
	}
	// Sharpness
	if (attacker.ability === "Sharpness" && move.flags?.isSlicing) {
		return getFactor(1.5);
	}
	// Technician
	if (attacker.ability === "Technician" && move.base <= 60) {
		return getFactor(1.5);
	}
	// Strong Jaw
	if (attacker.ability === "Strong Jaw" && move.flags?.isBite) {
		return getFactor(1.5);
	}
	// Mega Launcher
	if (attacker.ability === "Mega Launcher" && move.flags?.isPulse) {
		return getFactor(1.5);
	}
	// Flare Boost
	if (
		attacker.ability === "Flare Boost" &&
		attacker.status === "Burned" &&
		move.category === "Special"
	) {
		return getFactor(1.5, {
			attacker: {
				status: true
			}
		});
	}
	// Toxic Boost
	if (
		attacker.ability === "Toxic Boost" &&
		(attacker.status === "Poisoned" || attacker.status === "Badly Poisoned") &&
		move.category === "Physical"
	) {
		return getFactor(1.5, {
			attacker: {
				status: true
			}
		});
	}
	return { operator: 1 }
}

function modifyByDefenderAbility({
	defender,
	move,
}: Pick<BattleStatus, "defender" | "move">): TemporalFactor {
	const getFactor = createFactorHelper({
		defender: {
			ability: true
		},
	})

	// Fluffy
	if (defender.ability === "Fluffy" && move.type === "Fire") {
		return getFactor(1.25);
	}
	if (defender.ability === "Heatproof" && move.type === "Fire") {
		return getFactor(0.5);
	}
	return { operator: 1 };
}

function modifyByItem({
	attacker: { item },
	move,
}: Pick<BattleStatus, "attacker" | "move">): TemporalFactor {
	const getFactor = createFactorHelper({
		attacker: {
			item: true
		},
	})

	if (item === "Muscle Band" && move.category === "Physical") {
		return getFactor(1.1);
	}
	if (item === "Wise Glasses" && move.category === "Special") {
		return getFactor(1.1);
	}
	if (item === "Punching Glove" && move.flags?.isPunch) {
		return getFactor(1.1);
	}
	if (item === "Type Enhancing" || item === "Ogerpon Mask") {
		return getFactor(1.2);
	}
	if (item === "Normal Gem" && move.type === "Normal") {
		return getFactor(1.3);
	}
	return { operator: 1 };
}

function modifyByMoveEffect({
	attacker,
	defender,
	move,
	field,
}: BattleStatus): TemporalFactor {
	// Expanding Force
	if (move.id === 797 && field?.terrain === "Psychic") {
		return {
			operator: 1.5,
			factors: {
				field: {
					terrain: true
				}
			}
		}
	}
	// solar beam & solar blade
	if (
		(move.id === 76 || move.id === 669) &&
		field?.weather &&
		field?.weather !== "Sun"
	) {
		return {
			operator: 0.5,
			factors: {
				defender: {
					weather: true
				}
			}
		}
	}
	// Facade
	if (move.id === 263 && attacker.status === "Burned") {
		return {
			operator: 2,
			factors: {
				attacker: {
					status: true
				}
			}
		}
	}
	// Knock off
	if (move.id === 282 && defender.item) {
		return {
			operator: 1.5,
			factors: {
				defender: {
					item: true
				}
			}
		};
	}
	// Rising Voltage
	if (move.id === 804 && field?.terrain === "Electric") {
		if (checkMatchType(defender, "Flying")) {
			return {
				operator: 1,
				factors: {
					defender: {
						isTera: true
					}
				}
			};
		}
		return { operator: 2, factors: { field: { terrain: true } } };
	}
	return { operator: 1 }
}

function modifyByHelpingHand({
	attacker,
}: Pick<BattleStatus, "attacker">): TemporalFactor {
	if (attacker.flags?.helpingHand) {
		return {
			operator: 1.5,
			factors: {
				attacker: {
					helpingHand: true
				}
			}
		}
	}
	return {
		operator: 1
	}
}

function modifyByPowerSpot({
	attacker,
}: Pick<BattleStatus, "attacker">): TemporalFactor {
	if (attacker.flags?.powerSpot) {
		return {
			operator: 1.3,
			factors: {
				attacker: {
					powerSpot: true
				}
			}
		}
	}
	return {
		operator: 1,
	}
}

function modifyBySteelySpirit({
	attacker,
}: Pick<BattleStatus, "attacker">): TemporalFactor {
	if (attacker.flags?.steelySpirit) {
		return {
			operator: 1.5,
			factors: {
				attacker: {
					steelySpirit: true
				}
			}
		}
	}
	return {
		operator: 1,
	}
}

function modifyByCharge({
	attacker,
	move,
}: Pick<BattleStatus, "attacker" | "move">): TemporalFactor {
	const charged = attacker.flags?.charge && move.type === "Electric"
	if (charged) {
		return {
			operator: 2,
			factors: {
				attacker: {
					charge: true
				}
			}
		}
	}
	return {
		operator: 1,
	}
}

function modifyByTerrain({
	move,
	field,
}: Pick<BattleStatus, "move" | "field">): TemporalFactor {
	const getFactor = createFactorHelper({
		field: {
			terrain: true
		}
	})
	if (
		(move.type === "Electric" && field?.terrain === "Electric") ||
		(move.type === "Psychic" && field?.terrain === "Psychic") ||
		(move.type === "Grass" && field?.terrain === "Grassy")
	) {
		return getFactor(1.3);
	}
	if (move.type === "Dragon" && field?.terrain === "Misty") {
		return getFactor(0.5);
	}
	return { operator: 1 };
}

function modifyByAura({
	move,
	field,
}: Pick<BattleStatus, "move" | "field">): TemporalFactor {
	const auraAffected = (move.type === "Dark" && field?.aura?.includes("Dark")) ||
		(move.type === "Fairy" && field?.aura?.includes("Fairy"))
	return auraAffected ? {
		operator: 1.33,
		factors: {
			field: {
				aura: true
			}
		}
	} : {
		operator: 1
	}
}
