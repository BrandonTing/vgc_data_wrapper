import type { Pokemon } from "../pokemon";
import type { Ability } from "../pokemon/typeHelper";
import type { TemporalFactor } from "./battle";
import type { BattleFieldStatus, Move } from "./config";
import { checkTeraWIthTypeMatch } from "./utils";

export function getBasePower(
	attacker: Pokemon,
	defender: Pokemon,
	move: Move,
	field?: BattleFieldStatus,
): TemporalFactor {
	// ====== Terrain Related
	if (
		// Hydro Steam
		(move.id === 875 && field?.weather === "Sun")
	) {
		return {
			operator: move.base * 1.5,
			factors: {
				field: {
					weather: true
				}
			}
		};
	}
	if (
		// Psyblade
		(move.id === 876 && field?.terrain === "Electric") ||
		// Misty Explosion
		(move.id === 802 && field?.terrain === "Misty")
	) {
		return {
			operator: move.base * 1.5,
			factors: {
				field: {
					terrain: true
				}
			}
		};
	}

	// earthquake & bulldoze
	if ((move.id === 89 || move.id === 523) && field?.terrain === "Grassy") {
		return {
			operator: move.base / 2,
			factors: {
				field: {
					terrain: true
				}
			}
		};
	}
	// terrain pulse
	if (move.id === 805 && field?.terrain) {
		return {
			operator: 100,
			factors: {
				field: {
					terrain: true
				}
			}
		};
	}
	// ====== Speed Related
	// TODO not counted in factor for now
	// electric ball
	if (move.id === 486) {
		const attackerSpeed = speedModifier(
			attacker.getStat("speed"),
			attacker.item ?? "",
			attacker.statStage.speed,
		);
		const defenderSpeed = speedModifier(
			defender.getStat("speed"),
			defender.item ?? "",
			defender.statStage.speed,
		);
		const ratio = attackerSpeed / defenderSpeed;
		if (ratio >= 4) {
			return {
				operator: 150,
			};
		}
		if (ratio >= 3) {
			return {
				operator: 120,
			};
		}
		if (ratio >= 2) {
			return {
				operator: 80,
			};
		}
		if (ratio >= 1) {
			return {
				operator: 60,
			};
		}
		return {
			operator: 40,
		};
	}
	// Gyro ball
	if (move.id === 360) {
		const attackerSpeed = speedModifier(
			attacker.getStat("speed"),
			attacker.item ?? "",
			attacker.statStage.speed,
		);
		const defenderSpeed = speedModifier(
			defender.getStat("speed"),
			defender.item ?? "",
			defender.statStage.speed,
		);
		return {
			operator: Math.min(
				Math.max(Math.trunc((25 * defenderSpeed) / attackerSpeed), 1),
				150,
			)
		};
	}
	// ====== Weight related
	// TODO Weight doesn't count as factor for now
	// grass knot & low kick
	if (move.id === 447 || move.id === 67) {
		const defenderWeight = weightModifier(defender.weight, defender.ability);
		if (defenderWeight >= 200) {
			return {
				operator: 120
			}
		}
		if (defenderWeight >= 100) {
			return {
				operator: 100
			}
		}
		if (defenderWeight >= 50) {
			return {
				operator: 80
			}
		}
		if (defenderWeight >= 25) {
			return {
				operator: 60
			}
		}
		if (defenderWeight >= 10) {
			return {
				operator: 40
			}
		}
		return {
			operator: 20
		}
	}

	if (
		// heat crash
		move.id === 535 ||
		// heavy slam
		move.id === 484
	) {
		const attackerWeight = weightModifier(attacker.weight, attacker.ability);
		const defenderWeight = weightModifier(defender.weight, defender.ability);
		return { operator: 20 + Math.min(Math.floor(attackerWeight / defenderWeight), 5) * 20 }
	}
	// ====== others
	// weather ball
	if (move.id === 311 && field?.weather) {
		return {
			operator: 100,
			factors: {
				field: {
					weather: true
				}
			}
		};
	}
	// tera blast
	if (move.id === 851 && checkTeraWIthTypeMatch(attacker, "Stellar")) {
		return {
			operator: 100,
			factors: {
				attacker: {
					isTera: true
				}
			}
		};
	}
	// Power Trip & Stored Power
	// TODO not counted as factor for now
	if (move.id === 500 || move.id === 681) {
		const counters = Object.values(attacker.statStage)
			.filter((stage) => stage > 0)
			.reduce((pre, cur) => {
				return pre + cur;
			}, 0);
		return { operator: 20 * (1 + counters) };
	}
	return { operator: move.base };
}

function speedModifier(baseSpeed: number, item: string, stage: number): number {
	const stageMultiplier = getStageMultiplier(stage);
	const itemModifier =
		// Choice Scarf
		item === "Choice Scarf"
			? 1.5
			: // iron ball
			item === "Iron Ball"
				? 0.5
				: 1;
	return Math.round(
		Math.trunc(baseSpeed * stageMultiplier * (4096 * itemModifier)) / 4096 -
		0.001,
	);
}

function getStageMultiplier(stage: number) {
	if (stage > 0) {
		return (2 + stage) / 2;
	}
	return 2 / (2 - stage);
}

function weightModifier(base: number, ability?: Ability) {
	const abilityModifier =
		// Heavy Metal
		ability === "Heavy Metal"
			? 2
			: // Light Metal
			ability === "Light Metal"
				? 0.5
				: 1;
	return base * abilityModifier;
}
