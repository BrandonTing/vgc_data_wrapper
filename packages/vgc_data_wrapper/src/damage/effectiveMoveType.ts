import type { Pokemon } from "../pokemon";
import type { Ability } from "../pokemon/typeHelper";
import type { BattleFieldStatus, Move, TeraTypes, Type } from "./config";
import { isGrounded } from "./utils";

const SKIN_ABILITY_TYPES: Partial<Record<Ability, Type>> = {
	Pixilate: "Fairy",
	Refrigerate: "Ice",
	Aerilate: "Flying",
	Dragonize: "Dragon",
	Galvanize: "Electric",
};

const TERRAIN_PULSE_TYPES = {
	Electric: "Electric",
	Grassy: "Grass",
	Misty: "Fairy",
	Psychic: "Psychic",
} as const satisfies Record<NonNullable<BattleFieldStatus["terrain"]>, Type>;

export function getEffectiveMoveType(
	attacker: Pokemon,
	move: Move,
	field?: BattleFieldStatus,
): TeraTypes {
	if (move.id === 805 && field?.terrain && isGrounded(attacker)) {
		return TERRAIN_PULSE_TYPES[field.terrain];
	}
	const skinAbilityMoveType = getSkinAbilityMoveType(attacker, move);
	if (skinAbilityMoveType) return skinAbilityMoveType;
	if (move.type === "Stellar") return "Stellar";
	return move.type;
}

export function getSkinAbilityMoveType(
	attacker: Pokemon,
	move: Move,
): Type | undefined {
	return move.type === "Normal" && attacker.ability
		? SKIN_ABILITY_TYPES[attacker.ability]
		: undefined;
}
