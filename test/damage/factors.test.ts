import { expect, test } from "bun:test";
import { Battle, createMove } from "../../src";
import { genTestMon } from "./utils";

test("weather should be counted when fire move in sun", () => {
	const char = genTestMon();
	const venu = genTestMon();
	const move = createMove({
		type: "Fire",
	});
	const battle = new Battle({
		attacker: char,
		defender: venu,
		move,
		field: {
			weather: "Sun",
		},
	});
	const damage = battle.getDamage();
	expect(damage.factors.attacker.weather).toBe(true);
});

test("weather should be counted when fire move in rain", () => {
	const char = genTestMon();
	const venu = genTestMon();
	const move = createMove({
		type: "Fire",
	});
	const battle = new Battle({
		attacker: char,
		defender: venu,
		move,
		field: {
			weather: "Rain",
		},
	});
	const damage = battle.getDamage();
	expect(damage.factors.defender.weather).toBe(true);
});
