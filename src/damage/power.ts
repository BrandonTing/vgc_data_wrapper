import { getBasePower } from "./basePower";
import type { BattleStatus } from "./config";
import { checkMatchType, pipeModifierHelper } from "./utils";

export function getPower(option: BattleStatus): number {
	const basePower = getBasePower(
		option.attacker,
		option.defender,
		option.move,
		option.field,
	);
	const modifierAfterModification = pipeModifierHelper(
		4096,
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
		option,
	);
	const result = Math.round(
		(basePower * modifierAfterModification) / 4096 - 0.001,
	);
	if (
		option.attacker.teraType === option.move.type &&
		result < 60 &&
		!option.move.flags?.isMultihit &&
		!option.move.flags?.isPriority &&
		option.move.id !== 512
	) {
		return 60;
	}
	return result;
}

function modifyByAttackerAbility({
	attacker,
	defender,
	move,
	field,
}: BattleStatus): number {
	// Rivalry
	if (attacker.abilityId === 79) {
		if (defender.gender === "Unknown") return 1;
		if (attacker.gender === defender.gender) return 1.25;
		return 0.75;
	}
	// Supreme Overlord
	if (attacker.abilityId === 293) {
		return 1 + 0.1 * (field.downCounts ?? 0);
	}
	// skins
	if (
		// Normalize
		attacker.abilityId === 96 ||
		// Refrigerate
		attacker.abilityId === 174 ||
		// Pixilate
		attacker.abilityId === 182 ||
		// Aerilate
		attacker.abilityId === 184 ||
		// Galvanize
		attacker.abilityId === 206
	) {
		return 1.2;
	}
	// iron fist
	if (attacker.abilityId === 89 && move.flags?.isPunch) {
		return 1.2;
	}
	// reckless
	if (attacker.abilityId === 120 && move.flags?.hasRecoil) {
		return 1.2;
	}
	// Analytic
	if (attacker.abilityId === 148) {
		return 1.3;
	}
	// sheer force
	if (attacker.abilityId === 125 && move.flags?.hasSecondary) {
		return 1.3;
	}
	// Tough Claws
	if (attacker.abilityId === 181 && move.flags?.isContact) {
		return 1.3;
	}
	// Sand Force
	if (
		attacker.abilityId === 159 &&
		(move.type === "Rock" || move.type === "Steel" || move.type === "Ground") &&
		field.weather === "Sand"
	) {
		return 1.3;
	}
	// Punk Rock
	if (attacker.abilityId === 244 && move.flags?.isSound) {
		return 1.3;
	}
	// Sharpness
	if (attacker.abilityId === 292 && move.flags?.isSlicing) {
		return 1.5;
	}
	// Technician
	if (attacker.abilityId === 101 && move.base <= 60) {
		return 1.5;
	}
	// Strong Jaw
	if (attacker.abilityId === 173 && move.flags?.isBite) {
		return 1.5;
	}
	// Mega Launcher
	if (attacker.abilityId === 178 && move.flags?.isPulse) {
		return 1.5;
	}
	// Flare Boost
	if (
		attacker.abilityId === 138 &&
		attacker.status === "Burned" &&
		move.category === "Special"
	) {
		return 1.5;
	}
	// Toxic Boost
	if (
		attacker.abilityId === 137 &&
		(attacker.status === "Poisoned" || attacker.status === "Badly Poisoned") &&
		move.category === "Physical"
	) {
		return 1.5;
	}
	return 1;
}

function modifyByDefenderAbility({
	defender,
	move,
}: Pick<BattleStatus, "defender" | "move">): number {
	if (defender.abilityId === 87 && move.type === "Fire") {
		return 1.25;
	}
	if (defender.abilityId === 85 && move.type === "Fire") {
		return 0.5;
	}
	return 1;
}

function modifyByItem({
	attacker: { item },
	move,
}: Pick<BattleStatus, "attacker" | "move">): number {
	if (item === "Muscle Band" && move.category === "Physical") {
		return 1.1;
	}
	if (item === "Wise Glasses" && move.category === "Special") {
		return 1.1;
	}
	if (item === "Punching Glove" && move.flags?.isPunch) {
		return 1.1;
	}
	if (item === "Type Enhancing" || item === "Ogerpon Mask") {
		return 1.2;
	}
	if (item === "Normal Gem" && move.type === "Normal") {
		return 1.3;
	}
	return 1;
}

function modifyByMoveEffect({
	attacker,
	defender,
	move,
	field,
}: BattleStatus): number {
	// Expanding Force
	if (move.id === 797 && field.terrain === "Psychic") {
		return 1.5;
	}
	// solar beam & solar blade
	if (
		(move.id === 76 || move.id === 669) &&
		field.weather &&
		field.weather !== "Sun"
	) {
		return 0.5;
	}
	// Facade
	if (move.id === 263 && attacker.status === "Burned") {
		return 2;
	}
	// Knock off
	if (move.id === 282 && defender.item) {
		return 1.5;
	}
	// Rising Voltage
	if (move.id === 804 && field.terrain === "Electric") {
		if (checkMatchType(defender, "Flying")) {
			return 1;
		}
		return 2;
	}
	return 1;
}

function modifyByHelpingHand({
	attacker,
}: Pick<BattleStatus, "attacker">): number {
	return attacker.flags?.helpingHand ? 1.5 : 1;
}

function modifyByPowerSpot({
	attacker,
}: Pick<BattleStatus, "attacker">): number {
	return attacker.flags?.powerSpot ? 1.3 : 1;
}

function modifyBySteelySpirit({
	attacker,
}: Pick<BattleStatus, "attacker">): number {
	return attacker.flags?.steelySpirit ? 1.5 : 1;
}

function modifyByCharge({
	attacker,
	move,
}: Pick<BattleStatus, "attacker" | "move">): number {
	return attacker.flags?.charge && move.type === "Electric" ? 2 : 1;
}

function modifyByTerrain({
	move,
	field: { terrain },
}: Pick<BattleStatus, "move" | "field">): number {
	if (
		(move.type === "Electric" && terrain === "Electric") ||
		(move.type === "Psychic" && terrain === "Psychic") ||
		(move.type === "Grass" && terrain === "Grassy")
	) {
		return 1.3;
	}
	if (move.type === "Dragon" && terrain === "Misty") {
		return 0.5;
	}
	return 1;
}

function modifyByAura({
	move,
	field: { aura },
}: Pick<BattleStatus, "move" | "field">): number {
	return (move.type === "Dark" && aura === "Dark") ||
		(move.type === "Fairy" && aura === "Fairy")
		? 1.33
		: 1;
}
