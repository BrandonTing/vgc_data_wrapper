import type { Pokemon, Stat, Type, TypesWithStellar } from "./config";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function pipeModifierHelper<T, U extends (...args: any) => T>(
	initValue: T,
	modifiers: Array<U>,
	operation: (value: T, modifier: U) => T,
): T {
	return modifiers.reduce(operation, initValue);
}

export function checkAtkIsHighest(stat: Stat, target: keyof Stat) {
	return Math.max(...Object.values(stat)) === stat[target];
}

export function modifyStatByStageChange(
	stat: number,
	stageChange: number,
): number {
	return stageChange > 0
		? (stat * (2 + stageChange)) / 2
		: (stat * 2) / (2 - stageChange);
}

export function checkMatchType(pokemon: Pokemon, type: Type): boolean {
	return pokemon.type.includes(type) || pokemon.teraType === type;
}

export function getPokemonCurrentType(
	pokemon: Pokemon,
): Array<TypesWithStellar> {
	return pokemon.teraType ? [pokemon.teraType] : pokemon.type;
}
