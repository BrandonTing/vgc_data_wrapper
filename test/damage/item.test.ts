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
