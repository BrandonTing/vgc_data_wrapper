import type { BattleFieldStatus, Move } from "./config";
import type { Pokemon } from "./pokemon";

export function getBasePower(
	attacker: Pokemon,
	defender: Pokemon,
	move: Move,
	field?: BattleFieldStatus,
) {
	// ====== Terrain Related
	if (
		// Hydro Steam
		(move.id === 875 && field?.weather === "Sun") ||
		// Psyblade
		(move.id === 876 && field?.terrain === "Electric") ||
		// Misty Explosion
		(move.id === 802 && field?.terrain === "Misty")
	) {
		return move.base * 1.5;
	}
	// earthquake & bulldoze
	if ((move.id === 89 || move.id === 523) && field?.terrain === "Grassy") {
		return move.base / 2;
	}
	// terrain pulse
	if (move.id === 805 && field?.terrain) {
		return 100;
	}
	// ====== Speed Related
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
			return 150;
		}
		if (ratio >= 3) {
			return 120;
		}
		if (ratio >= 2) {
			return 80;
		}
		if (ratio >= 1) {
			return 60;
		}
		return 40;
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
		return Math.min(
			Math.max(Math.trunc((25 * defenderSpeed) / attackerSpeed), 1),
			150,
		);
	}
	// ====== Weight related
	// grass knot & low kick
	if (move.id === 447 || move.id === 67) {
		const defenderWeight = weightModifier(defender.weight, defender.abilityId);
		if (defenderWeight >= 200) {
			return 120;
		}
		if (defenderWeight >= 100) {
			return 100;
		}
		if (defenderWeight >= 50) {
			return 80;
		}
		if (defenderWeight >= 25) {
			return 60;
		}
		if (defenderWeight >= 10) {
			return 40;
		}
		return 20;
	}

	if (
		// heat crash
		move.id === 535 ||
		// heavy slam
		move.id === 484
	) {
		const attackerWeight = weightModifier(attacker.weight, attacker.abilityId);
		const defenderWeight = weightModifier(defender.weight, defender.abilityId);
		return 20 + Math.min(Math.floor(attackerWeight / defenderWeight), 5) * 20;
	}
	// ====== others
	// weather ball
	if (move.id === 311 && field?.weather) {
		return 100;
	}
	// tera blast
	if (move.id === 851 && attacker.teraType === "Stellar") {
		return 100;
	}
	// Power Trip & Stored Power
	if (move.id === 500 || move.id === 681) {
		const counters = Object.values(attacker.statStage)
			.filter((stage) => stage > 0)
			.reduce((pre, cur) => {
				return pre + cur;
			}, 0);
		return 20 * (1 + counters);
	}
	return move.base;
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

function weightModifier(base: number, abilityId: number) {
	const abilityModifier =
		// Heavy Metal
		abilityId === 1
			? 2
			: // Light Metal
			  abilityId === 2
			  ? 0.5
			  : 1;
	return base * abilityModifier;
}
