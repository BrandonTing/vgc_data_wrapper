import type { StatRuleset } from "./base";

export const getMaxEvPerStat = (ruleset: StatRuleset) =>
	ruleset === "mainSeries" ? 252 : 32;

export const getMaxTotalEvs = (ruleset: StatRuleset) =>
	ruleset === "mainSeries" ? 510 : 66;

export const getSearchEvs = (ruleset: StatRuleset) => {
	const max = getMaxEvPerStat(ruleset);
	const step = ruleset === "mainSeries" ? 4 : 1;
	const values: number[] = [];
	for (let ev = 0; ev <= max; ev += step) values.push(ev);
	return values;
};
