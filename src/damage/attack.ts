import type { BattleStatus } from "./config";
import {
	checkAtkIsHighest,
	modifyStatByStageChange,
	pipeModifierHelper,
} from "./utils";

export function getAttack({
	attacker,
	defender,
	move,
	field,
}: BattleStatus): number {
	let atkStat =
		move.category === "Physical"
			? attacker.getStat("attack")
			: attacker.getStat("specialAttack");
	let stageChanges =
		move.category === "Physical"
			? attacker.statStage.attack
			: attacker.statStage.specialAttack;
	// body press
	if (move.id === 776) {
		atkStat = attacker.getStat("defense");
		stageChanges = attacker.statStage.defense;
	}
	// foul play
	if (move.id === 492) {
		atkStat = defender.getStat("attack");
		stageChanges = defender.statStage.attack;
	}

	if (!move.flags?.isCriticalHit) {
		atkStat = modifyStatByStageChange(atkStat, stageChanges);
	}
	const option = {
		attacker,
		defender,
		move,
		field,
	};
	const result = Math.round(
		(atkStat *
			pipeModifierHelper(
				4096 as number,
				[
					modifyAtkByAttackAbility,
					modifyByDefenderAbility,
					modifyByItem,
					modifyByRuin,
				],
				(pre, cur) => {
					return Math.round(pre * cur(option));
				},
			)) /
		4096 -
		0.001,
	);

	return result;
}
function modifyAtkByAttackAbility({
	attacker,
	move,
	field,
}: Pick<BattleStatus, "attacker" | "field" | "move">) {
	const { ability } = attacker;
	// Quark Drive & Protosynthesis
	if (
		((ability === "Quark Drive" &&
			(attacker.item === "Booster Energy" || field?.terrain === "Electric")) ||
			(ability === "Protosynthesis" &&
				(attacker.item === "Booster Energy" || field?.weather === "Sun"))) &&
		((move.category === "Physical" &&
			checkAtkIsHighest(attacker.getStats(), "attack")) ||
			(move.category === "Special" &&
				checkAtkIsHighest(attacker.getStats(), "specialAttack")))
	) {
		return 1.3;
	}
	// Orichalcum Pulse
	if (
		ability === "Orichalcum Pulse" &&
		move.category === "Physical" &&
		field?.weather === "Sun"
	) {
		return 1.333;
	}
	// Hadron Engine
	if (
		ability === "Hadron Engine" &&
		move.category === "Special" &&
		field?.terrain === "Electric"
	) {
		return 1.333;
	}
	// Transistor
	if (ability === "Transistor" && move.type === "Electric") {
		return 1.33;
	}
	// Overgrow & Blaze & Torrent & Swarm
	if (
		(ability === "Overgrow" && move.type === "Grass") ||
		(ability === "Blaze" && move.type === "Fire") ||
		(ability === "Torrent" && move.type === "Water") ||
		(ability === "Swarm" && move.type === "Bug")
	) {
		return 1.5;
	}
	// Flash Fire
	if (ability === "Flash Fire" && move.type === "Fire") {
		return 1.5;
	}
	// Solar power
	if (
		ability === "Solar Power" &&
		field?.weather === "Sun" &&
		move.category === "Special"
	) {
		return 1.5;
	}
	// Plus / Minus
	if (ability === "Plus Minus" && move.category === "Special") {
		return 1.5;
	}
	// Guts
	if (
		ability === "Guts" &&
		move.category === "Physical" &&
		attacker.status === "Burned"
	) {
		return 1.5;
	}
	// Rocky Payload
	if (ability === "Rocky Payload" && move.type === "Rock") {
		return 1.5;
	}
	// Dragon Maw
	if (ability === "Dragon's Maw" && move.type === "Dragon") {
		return 1.5;
	}
	// Huge Power & Pure Power
	if (
		(ability === "Huge Power" || ability === "Pure Power") &&
		move.category === "Physical"
	) {
		return 2;
	}
	// Stakeout
	if (ability === "Stakeout") {
		return 2;
	}
	// Water Bubble
	if (ability === "Water Bubble" && move.type === "Water") {
		return 2;
	}
	return 1;
}
function modifyByDefenderAbility({
	defender: { ability },
	move: { type },
}: Pick<BattleStatus, "defender" | "move">): number {
	// Thick Fat
	if (ability === "Thick Fat" && (type === "Fire" || type === "Ice")) {
		return 0.5;
	}
	// Purifying Salt
	if (ability === "Purifying Salt" && type === "Ghost") {
		return 0.5;
	}
	// Water Bubble
	if (ability === "Water Bubble" && type === "Fire") {
		return 0.5;
	}
	return 1;
}
function modifyByItem({
	attacker: { item, id, name },
	move: { category },
}: Pick<BattleStatus, "attacker" | "move">) {
	// Choice item
	if (
		(item === "Choice Band" && category === "Physical") ||
		(item === "Choice Specs" && category === "Special")
	) {
		return 1.5;
	}
	// Light Ball on Pikachu
	if ((id === 25 || name?.toLowerCase() === "pikachu") && item === "Light Ball") {
		return 2;
	}
	return 1;
}
function modifyByRuin({
	attacker,
	move,
	field,
}: Pick<BattleStatus, "move" | "field" | "attacker">) {
	// ruin ability doesn't affect owner
	// Tablets
	if (
		field?.ruin?.includes("Tablets") &&
		move.category === "Physical" &&
		attacker.ability !== "Tablets of Ruin"
	) {
		return 0.75;
	}
	// Vessel
	if (
		field?.ruin?.includes("Vessel") &&
		move.category === "Special" &&
		attacker.ability !== "Vessel of Ruin"
	) {
		return 0.75;
	}
	return 1;
}
