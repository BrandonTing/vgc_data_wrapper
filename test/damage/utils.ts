import type { Move, Stat } from "../../src/damage/config";
import { Pokemon } from "../../src/pokemon";

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};

export function genTestStat(partial?: Partial<Stat>): Stat {
	return Object.assign(
		{
			hp: 100,
			attack: 100,
			defense: 100,
			specialAttack: 100,
			specialDefense: 100,
			speed: 100,
		} satisfies Stat,
		partial,
	);
}

export function genTestStatStage(
	partial?: Partial<Pokemon["statStage"]>,
): Pokemon["statStage"] {
	return Object.assign(
		{
			attack: 0,
			defense: 0,
			specialAttack: 0,
			specialDefense: 0,
			speed: 0,
		} satisfies Pokemon["statStage"],
		partial,
	);
}
function getTypeHelper(
	partialTypes?: RecursivePartial<Pokemon["types"]>,
): Pokemon["types"] {
	if (!partialTypes) return ["Normal"];
	return partialTypes.filter(Boolean);
}
export function genTestMon(partial?: RecursivePartial<Pokemon>): Pokemon {
	return new Pokemon({
		stats: genTestStat(partial?.stats),
		types: getTypeHelper(partial?.types),
		level: 50,
		statStage: genTestStatStage(partial?.statStage),
		weight: partial?.weight,
		abilityId: partial?.abilityId,
		item: partial?.item,
		teraType: partial?.teraType,
	});
}

export function genTestMove(partial?: Partial<Move>): Move {
	return Object.assign(
		{
			id: 0,
			base: 100,
			type: "Normal",
			category: "Physical",
			target: "selectedTarget",
		} satisfies Move,
		partial,
	);
}
