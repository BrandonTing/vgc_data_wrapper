import { expect, test } from "bun:test";
import { Battle, createMove } from "../../src";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

// offensive
test("Choice Band & Choice Spec", () => {
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		baseStat: {
			hp: 55,
			defense: 55,
			specialAttack: 135,
		},
		effortValues: {
			specialAttack: 252,
		},
		item: "Choice Specs",
	});
	const incineroar = genTestMon({
		types: ["Dark", "Fire"],
		stats: {
			hp: 170,
			attack: 135,
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
	const actual = getDamangeNumberFromResult(battle.getDamage());

	const expected = [
		136, 138, 139, 142, 144, 145, 147, 148, 150, 151, 153, 154, 156, 157, 159,
		162,
	];
	expect(actual).toEqual(expected);
	const flareBlitz = createMove({
		base: 120,
		type: "Fire",
	});
	battle.swapPokemons();
	battle.move = flareBlitz;
	const expectedFlareBlitzDmg = [
		123, 124, 126, 127, 129, 130, 132, 133, 135, 136, 138, 139, 141, 142, 144,
		145,
	];
	const actualFlareBlitzDmg = getDamangeNumberFromResult(battle.getDamage());
	expect(actualFlareBlitzDmg).toEqual(expectedFlareBlitzDmg);
	incineroar.item = "Choice Band";
	const expectedFlareBlitzDmgWithCB = [
		183, 184, 187, 189, 192, 193, 196, 198, 199, 202, 204, 207, 208, 211, 213,
		216,
	];
	const actualFlareBlitzDmgWithCB = getDamangeNumberFromResult(
		battle.getDamage(),
	);
	expect(actualFlareBlitzDmgWithCB).toEqual(expectedFlareBlitzDmgWithCB);
});
test("Type enhancing", () => {
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		baseStat: {
			specialAttack: 135,
		},
		effortValues: {
			specialAttack: 252,
		},
		item: "Type Enhancing",
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
	const actual = getDamangeNumberFromResult(battle.getDamage());

	const expected = [
		109, 111, 112, 114, 115, 117, 118, 120, 120, 121, 123, 124, 126, 127, 129,
		130,
	];
	expect(actual).toEqual(expected);
});
test("life orb", () => {
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		baseStat: {
			specialAttack: 135,
		},
		effortValues: {
			specialAttack: 252,
		},
		item: "Life Orb",
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
	const actual = getDamangeNumberFromResult(battle.getDamage());

	const expected = [
		121, 121, 122, 125, 125, 126, 129, 130, 130, 133, 134, 137, 137, 138, 140,
		142,
	];
	expect(actual).toEqual(expected);
});
// defensive
test("Assult vest", () => {
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
		item: "Assault Vest",
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
	const actual = getDamangeNumberFromResult(battle.getDamage());
	const expected = [
		61, 63, 63, 64, 64, 66, 66, 67, 67, 69, 69, 70, 70, 72, 72, 73,
	];
	expect(actual).toEqual(expected);
});

test("Eviolite", () => {
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		baseStat: {
			specialAttack: 135,
		},
		effortValues: {
			specialAttack: 252,
		},
	});
	const porygon2 = genTestMon({
		types: ["Normal"],
		stats: {
			specialDefense: 115,
		},
		item: "Eviolite",
	});
	porygon2.setFlags({
		hasEvolution: true,
	});
	const moonblast = createMove({
		type: "Fairy",
		base: 95,
		category: "Special",
	});
	const expected = [
		58, 60, 60, 61, 61, 63, 63, 64, 64, 66, 66, 67, 67, 69, 69, 70,
	];
	const battle = new Battle({
		attacker: flutterMane,
		defender: porygon2,
		move: moonblast,
	});
	const actual = getDamangeNumberFromResult(battle.getDamage());
	expect(actual).toEqual(expected);
});

test("Type Halving berry", () => {
	const flutterMane = genTestMon({
		types: ["Fairy", "Ghost"],
		baseStat: {
			specialAttack: 135,
		},
		effortValues: {
			specialAttack: 252,
		},
	});
	const baxcalibur = genTestMon({
		types: ["Ice", "Dragon"],
		stats: {
			specialDefense: 106,
		},
		item: "Type Berry",
	});
	const moonblast = createMove({
		type: "Fairy",
		base: 95,
		category: "Special",
	});
	const expected = [
		94, 96, 97, 99, 99, 100, 102, 103, 103, 105, 106, 108, 108, 109, 111, 112,
	];
	const battle = new Battle({
		attacker: flutterMane,
		defender: baxcalibur,
		move: moonblast,
	});
	const actual = getDamangeNumberFromResult(battle.getDamage());
	expect(actual).toEqual(expected);
});
