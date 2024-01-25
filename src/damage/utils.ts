import type { BattleStatus, Pokemon, Stat, Type } from "./config";

export function pipeModifierHelper(
	initValue: number,
	modifiers: Array<(arg: BattleStatus) => number>,
	options: BattleStatus,
): number {
	return modifiers.reduce((pre, cur) => {
		return Math.round(pre * cur(options));
	}, initValue);
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
