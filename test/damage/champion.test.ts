import { expect, test } from "bun:test";
import { createMove } from "../../src";
import { Battle } from "../../src/damage/battle";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

test("champion (default) uses standard 16 damage rolls", () => {
	const attacker = genTestMon({
		types: ["Normal"],
		baseStat: {
			specialAttack: 100,
		},
		effortValues: {
			specialAttack: 252,
		},
	});

	const defender = genTestMon({
		types: ["Normal"],
		stats: {
			hp: 100,
			specialDefense: 100,
		},
	});

	const move = createMove({
		type: "Normal",
		base: 100,
		category: "Special",
	});

	const battleChampion = new Battle({
		attacker,
		defender,
		move,
	});
	const battleNonChampion = new Battle({
		attacker,
		defender,
		move,
		isChampion: false,
	});

	const rollsChampion = getDamangeNumberFromResult(battleChampion.getDamage());
	const rollsNonChampion = getDamangeNumberFromResult(
		battleNonChampion.getDamage(),
	);

	expect(rollsChampion).toHaveLength(16);
	expect(rollsNonChampion).toHaveLength(16);
	expect(rollsChampion).toEqual(rollsNonChampion);
});

test("champion KO chance uses standard 16-roll denominator", () => {
	const attacker = genTestMon({
		types: ["Normal"],
		baseStat: {
			specialAttack: 100,
		},
		effortValues: {
			specialAttack: 252,
		},
	});

	const defender = genTestMon({
		types: ["Normal"],
		stats: {
			hp: 100,
			specialDefense: 100,
		},
	});

	const move = createMove({
		type: "Normal",
		base: 95,
		category: "Special",
	});

	const championResult = new Battle({
		attacker,
		defender,
		move,
		isChampion: true,
	}).getDamage();

	const nonChampionResult = new Battle({
		attacker,
		defender,
		move,
		isChampion: false,
	}).getDamage();

	expect(championResult.rolls).toHaveLength(16);
	expect(nonChampionResult.rolls).toHaveLength(16);
	expect(championResult.koChance).toBe(nonChampionResult.koChance);
});
