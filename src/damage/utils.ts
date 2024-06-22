import type { Pokemon } from "../pokemon";
import type { TemporalFactor } from "./battle";
import type { Move, Stat, TeraTypes, Type } from "./config";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function pipeModifierHelper<T, U extends (...args: any) => T>(
	initValue: T,
	modifiers: Array<U>,
	operation: (value: T, modifier: U) => T,
): T {
	return modifiers.reduce(operation, initValue);
}

export function checkStatOfMoveCategoryIsHighest(category: Move["category"], stat: Stat) {
	const target = category === "Physical" ? "attack" : "specialAttack"
	const { hp, ...statExcludeHp } = stat;
	return Math.max(...Object.values(statExcludeHp)) === stat[target];
}

export function checkMatchType(pokemon: Pokemon, type: Type): boolean {
	return getPokemonCurrentType(pokemon).includes(type);
}

export function getPokemonCurrentType(pokemon: Pokemon): Array<TeraTypes> {
	return pokemon.isTera ? [pokemon.teraType] : pokemon.types;
}

export function checkTeraWIthTypeMatch(
	pokemon: Pokemon,
	type: TeraTypes,
): boolean {
	return pokemon.isTera && type === pokemon.teraType;
}

function mergeFactors(factors: TemporalFactor["factors"], newFactors: TemporalFactor["factors"]): TemporalFactor["factors"] {
	return {
		attacker: {
			...factors?.attacker,
			...newFactors?.attacker
		},
		defender: {
			...factors?.defender,
			...newFactors?.defender
		},
		move: {
			...factors?.move,
			...newFactors?.move
		},
		field: {
			...factors?.field,
			...newFactors?.field
		},
	}
}
export function mergeFactorList(...factorList: Array<TemporalFactor["factors"]>): TemporalFactor["factors"] {
	return factorList.reduce((pre, cur) => {
		return mergeFactors(pre, cur)
	}, {} as TemporalFactor["factors"])
}