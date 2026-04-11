import { expect, test } from "bun:test";
import {
	bundlerModuleNameResolver,
	isConstructorDeclaration,
} from "typescript";
import { Battle, createMove } from "../../src";
import { genTestMon, getDamangeNumberFromResult } from "./utils";
test("Supreme Overlord", () => {
	const kingGambit = genTestMon({
		types: ["Dark", "Steel"],
		baseStat: {
			attack: 135,
		},
		ability: "Supreme Overlord 1",
	});
	const amoonguss = genTestMon({
		types: ["Grass", "Poison"],
		baseStat: {
			hp: 114,
			defense: 70,
		},
	});
	const move = createMove({
		base: 80,
		type: "Steel",
	});
	const battle = new Battle({
		attacker: kingGambit,
		defender: amoonguss,
		move,
	});
	const damage = battle.getDamage();
	const actual = getDamangeNumberFromResult(damage);
	const expected = [
		85, 87, 88, 88, 90, 91, 91, 93, 94, 94, 96, 97, 97, 99, 100, 102,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
	kingGambit.ability = "Supreme Overlord 2";
	const down2Actual = getDamangeNumberFromResult(battle.getDamage());
	const down2Expected = [
		93, 94, 96, 97, 97, 99, 100, 102, 102, 103, 105, 106, 106, 108, 109, 111,
	];
	expect(down2Actual).toEqual(down2Expected);
	kingGambit.ability = "Supreme Overlord 3";
	const down3Actual = getDamangeNumberFromResult(battle.getDamage());
	const down3Expected = [
		102, 102, 103, 105, 106, 108, 108, 109, 111, 112, 114, 114, 115, 117, 118,
		120,
	];
	expect(down3Actual).toEqual(down3Expected);
});

test("Liquid Voice", () => {
	const primirina = genTestMon({
		types: ["Water", "Fairy"],
		baseStat: {
			specialAttack: 126,
		},
		ability: "Liquid Voice",
	});
	const incineroar = genTestMon({
		types: ["Fire", "Dark"],
		baseStat: {
			hp: 95,
			specialDefense: 90,
		},
	});
	const move = createMove({
		base: 90,
		type: "Normal",
		category: "Special",
		flags: {
			isSound: true,
		},
		target: "allAdjacentFoes",
	});
	const battle = new Battle({
		attacker: primirina,
		defender: incineroar,
		move,
	});
	const damage = battle.getDamage();
	const actual = getDamangeNumberFromResult(damage);
	const expected = [
		102, 102, 102, 104, 104, 108, 108, 108, 110, 110, 114, 114, 114, 116, 116,
		120,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
});

test("Pixilate", () => {
	const sylveon = genTestMon({
		types: ["Fairy"],
		baseStat: { specialAttack: 110 },
		ability: "Pixilate",
	});
	const dragonite = genTestMon({
		types: ["Dragon", "Flying"],
		baseStat: { hp: 91, specialDefense: 100 },
	});
	const move = createMove({
		base: 90,
		type: "Normal",
		category: "Special",
		target: "allAdjacentFoes",
	});
	const battle = new Battle({ attacker: sylveon, defender: dragonite, move });
	const damage = battle.getDamage();
	const actual = getDamangeNumberFromResult(damage);
	const expected = [
		102, 102, 102, 104, 104, 108, 108, 108, 110, 110, 114, 114, 114, 116, 116,
		120,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
});

test("Refrigerate", () => {
	const megaGlalie = genTestMon({
		types: ["Ice"],
		baseStat: { attack: 120 },
		ability: "Refrigerate",
	});
	const kommoo = genTestMon({
		types: ["Dragon", "Fighting"],
		baseStat: { hp: 75, defense: 125 },
	});
	const move = createMove({ base: 85, type: "Normal", category: "Physical" });
	const battle = new Battle({ attacker: megaGlalie, defender: kommoo, move });
	const damage = battle.getDamage();
	const actual = getDamangeNumberFromResult(damage);
	const expected = [
		114, 114, 116, 116, 120, 120, 120, 122, 122, 126, 126, 128, 128, 132, 132,
		134,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
});

test("Aerilate", () => {
	const megaPinsir = genTestMon({
		types: ["Bug", "Flying"],
		baseStat: { attack: 155 },
		ability: "Aerilate",
	});
	const conkeldurr = genTestMon({
		types: ["Fighting"],
		baseStat: { hp: 105, defense: 95 },
	});
	const move = createMove({ base: 85, type: "Normal", category: "Physical" });
	const battle = new Battle({
		attacker: megaPinsir,
		defender: conkeldurr,
		move,
	});
	const damage = battle.getDamage();
	const actual = getDamangeNumberFromResult(damage);
	const expected = [
		176, 180, 180, 182, 186, 188, 188, 192, 194, 194, 198, 200, 200, 204, 206,
		210,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
});

test("Galvanize", () => {
	const megaAmpharos = genTestMon({
		types: ["Electric", "Dragon"],
		baseStat: { specialAttack: 165 },
		ability: "Galvanize",
	});
	const milotic = genTestMon({
		types: ["Water"],
		baseStat: { hp: 95, specialDefense: 125 },
	});
	const move = createMove({
		base: 90,
		type: "Normal",
		category: "Special",
		target: "allAdjacentFoes",
	});
	const battle = new Battle({
		attacker: megaAmpharos,
		defender: milotic,
		move,
	});
	const damage = battle.getDamage();
	const actual = getDamangeNumberFromResult(damage);
	const expected = [
		116, 116, 120, 120, 120, 122, 122, 126, 126, 128, 128, 132, 132, 134, 134,
		138,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
});

test("Dragonize", () => {
	const attacker = genTestMon({
		types: ["Water"],
		ability: "Dragonize",
	});
	const defender = genTestMon({
		types: ["Dragon"],
	});
	const move = createMove({ base: 80, type: "Normal" });
	const battle = new Battle({ attacker, defender, move });
	const damage = battle.getDamage();
	const actual = getDamangeNumberFromResult(damage);
	const expected = [
		74, 74, 76, 76, 78, 78, 80, 80, 80, 82, 82, 84, 84, 86, 86, 88,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
});

test("Adaptability", () => {
	const attacker = genTestMon({
		types: ["Poison"],
		ability: "Adaptability",
		baseStat: {
			specialAttack: 150,
		},
	});
	const defender = genTestMon({
		types: ["Fire"],
		baseStat: {
			specialDefense: 90,
		},
	});
	const move = createMove({ base: 90, type: "Poison", category: "Special" });
	const battle = new Battle({ attacker, defender, move });
	const damage = battle.getDamage();
	const actual = getDamangeNumberFromResult(damage);
	const expected = [
		106, 108, 108, 110, 112, 112, 114, 114, 116, 118, 118, 120, 122, 122, 124,
		126,
	];
	console.log(damage.factors);
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
});
