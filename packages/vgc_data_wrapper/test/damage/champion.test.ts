import { expect, test } from "bun:test";
import { createMove } from "../../src";
import { Battle } from "../../src/damage/battle";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

test("damage uses standard 16 damage rolls", () => {
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

	const battle = new Battle({
		attacker,
		defender,
		move,
	});
	const rolls = getDamangeNumberFromResult(battle.getDamage());
	expect(rolls).toHaveLength(16);
});

test("KO chance uses standard 16-roll denominator", () => {
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

	const result = new Battle({
		attacker,
		defender,
		move,
	}).getDamage();
	expect(result.rolls).toHaveLength(16);
	expect(result.koChance % 6.25).toBe(0);
});
