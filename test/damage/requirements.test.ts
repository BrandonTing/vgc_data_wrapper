import { expect, test } from "bun:test";
import { Battle, createMove, getMinAtkRequirement, getMinDefRequirement } from "../../src";
import { genTestMon } from "./utils";

function meetsTarget(mode: "atk" | "def", hp: number, target: { type: "guaranteed" } | { type: "chance"; value: number } | { type: "guaranteed-2hit" }, koChance: number, rolls: Array<{ number: number }>) {
	const minRoll = rolls[0]?.number ?? 0;
	const maxRoll = rolls[rolls.length - 1]?.number ?? 0;
	if (target.type === "guaranteed") return mode === "atk" ? koChance === 100 : koChance === 0;
	if (target.type === "chance") return mode === "atk" ? koChance >= target.value : 100 - koChance >= target.value;
	return mode === "atk" ? minRoll * 2 >= hp : maxRoll * 2 < hp;
}

function assertAtkRequirement(args: Parameters<typeof getMinAtkRequirement>[0]) {
	const res = getMinAtkRequirement(args);
	expect(res.satisfied).toBe(true);
	if (!res.satisfied) return;
	const axis = Object.keys(res.investment)[0] as "attack" | "specialAttack" | "defense";
	const ev = res.investment[axis] ?? 0;
	const atk = genTestMon({ ...args.attacker, effortValues: { ...args.attacker.effortValues, [axis]: ev } });
	const dmg = new Battle({ attacker: atk, defender: args.defender, move: args.move, field: args.field }).getDamage();
	expect(meetsTarget("atk", args.defender.getStat("hp"), args.target, dmg.koChance, dmg.rolls)).toBe(true);
	for (let i = 0; i < ev; i++) {
		const lessAtk = genTestMon({ ...args.attacker, effortValues: { ...args.attacker.effortValues, [axis]: i } });
		const less = new Battle({ attacker: lessAtk, defender: args.defender, move: args.move, field: args.field }).getDamage();
		expect(meetsTarget("atk", args.defender.getStat("hp"), args.target, less.koChance, less.rolls)).toBe(false);
	}
	return { axis, ev, dmg };
}

function assertDefRequirement(args: Parameters<typeof getMinDefRequirement>[0]) {
	const res = getMinDefRequirement(args);
	expect(res.satisfied).toBe(true);
	if (!res.satisfied) return;
	const defAxis = Object.keys(res.investment).includes("defense") ? "defense" : "specialDefense";
	const hp = res.investment.hp ?? 0;
	const dv = res.investment[defAxis] ?? 0;
	const def = genTestMon({ ...args.defender, effortValues: { ...args.defender.effortValues, hp, [defAxis]: dv } });
	const dmg = new Battle({ attacker: args.attacker, defender: def, move: args.move, field: args.field }).getDamage();
	expect(meetsTarget("def", def.getStat("hp"), args.target, dmg.koChance, dmg.rolls)).toBe(true);
	for (let h = 0; h <= hp; h++) {
		for (let d = 0; d <= dv; d++) {
			if (h === hp && d === dv) continue;
			if (h + d >= hp + dv) continue;
			const lessDef = genTestMon({ ...args.defender, effortValues: { ...args.defender.effortValues, hp: h, [defAxis]: d } });
			const less = new Battle({ attacker: args.attacker, defender: lessDef, move: args.move, field: args.field }).getDamage();
			expect(meetsTarget("def", lessDef.getStat("hp"), args.target, less.koChance, less.rolls)).toBe(false);
		}
	}
	return { defAxis, hp, dv, dmg };
}

test("reverse requirement helpers prove minimality across target types", () => {
	const attacker = genTestMon({ baseStat: { attack: 130, specialAttack: 130 }, statRuleset: "mainSeries" });
	const defender = genTestMon({ baseStat: { hp: 90, defense: 90, specialDefense: 90 }, statRuleset: "mainSeries" });
	const move = createMove({ type: "Normal", base: 220, category: "Physical" });
	assertAtkRequirement({ attacker, defender, move, target: { type: "chance", value: 10 } });
	assertAtkRequirement({ attacker, defender, move, target: { type: "chance", value: 10 } });
	assertDefRequirement({ attacker, defender, move, target: { type: "guaranteed" } });
});

test("nature changes required investment in expected direction", () => {
	const defender = genTestMon({ baseStat: { hp: 100, defense: 90, specialDefense: 90 }, statRuleset: "mainSeries" });
	const move = createMove({ type: "Normal", base: 220, category: "Physical" });
	const neutral = assertAtkRequirement({ attacker: genTestMon({ baseStat: { attack: 100 }, statRuleset: "mainSeries", nature: {} }), defender, move, target: { type: "chance", value: 50 } });
	const plusAtk = assertAtkRequirement({ attacker: genTestMon({ baseStat: { attack: 100 }, statRuleset: "mainSeries", nature: { plus: "attack", minus: "specialAttack" } }), defender, move, target: { type: "chance", value: 50 } });
	expect((plusAtk?.ev ?? 999)).toBeLessThan(neutral?.ev ?? 999);

	const attacker = genTestMon({ baseStat: { attack: 130 }, effortValues: { attack: 252 }, statRuleset: "mainSeries" });
	const defNeutral = assertDefRequirement({ attacker, defender: genTestMon({ ...defender, nature: {} }), move, target: { type: "chance", value: 50 } });
	const defPlus = assertDefRequirement({ attacker, defender: genTestMon({ ...defender, nature: { plus: "defense", minus: "specialAttack" } }), move, target: { type: "chance", value: 50 } });
	expect((defPlus?.hp ?? 999) + (defPlus?.dv ?? 999)).toBeLessThan((defNeutral?.hp ?? 999) + (defNeutral?.dv ?? 999));
});

test("sun changes fire damage and therefore defensive requirement", () => {
	const attacker = genTestMon({ types: ["Normal"], baseStat: { specialAttack: 110 }, effortValues: { specialAttack: 200 }, statRuleset: "mainSeries" });
	const defender = genTestMon({ types: ["Grass"], baseStat: { hp: 100, defense: 90, specialDefense: 100 }, statRuleset: "mainSeries" });
	const move = createMove({ type: "Fire", base: 95, category: "Special" });
	const clear = new Battle({ attacker, defender, move }).getDamage();
	const sun = new Battle({ attacker, defender, move, field: { weather: "Sun" } }).getDamage();
	expect((sun.rolls[0]?.number ?? 0)).toBeGreaterThan(clear.rolls[0]?.number ?? 0);
	const noWeather = assertDefRequirement({ attacker, defender, move, target: { type: "chance", value: 50 } });
	const inSun = assertDefRequirement({ attacker, defender, move, field: { weather: "Sun" }, target: { type: "chance", value: 50 } });
	expect((inSun?.hp ?? 0) + (inSun?.dv ?? 0)).toBeGreaterThanOrEqual((noWeather?.hp ?? 0) + (noWeather?.dv ?? 0));
});

test("Body Press/Foul Play/Psyshock stat-selection behavior", () => {
	const bodyPress = assertAtkRequirement({
		attacker: genTestMon({ baseStat: { attack: 70, defense: 140 }, statRuleset: "mainSeries" }),
		defender: genTestMon({ baseStat: { hp: 100, defense: 110, specialDefense: 100 }, statRuleset: "mainSeries" }),
		move: createMove({ id: 776, type: "Fighting", base: 80, category: "Physical" }),
		target: { type: "guaranteed-2hit" },
	});
	expect(bodyPress?.axis).toBe("defense");

	const foulPlayMove = createMove({ id: 492, type: "Dark", base: 95, category: "Physical" });
	const fpAttacker = genTestMon({ baseStat: { attack: 30 }, effortValues: { attack: 0 }, statRuleset: "mainSeries" });
	const fpDefender = genTestMon({ baseStat: { hp: 90, attack: 80, defense: 80, specialDefense: 80 }, statRuleset: "mainSeries" });
	const fp0 = new Battle({ attacker: fpAttacker, defender: fpDefender, move: foulPlayMove }).getDamage();
	const fp252 = new Battle({ attacker: genTestMon({ ...fpAttacker, effortValues: { ...fpAttacker.effortValues, attack: 252 } }), defender: fpDefender, move: foulPlayMove }).getDamage();
	expect(fp252.rolls[0]?.number).toBe(fp0.rolls[0]?.number);
	const fpLowerDefAtk = new Battle({ attacker: fpAttacker, defender: genTestMon({ ...fpDefender, effortValues: { ...fpDefender.effortValues, attack: 252 } }), move: foulPlayMove }).getDamage();
	expect((fpLowerDefAtk.rolls[0]?.number ?? 0)).toBeGreaterThan(fp0.rolls[0]?.number ?? 0);

	const psyRes = assertDefRequirement({
		attacker: genTestMon({ baseStat: { specialAttack: 130 }, effortValues: { specialAttack: 252 }, statRuleset: "mainSeries" }),
		defender: genTestMon({ baseStat: { hp: 95, defense: 120, specialDefense: 60 }, statRuleset: "mainSeries" }),
		move: createMove({ id: 473, type: "Psychic", base: 80, category: "Special" }),
		target: { type: "guaranteed-2hit" },
	});
	expect(psyRes?.defAxis).toBe("defense");
});

test("champions budget caps include unrelated existing EVs", () => {
	const attacker = genTestMon({ statRuleset: "champions", baseStat: { attack: 120 }, effortValues: { speed: 32, specialAttack: 32 } });
	const defender = genTestMon({ statRuleset: "champions", baseStat: { hp: 95, defense: 95, specialDefense: 95 }, effortValues: { attack: 32 } });
	const d = getMinDefRequirement({ attacker, defender, move: createMove({ type: "Normal", base: 100, category: "Physical" }), target: { type: "chance", value: 1 } });
	expect(d.satisfied).toBe(true);
	if (d.satisfied) {
		const total = Object.values({ ...defender.effortValues, ...d.investment }).reduce((a, b) => a + b, 0);
		expect(total).toBeLessThanOrEqual(66);
	}
	const a = getMinAtkRequirement({ attacker, defender, move: createMove({ type: "Normal", base: 220, category: "Physical" }), target: { type: "chance", value: 1 } });
	expect(a.satisfied).toBe(true);
	if (a.satisfied) {
		const total = Object.values({ ...attacker.effortValues, ...a.investment }).reduce((x, y) => x + y, 0);
		expect(total).toBeLessThanOrEqual(66);
	}
}, 30000);
