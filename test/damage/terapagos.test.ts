import { expect, test } from "bun:test";
import { Battle, createMove } from "../../src";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

test("terapagos stellar hit charizard", () => {
	const terapagos = genTestMon({
		name: "terapagos-stellar",
		types: ["Normal"],
		baseStat: {
			specialAttack: 130,
		},
		isTera: true,
		teraType: "Stellar",
	});

	const charizard = genTestMon({
		types: ["Fire"],
		baseStat: {
			hp: 78,
			specialDefense: 85,
		},
	});
	const move = createMove({
		base: 150,
		type: "Normal",
		category: "Special",
	});
	const battle = new Battle({
		attacker: terapagos,
		defender: charizard,
		move,
	});
	const expected = [
		162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190,
		192,
	];
	const damage = battle.getDamage();
	expect(getDamangeNumberFromResult(damage)).toEqual(expected);
});

test("terapagos stellar hit charizard with terastorm", () => {
	const terapagos = genTestMon({
		name: "terapagos-stellar",
		types: ["Normal"],
		baseStat: {
			specialAttack: 130,
		},
		isTera: true,
		teraType: "Stellar",
	});

	const charizard = genTestMon({
		types: ["Fire"],
		baseStat: {
			hp: 78,
			specialDefense: 85,
		},
	});
	const move = createMove({
		id: 906,
		base: 120,
		type: "Normal",
		category: "Special",
	});
	const battle = new Battle({
		attacker: terapagos,
		defender: charizard,
		move,
	});
	const expected = [
		59, 59, 60, 61, 61, 62, 62, 64, 64, 65, 66, 66, 67, 67, 68, 70,
	];
	const damage = battle.getDamage();
	expect(getDamangeNumberFromResult(damage)).toEqual(expected);
});
