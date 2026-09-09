import type { Pokemon } from "../pokemon";
import { isTerapagosStellar } from "../pokemon/utils";
import type { BattleFieldStatus, Move } from "./config";
import { isGrounded } from "./utils";

export function getEffectiveMoveTarget(
	attacker: Pokemon,
	move: Move,
	field?: BattleFieldStatus,
): Move["target"] {
	if (move.id === 797 && field?.terrain === "Psychic" && isGrounded(attacker)) {
		return "allAdjacentFoes";
	}
	if (move.id === 906 && isTerapagosStellar(attacker)) {
		return "allAdjacentFoes";
	}
	return move.target;
}
