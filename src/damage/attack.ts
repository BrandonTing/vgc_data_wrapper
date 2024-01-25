import type { BattleFieldStatus, BattleStatus, Move, Pokemon } from "./config";
import {
	checkAtkIsHighest,
	modifyStatByStageChange,
	pipeModifierHelper,
} from "./utils";

export function getAttack(
	attacker: Pokemon,
	defender: Pokemon,
	move: Move,
	field: BattleFieldStatus,
): number {
	let atkStat =
		move.category === "Physical"
			? attacker.stat.attack
			: attacker.stat.specialAttack;
	let stageChanges =
		move.category === "Physical"
			? attacker.statStage.attack
			: attacker.statStage.specialAttack;
	// body press
	if (move.id === 776) {
		atkStat = attacker.stat.defense;
		stageChanges = attacker.statStage.defense;
	}
	// foul play
	if (move.id === 492) {
		atkStat = defender.stat.attack;
		stageChanges = defender.stat.attack;
	}

	if (!attacker.flags?.criticalHit) {
		atkStat = modifyStatByStageChange(atkStat, stageChanges);
	}
	const result = Math.round(
		(atkStat *
			pipeModifierHelper(
				4096,
				[
					modifyAtkByAttackAbility,
					modifyByDefenderAbility,
					modifyByItem,
					modifyByRuin,
				],
				{
					attacker,
					defender,
					move,
					field,
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
	const { abilityId } = attacker;
	// Quark Drive & Protosynthesis
	if (
		((abilityId === 282 &&
			(attacker.item === "Booster Energy" || field.terrain === "Electric")) ||
			(abilityId === 281 &&
				(attacker.item === "Booster Energy" || field.weather === "Sun"))) &&
		((move.category === "Physical" &&
			checkAtkIsHighest(attacker.stat, "attack")) ||
			(move.category === "Special" &&
				checkAtkIsHighest(attacker.stat, "specialAttack")))
	) {
		return 1.3;
	}
	// Orichalcum Pulse
	if (
		abilityId === 288 &&
		move.category === "Physical" &&
		field.weather === "Sun"
	) {
		return 1.333;
	}
	// Hadron Engine
	if (
		abilityId === 289 &&
		move.category === "Special" &&
		field.terrain === "Electric"
	) {
		return 1.333;
	}
	// Transistor
	if (abilityId === 262 && move.type === "Electric") {
		return 1.33;
	}
	// Overgrow & Blaze & Torrent & Swarm
	if (
		(abilityId === 65 && move.type === "Grass") ||
		(abilityId === 66 && move.type === "Fire") ||
		(abilityId === 67 && move.type === "Water") ||
		(abilityId === 68 && move.type === "Bug")
	) {
		return 1.5;
	}
	// Flash Fire
	if (abilityId === 18 && move.type === "Fire") {
		return 1.5;
	}
	// Solar power
	if (
		abilityId === 94 &&
		field.weather === "Sun" &&
		move.category === "Special"
	) {
		return 1.5;
	}
	// Plus / Minus
	if ((abilityId === 57 || abilityId === 58) && move.category === "Special") {
		return 1.5;
	}
	// Guts
	if (
		abilityId === 62 &&
		move.category === "Physical" &&
		attacker.status === "Burned"
	) {
		return 1.5;
	}
	// Rocky Payload
	if (abilityId === 276 && move.type === "Rock") {
		return 1.5;
	}
	// Dragon Maw
	if (abilityId === 263 && move.type === "Dragon") {
		return 1.5;
	}
	// Huge Power & Pure Power
	if ((abilityId === 37 || abilityId === 74) && move.category === "Physical") {
		return 2;
	}
	// Stakeout
	if (abilityId === 198) {
		return 2;
	}
	return 1;
}
function modifyByDefenderAbility({
	defender: { abilityId },
	move: { type },
}: Pick<BattleStatus, "defender" | "move">): number {
	// Thick Fat
	if (abilityId === 47 && (type === "Fire" || type === "Ice")) {
		return 0.5;
	}
	// Purifying Salt
	if (abilityId === 272 && type === "Ghost") {
		return 0.5;
	}
	return 1;
}
function modifyByItem({
	attacker: { item, id },
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
	if (id === 25 && item === "Light Ball") {
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
		field.ruin === "Tablets" &&
		move.category === "Physical" &&
		attacker.abilityId !== 286
	) {
		return 0.75;
	}
	// Vessel
	if (
		field.ruin === "Vessel" &&
		move.category === "Special" &&
		attacker.abilityId !== 284
	) {
		return 0.75;
	}
	return 1;
}
