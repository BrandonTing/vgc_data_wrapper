import { expect, test } from "bun:test";
import { createMove } from "../../src";
import { Battle } from "../../src/damage/battle";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

test("test stage changes", () => {
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		stats: {
			specialAttack: 155,
		},
		statStage: {
			specialAttack: 1,
		},
	});
	const incineroar = genTestMon({
		types: ["Dark", "Fire"],
		stats: {
			hp: 170,
			specialDefense: 110,
		},
	});
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
	// test +c
	const expectedWhenPlus1C = [
		114, 115, 117, 118, 120, 121, 121, 123, 124, 126, 127, 129, 130, 132, 133,
		135,
	];
	const actualWhenPlus1C = battle.getDamage();
	expect(getDamangeNumberFromResult(actualWhenPlus1C)).toEqual(
		expectedWhenPlus1C,
	);

	// test -c
	flutterMane.statStage.specialAttack = -1;
	const expectedWhenMinus1C = [
		51, 52, 52, 54, 54, 54, 55, 55, 57, 57, 57, 58, 58, 60, 60, 61,
	];
	const actualWhenMinus1C = battle.getDamage();
	expect(getDamangeNumberFromResult(actualWhenMinus1C)).toEqual(
		expectedWhenMinus1C,
	);
	flutterMane.statStage.specialAttack = 0;

	// test +d from defender
	incineroar.statStage.specialDefense = 1;
	const expectedWhenPlus1D = [
		51, 52, 52, 54, 54, 54, 55, 55, 57, 57, 57, 58, 58, 60, 60, 61,
	];
	const actualWhenPlus1D = battle.getDamage();
	expect(getDamangeNumberFromResult(actualWhenPlus1D)).toEqual(
		expectedWhenPlus1D,
	);

	// test d from defender
	incineroar.statStage.specialDefense = -1;
	const expectedWhenMinus1D = [
		114, 115, 117, 118, 120, 121, 121, 123, 124, 126, 127, 129, 130, 132, 133,
		135,
	];
	const actualWhenMinus1D = battle.getDamage();
	expect(getDamangeNumberFromResult(actualWhenMinus1D)).toEqual(
		expectedWhenMinus1D,
	);
});

// Test Crit hit
test("test critical hit", () => {
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		stats: {
			specialAttack: 155,
		},
		statStage: {
			specialAttack: -1,
		},
	});
	const incineroar = genTestMon({
		types: ["Dark", "Fire"],
		stats: {
			hp: 170,
			specialDefense: 110,
		},
	});
	const moonblast = createMove({
		type: "Fairy",
		base: 95,
		category: "Special",
		flags: {
			isCriticalHit: true,
		},
	});
	const battle = new Battle({
		attacker: flutterMane,
		defender: incineroar,
		move: moonblast,
	});
	const actual = [
		114, 115, 117, 118, 120, 121, 121, 123, 124, 126, 127, 129, 130, 132, 133,
		135,
	];

	let damage = battle.getDamage();
	expect(getDamangeNumberFromResult(damage)).toEqual(actual);
	expect(damage.factors.move.isCriticalHit).toBe(true);

	// ignore positive change on defensive side
	incineroar.statStage.specialDefense = 6;
	damage = battle.getDamage();
	expect(getDamangeNumberFromResult(damage)).toEqual(actual);
	expect(damage.factors.move.isCriticalHit).toBe(true);
});

// Test sacred sword
test("test sacred sword", () => {
	const zacian = genTestMon({
		types: ["Fairy", "Steel"],
		stats: {
			attack: 170,
		},
	});
	const incineroar = genTestMon({
		types: ["Dark", "Fire"],
		stats: {
			hp: 170,
			defense: 110,
		},
		statStage: {
			defense: 6,
		},
	});
	const sacredSword = createMove({
		type: "Fighting",
		base: 90,
		category: "Physical",
		id: 533,
	});
	const battle = new Battle({
		attacker: zacian,
		defender: incineroar,
		move: sacredSword,
	});
	const actual = [
		106, 108, 108, 110, 112, 112, 114, 114, 116, 118, 118, 120, 122, 122, 124,
		126,
	];

	const damage = battle.getDamage();
	expect(getDamangeNumberFromResult(damage)).toEqual(actual);
});
