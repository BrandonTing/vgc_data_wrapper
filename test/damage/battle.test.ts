import { expect, test } from "bun:test";
import { Battle } from "../../src/damage/bettle";
import { genTestMon, genTestMove } from "./utils";

test("test STAB", () => {
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
	const thunderbolt = genTestMove({
		type: "Electric",
		base: 90,
		category: "Special",
	});
	const expected = [
		48, 49, 49, 50, 50, 51, 51, 52, 53, 53, 54, 54, 55, 55, 56, 57,
	];
	const battle = new Battle({
		attacker: flutterMane,
		defender: incineroar,
		move: thunderbolt,
	});
	const actual = battle.getDamage();
	expect(actual.rolls.map(({ number }) => number)).toEqual(expected);

	const moonblast = genTestMove({
		type: "Fairy",
		base: 95,
		category: "Special",
	});
	battle.move = moonblast;
	const expectedWithSTAB = [
		76, 76, 78, 78, 79, 81, 81, 82, 82, 84, 85, 85, 87, 87, 88, 90,
	];
	const actualWithSTAB = battle.getDamage();
	expect(actualWithSTAB.rolls.map(({ number }) => number)).toEqual(
		expectedWithSTAB,
	);
});

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
	const moonblast = genTestMove({
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
	expect(actualWhenPlus1C.rolls.map(({ number }) => number)).toEqual(
		expectedWhenPlus1C,
	);

	// test -c
	flutterMane.statStage.specialAttack = -1;
	const expectedWhenMinus1C = [
		51, 52, 52, 54, 54, 54, 55, 55, 57, 57, 57, 58, 58, 60, 60, 61,
	];
	const actualWhenMinus1C = battle.getDamage();
	expect(actualWhenMinus1C.rolls.map(({ number }) => number)).toEqual(
		expectedWhenMinus1C,
	);
	flutterMane.statStage.specialAttack = 0;

	// test +d from defender
	incineroar.statStage.specialDefense = 1;
	const expectedWhenPlus1D = [
		51, 52, 52, 54, 54, 54, 55, 55, 57, 57, 57, 58, 58, 60, 60, 61,
	];
	const actualWhenPlus1D = battle.getDamage();
	expect(actualWhenPlus1D.rolls.map(({ number }) => number)).toEqual(
		expectedWhenPlus1D,
	);

	// test d from defender
	incineroar.statStage.specialDefense = -1;
	const expectedWhenMinus1D = [
		114, 115, 117, 118, 120, 121, 121, 123, 124, 126, 127, 129, 130, 132, 133,
		135,
	];
	const actualWhenMinus1D = battle.getDamage();
	expect(actualWhenMinus1D.rolls.map(({ number }) => number)).toEqual(
		expectedWhenMinus1D,
	);
});