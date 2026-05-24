import { expect, test } from "bun:test";
import { createMove } from "../../src";
import { Battle } from "../../src/damage/battle";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

test("test STAB", () => {
	// test init with bs/ev & the other init with stat
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		baseStat: {
			specialAttack: 135,
		},
		effortValues: {
			specialAttack: 252,
		},
	});
	const incineroar = genTestMon({
		types: ["Dark", "Fire"],
		stats: {
			hp: 170,
			specialDefense: 110,
		},
	});
	const thunderbolt = createMove({
		type: "Electric",
		base: 90,
		category: "Special",
	});
	const expected = [
		58, 59, 60, 60, 61, 62, 62, 63, 64, 64, 65, 66, 66, 67, 68, 69,
	];
	const battle = new Battle({
		attacker: flutterMane,
		defender: incineroar,
		move: thunderbolt,
	});
	const actual = battle.getDamage();
	expect(getDamangeNumberFromResult(actual)).toEqual(expected);

	const moonblast = createMove({
		type: "Fairy",
		base: 95,
		category: "Special",
	});
	battle.move = moonblast;
	const expectedWithSTAB = [
		93, 93, 94, 96, 96, 97, 99, 100, 100, 102, 103, 105, 105, 106, 108, 109,
	];
	const actualWithSTAB = battle.getDamage();
	expect(getDamangeNumberFromResult(actualWithSTAB)).toEqual(expectedWithSTAB);
});

test("test offensive tera", () => {
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		stats: {
			specialAttack: 155,
		},
	});
	const incineroar = genTestMon({
		types: ["Dark", "Fire"],
		stats: {
			hp: 170,
			specialDefense: 110,
		},
	});
	const battle = new Battle({
		attacker: flutterMane,
		defender: incineroar,
	});
	// Tera STAB
	flutterMane.toggleTera({ isTera: true, type: "Fairy" });
	const moonblast = createMove({
		type: "Fairy",
		base: 95,
		category: "Special",
	});
	battle.move = moonblast;
	const actual = battle.getDamage();
	const expected = [
		102, 102, 104, 104, 106, 108, 108, 110, 110, 112, 114, 114, 116, 116, 118,
		120,
	];
	expect(getDamangeNumberFromResult(actual)).toEqual(expected);
	expect(actual.factors.attacker.isTera).toBe(true);
	// Tera non-STAB
	flutterMane.toggleTera({ isTera: true, type: "Electric" });
	const thunderbolt = createMove({
		type: "Electric",
		base: 90,
		category: "Special",
	});
	battle.move = thunderbolt;
	const expectedTbolt = [
		72, 73, 73, 75, 75, 76, 76, 78, 79, 79, 81, 81, 82, 82, 84, 85,
	];
	const actualTbolt = battle.getDamage();
	expect(getDamangeNumberFromResult(actualTbolt)).toEqual(expectedTbolt);
	expect(actualTbolt.factors.attacker.isTera).toBe(true);
});

test("defensive tera", () => {
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		stats: {
			specialAttack: 155,
		},
	});
	const incineroar = genTestMon({
		types: ["Dark", "Fire"],
		stats: {
			hp: 170,
			specialDefense: 110,
		},
	});
	incineroar.toggleTera({ isTera: true, type: "Fire" });

	const moonblast = createMove({
		type: "Fairy",
		base: 95,
		category: "Special",
	});

	const battle = new Battle({
		attacker: flutterMane,
		defender: incineroar,
		move: moonblast,
	});
	const damage = battle.getDamage();
	const actual = getDamangeNumberFromResult(damage);
	const expected = [
		38, 38, 39, 39, 39, 40, 40, 41, 41, 42, 42, 42, 43, 43, 44, 45,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.defender.isTera).toBe(true);
});
