import { expect, test } from "bun:test";
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
		87, 88, 88, 90, 91, 91, 93, 94, 94, 96, 97, 97, 99, 100, 102,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
	kingGambit.ability = "Supreme Overlord 2";
	const down2Actual = getDamangeNumberFromResult(battle.getDamage());
	const down2Expected = [
		94, 96, 97, 97, 99, 100, 102, 102, 103, 105, 106, 106, 108, 109, 111,
	];
	expect(down2Actual).toEqual(down2Expected);
	kingGambit.ability = "Supreme Overlord 3";
	const down3Actual = getDamangeNumberFromResult(battle.getDamage());
	const down3Expected = [
		102, 103, 105, 106, 108, 108, 109, 111, 112, 114, 114, 115, 117, 118,
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
		102, 102, 104, 104, 108, 108, 108, 110, 110, 114, 114, 114, 116, 116,
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
		102, 102, 104, 104, 108, 108, 108, 110, 110, 114, 114, 114, 116, 116,
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
		114, 116, 116, 120, 120, 120, 122, 122, 126, 126, 128, 128, 132, 132,
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
		180, 180, 182, 186, 188, 188, 192, 194, 194, 198, 200, 200, 204, 206,
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
		116, 120, 120, 120, 122, 122, 126, 126, 128, 128, 132, 132, 134, 134,
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
		74, 76, 76, 78, 78, 80, 80, 80, 82, 82, 84, 84, 86, 86, 88,
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
		108, 108, 110, 112, 112, 114, 114, 116, 118, 118, 120, 122, 122, 124,
		126,
	];
	expect(actual).toEqual(expected);
	expect(damage.factors.attacker.ability).toEqual(true);
});

test("Mega Sol: Fire move in Rain is treated as Sun (1.5x, not 0.5x)", () => {
	const attacker = genTestMon({ ability: "Mega Sol" });
	const defender = genTestMon();
	const move = createMove({ type: "Fire", base: 80 });
	const battle = new Battle({
		attacker,
		defender,
		move,
		field: { weather: "Rain" },
	});
	const damage = battle.getDamage();
	expect(damage.factors.attacker.weather).toBe(true);
	expect(damage.factors.defender.weather).toBeUndefined();
	expect(getDamangeNumberFromResult(damage)).toEqual([
		47, 47, 48, 48, 49, 50, 50, 51, 51, 52, 52, 53, 53, 54, 55,
	]);
});

test("Mega Sol: Water move in Rain is treated as Sun (0.5x, not 1.5x)", () => {
	const attacker = genTestMon({ ability: "Mega Sol" });
	const defender = genTestMon();
	const move = createMove({ type: "Water", base: 80 });
	const battle = new Battle({
		attacker,
		defender,
		move,
		field: { weather: "Rain" },
	});
	const damage = battle.getDamage();
	expect(damage.factors.defender.weather).toBe(true);
	// base=37, *0.5=18, rolls 85%–100%
	expect(getDamangeNumberFromResult(damage)).toEqual([
		15, 15, 15, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18,
	]);
});

test("Mega Sol: Weather Ball in Rain becomes Fire-type (not Water-type)", () => {
	// Fire-type defender: Fire vs Fire = 0.5x, Water vs Fire = 2x
	// This makes the type difference visible in the damage output.
	const attacker = genTestMon({ ability: "Mega Sol" });
	const defender = genTestMon({ types: ["Fire"] });
	const weatherBall = createMove({
		id: 311,
		base: 50,
		type: "Normal",
		category: "Special",
	});
	const battle = new Battle({
		attacker,
		defender,
		move: weatherBall,
		field: { weather: "Rain" },
	});
	const damage = battle.getDamage();
	// bp doubles to 100 (Rain weather exists), Fire-in-Sun 1.5x → pre-type base 69
	// Fire vs Fire = 0.5x → final rolls
	expect(getDamangeNumberFromResult(damage)).toEqual([
		29, 30, 30, 30, 31, 31, 31, 32, 32, 32, 33, 33, 33, 34, 34,
	]);
});

test("Mega Sol: Solar Beam in Rain has full power (no 0.5x penalty)", () => {
	const attacker = genTestMon({ ability: "Mega Sol" });
	const defender = genTestMon();
	const solarBeam = createMove({ id: 76, base: 120, type: "Grass" });
	const battle = new Battle({
		attacker,
		defender,
		move: solarBeam,
		field: { weather: "Rain" },
	});
	const damage = battle.getDamage();
	// Full 120bp: base=54, rolls 85%–100%
	expect(getDamangeNumberFromResult(damage)).toEqual([
		46, 46, 47, 48, 48, 49, 49, 50, 50, 51, 51, 52, 52, 53, 54,
	]);
});

test("Solar Beam in Rain WITHOUT Mega Sol still gets 0.5x penalty", () => {
	const attacker = genTestMon();
	const defender = genTestMon();
	const solarBeam = createMove({ id: 76, base: 120, type: "Grass" });
	const battle = new Battle({
		attacker,
		defender,
		move: solarBeam,
		field: { weather: "Rain" },
	});
	const damage = battle.getDamage();
	// Effective 60bp: base=28, rolls 85%–100%
	expect(getDamangeNumberFromResult(damage)).toEqual([
		24, 24, 24, 24, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 28,
	]);
});

test("Sand still boosts Rock special defense without Mega Sol", () => {
	const attacker = genTestMon();
	const defender = genTestMon({ types: ["Rock"] });
	const move = createMove({ type: "Electric", base: 80, category: "Special" });
	const battle = new Battle({
		attacker,
		defender,
		move,
		field: { weather: "Sand" },
	});
	const damage = battle.getDamage();
	// Rock SpDef 1.5x in Sand: base=25, rolls 85%–100%
	expect(getDamangeNumberFromResult(damage)).toEqual([
		21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25,
	]);
});

test("Mega Sol: Rock-type defender does NOT get Sand special defense boost", () => {
	const attacker = genTestMon({ ability: "Mega Sol" });
	const defender = genTestMon({ types: ["Rock"] });
	const move = createMove({ type: "Electric", base: 80, category: "Special" });
	const battle = new Battle({
		attacker,
		defender,
		move,
		field: { weather: "Sand" },
	});
	const damage = battle.getDamage();
	// No defense boost (Mega Sol treats weather as Sun): base=37, rolls 85%–100%
	expect(getDamangeNumberFromResult(damage)).toEqual([
		31, 32, 32, 32, 33, 33, 34, 34, 34, 35, 35, 35, 36, 36, 37,
	]);
});

test("Snow still boosts Ice physical defense without Mega Sol", () => {
	const attacker = genTestMon();
	const defender = genTestMon({ types: ["Ice"] });
	const move = createMove({ type: "Electric", base: 80, category: "Physical" });
	const battle = new Battle({
		attacker,
		defender,
		move,
		field: { weather: "Snow" },
	});
	const damage = battle.getDamage();
	// Ice PhyDef 1.5x in Snow: base=25, rolls 85%–100%
	expect(getDamangeNumberFromResult(damage)).toEqual([
		21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25,
	]);
});

test("Mega Sol: Ice-type defender does NOT get Snow physical defense boost", () => {
	const attacker = genTestMon({ ability: "Mega Sol" });
	const defender = genTestMon({ types: ["Ice"] });
	const move = createMove({ type: "Electric", base: 80, category: "Physical" });
	const battle = new Battle({
		attacker,
		defender,
		move,
		field: { weather: "Snow" },
	});
	const damage = battle.getDamage();
	// No defense boost (Mega Sol treats weather as Sun): base=37, rolls 85%–100%
	expect(getDamangeNumberFromResult(damage)).toEqual([
		31, 32, 32, 32, 33, 33, 34, 34, 34, 35, 35, 35, 36, 36, 37,
	]);
});

test("Mega Sol: Weather Ball in clear skies becomes Fire-type at 100bp", () => {
	// Fire-type defender: Fire vs Fire = 0.5x
	// With 100bp: base=46, Sun boost 1.5x → 69, Fire vs Fire 0.5x → rolls
	// With 50bp (bug): base=23, Sun boost 1.5x → 34, Fire vs Fire 0.5x → much lower
	const attacker = genTestMon({ ability: "Mega Sol" });
	const defender = genTestMon({ types: ["Fire"] });
	const weatherBall = createMove({
		id: 311,
		base: 50,
		type: "Normal",
		category: "Special",
	});
	const battle = new Battle({
		attacker,
		defender,
		move: weatherBall,
		// No field weather at all
	});
	const damage = battle.getDamage();
	// 100bp, Sun boost 1.5x, Fire vs Fire 0.5x
	// base=46, *1.5=69, random [58..69], *0.5 each:
	expect(getDamangeNumberFromResult(damage)).toEqual([
		29, 30, 30, 30, 31, 31, 31, 32, 32, 32, 33, 33, 33, 34, 34,
	]);
});
