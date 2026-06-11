import type { Pokemon } from "../pokemon";
import type { Ability } from "../pokemon/typeHelper";
import type { Move, TeraTypes, Type } from "./config";

const SKIN_ABILITY_TYPES: Partial<Record<Ability, Type>> = {
	Pixilate: "Fairy",
	Refrigerate: "Ice",
	Aerilate: "Flying",
	Dragonize: "Dragon",
	Galvanize: "Electric",
};

export function getEffectiveMoveType(attacker: Pokemon, move: Move): TeraTypes {
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
