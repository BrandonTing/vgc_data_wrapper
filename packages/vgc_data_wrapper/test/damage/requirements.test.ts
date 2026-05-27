import { expect, test } from "bun:test";
import {
	Battle,
	createMove,
	getMinAtkRequirement,
	getMinDefRequirement,
} from "../../src";
import { getMaxTotalEvs, getSearchEvs } from "../../src/pokemon/effortValue";
import { genTestMon } from "./utils";

type Target =
	| { type: "guaranteed" }
	| { type: "chance"; value: number }
	| { type: "guaranteed-2hit" };

function meetsTarget(
	mode: "atk" | "def",
	hp: number,
	target: Target,
	koChance: number,
	rolls: Array<{ number: number }>,
) {
	const minRoll = rolls[0]?.number ?? 0;
	const maxRoll = rolls[rolls.length - 1]?.number ?? 0;
	if (target.type === "guaranteed")
		return mode === "atk" ? koChance === 100 : koChance === 0;
	if (target.type === "chance")
		return mode === "atk"
			? koChance >= target.value
			: 100 - koChance >= target.value;
	return mode === "atk" ? minRoll * 2 >= hp : maxRoll * 2 < hp;
}

function assertAtkRequirement(
	args: Parameters<typeof getMinAtkRequirement>[0],
) {
	const res = getMinAtkRequirement(args);
	expect(res.satisfied).toBe(true);
	if (!res.satisfied) return;
	expect(res.investment).toBeDefined();
	expect(res.finalStats).toBeDefined();
	expect(res.damage).toBeDefined();
	expect(res.statRuleset).toBe(args.attacker.statRuleset);
	const axis = Object.keys(res.investment)[0] as
		| "attack"
		| "specialAttack"
		| "defense";
	const ev = res.investment[axis] ?? 0;
	const atk = genTestMon({
		...args.attacker,
		effortValues: { ...args.attacker.effortValues, [axis]: ev },
	});
	const dmg = new Battle({
		attacker: atk,
		defender: args.defender,
		move: args.move,
		field: args.field,
	}).getDamage();
	expect(
		meetsTarget(
			"atk",
			args.defender.getStat("hp"),
			args.target,
			dmg.koChance,
			dmg.rolls,
		),
	).toBe(true);
	const searchEvs = getSearchEvs(args.attacker.statRuleset);
	const totalMax = getMaxTotalEvs(args.attacker.statRuleset);
	const otherTotal =
		Object.values(args.attacker.effortValues).reduce((s, v) => s + v, 0) -
		args.attacker.effortValues[axis];
	for (const candidate of searchEvs) {
		if (candidate >= ev) break;
		if (otherTotal + candidate > totalMax) continue;
		const lessAtk = genTestMon({
			...args.attacker,
			effortValues: { ...args.attacker.effortValues, [axis]: candidate },
		});
		const less = new Battle({
			attacker: lessAtk,
			defender: args.defender,
			move: args.move,
			field: args.field,
		}).getDamage();
		expect(
			meetsTarget(
				"atk",
				args.defender.getStat("hp"),
				args.target,
				less.koChance,
				less.rolls,
			),
		).toBe(false);
	}
	return { axis, ev, dmg };
}

function assertDefRequirement(
	args: Parameters<typeof getMinDefRequirement>[0],
) {
	const res = getMinDefRequirement(args);
	expect(res.satisfied).toBe(true);
	if (!res.satisfied) return;
	expect(res.investment).toBeDefined();
	expect(res.finalStats).toBeDefined();
	expect(res.damage).toBeDefined();
	expect(res.statRuleset).toBe(args.defender.statRuleset);
	const defAxis = Object.keys(res.investment).includes("defense")
		? "defense"
		: "specialDefense";
	const hp = res.investment.hp ?? 0;
	const dv = res.investment[defAxis] ?? 0;
	const def = genTestMon({
		...args.defender,
		effortValues: { ...args.defender.effortValues, hp, [defAxis]: dv },
	});
	const dmg = new Battle({
		attacker: args.attacker,
		defender: def,
		move: args.move,
		field: args.field,
	}).getDamage();
	expect(
		meetsTarget("def", def.getStat("hp"), args.target, dmg.koChance, dmg.rolls),
	).toBe(true);
	const searchEvs = getSearchEvs(args.defender.statRuleset);
	const totalMax = getMaxTotalEvs(args.defender.statRuleset);
	const otherTotal =
		Object.values(args.defender.effortValues).reduce((s, v) => s + v, 0) -
		args.defender.effortValues.hp -
		args.defender.effortValues[defAxis];
	const returnedTotal = hp + dv;
	for (const candHp of searchEvs) {
		for (const candDef of searchEvs) {
			if (candHp + candDef >= returnedTotal) continue;
			if (otherTotal + candHp + candDef > totalMax) continue;
			const lessDef = genTestMon({
				...args.defender,
				effortValues: {
					...args.defender.effortValues,
					hp: candHp,
					[defAxis]: candDef,
				},
			});
			const less = new Battle({
				attacker: args.attacker,
				defender: lessDef,
				move: args.move,
				field: args.field,
			}).getDamage();
			expect(
				meetsTarget(
					"def",
					lessDef.getStat("hp"),
					args.target,
					less.koChance,
					less.rolls,
				),
			).toBe(false);
		}
	}
	return { defAxis, hp, dv, dmg };
}

test("reverse requirement helpers prove minimality across target types", () => {
	const attacker = genTestMon({
		baseStat: { attack: 150, specialAttack: 130 },
		statRuleset: "mainSeries",
	});
	const defender = genTestMon({
		baseStat: { hp: 70, defense: 80, specialDefense: 90 },
		statRuleset: "mainSeries",
	});
	const atkMove = createMove({
		type: "Normal",
		base: 220,
		category: "Physical",
	});
	const defMove = createMove({
		type: "Normal",
		base: 80,
		category: "Physical",
	});
	assertAtkRequirement({
		attacker,
		defender,
		move: atkMove,
		target: { type: "guaranteed" },
	});
	assertAtkRequirement({
		attacker,
		defender,
		move: atkMove,
		target: { type: "chance", value: 10 },
	});
	assertAtkRequirement({
		attacker,
		defender,
		move: atkMove,
		target: { type: "guaranteed-2hit" },
	});
	assertDefRequirement({
		attacker,
		defender,
		move: defMove,
		target: { type: "guaranteed" },
	});
	assertDefRequirement({
		attacker,
		defender,
		move: defMove,
		target: { type: "chance", value: 90 },
	});
	assertDefRequirement({
		attacker,
		defender,
		move: defMove,
		target: { type: "guaranteed-2hit" },
	});
});

test("API contract and no mutation", () => {
	const attacker = genTestMon({
		baseStat: { attack: 125 },
		effortValues: { attack: 0, speed: 252 },
		statRuleset: "mainSeries",
	});
	const defender = genTestMon({
		baseStat: { hp: 100, defense: 100, specialDefense: 100 },
		effortValues: { hp: 0 },
		statRuleset: "mainSeries",
	});
	const atkBefore = { ...attacker.effortValues };
	const defBefore = { ...defender.effortValues };
	const success = getMinAtkRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 220, category: "Physical" }),
		target: { type: "chance", value: 1 },
	});
	expect(success.satisfied).toBe(true);
	if (success.satisfied) {
		expect(success.investment).toBeDefined();
		expect(success.finalStats).toBeDefined();
		expect(success.damage).toBeDefined();
		expect(success.statRuleset).toBe("mainSeries");
	}
	expect(attacker.effortValues).toEqual(atkBefore);
	expect(defender.effortValues).toEqual(defBefore);
	const fail = getMinAtkRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 1, category: "Physical" }),
		target: { type: "guaranteed" },
	});
	expect(fail.satisfied).toBe(false);
	if (!fail.satisfied) {
		expect(fail.reason.length).toBeGreaterThan(0);
		expect("investment" in fail).toBe(false);
	}

	const defSuccess = getMinDefRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 220, category: "Physical" }),
		target: { type: "chance", value: 1 },
	});
	expect(defSuccess.satisfied).toBe(true);
	if (defSuccess.satisfied) {
		expect(defSuccess.investment).toBeDefined();
		expect(defSuccess.finalStats).toBeDefined();
		expect(defSuccess.damage).toBeDefined();
		expect(defSuccess.statRuleset).toBe("mainSeries");
	}
	expect(attacker.effortValues).toEqual(atkBefore);
	expect(defender.effortValues).toEqual(defBefore);
	const defFail = getMinDefRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 400, category: "Physical" }),
		target: { type: "guaranteed" },
	});
	expect(defFail.satisfied).toBe(false);
	if (!defFail.satisfied) {
		expect(defFail.reason.length).toBeGreaterThan(0);
		expect("investment" in defFail).toBe(false);
	}
});

test("nature changes required investment in expected direction", () => {
	const defender = genTestMon({
		baseStat: { hp: 100, defense: 90, specialDefense: 90 },
		statRuleset: "mainSeries",
	});
	const move = createMove({ type: "Normal", base: 220, category: "Physical" });
	const neutral = assertAtkRequirement({
		attacker: genTestMon({
			baseStat: { attack: 100 },
			statRuleset: "mainSeries",
			nature: {},
		}),
		defender,
		move,
		target: { type: "chance", value: 50 },
	});
	const plusAtk = assertAtkRequirement({
		attacker: genTestMon({
			baseStat: { attack: 100 },
			statRuleset: "mainSeries",
			nature: { plus: "attack", minus: "specialAttack" },
		}),
		defender,
		move,
		target: { type: "chance", value: 50 },
	});
	expect(plusAtk?.ev ?? 999).toBeLessThan(neutral?.ev ?? 999);
	expect(plusAtk?.dmg.rolls[0]?.number ?? 0).toBeGreaterThanOrEqual(
		neutral?.dmg.rolls[0]?.number ?? 0,
	);
	expect(plusAtk?.ev ?? 0).toBeLessThanOrEqual(neutral?.ev ?? 0);
	expect(plusAtk?.dmg.koChance ?? 0).toBeGreaterThanOrEqual(
		neutral?.dmg.koChance ?? 0,
	);

	const attacker = genTestMon({
		baseStat: { attack: 130 },
		effortValues: { attack: 252 },
		statRuleset: "mainSeries",
	});
	const defNeutral = assertDefRequirement({
		attacker,
		defender: genTestMon({ ...defender, nature: {} }),
		move,
		target: { type: "chance", value: 50 },
	});
	const defPlus = assertDefRequirement({
		attacker,
		defender: genTestMon({
			...defender,
			nature: { plus: "defense", minus: "specialAttack" },
		}),
		move,
		target: { type: "chance", value: 50 },
	});
	expect((defPlus?.hp ?? 999) + (defPlus?.dv ?? 999)).toBeLessThan(
		(defNeutral?.hp ?? 999) + (defNeutral?.dv ?? 999),
	);
	expect(defPlus?.dmg.rolls[0]?.number ?? 999).toBeLessThanOrEqual(
		defNeutral?.dmg.rolls[0]?.number ?? 999,
	);
});

test("weather and field modifiers are reflected by reverse API", () => {
	const attacker = genTestMon({
		types: ["Normal"],
		baseStat: { specialAttack: 110 },
		effortValues: { specialAttack: 200 },
		statRuleset: "mainSeries",
	});
	const defender = genTestMon({
		types: ["Grass"],
		baseStat: { hp: 100, defense: 90, specialDefense: 80 },
		statRuleset: "mainSeries",
	});
	const move = createMove({ type: "Fire", base: 110, category: "Special" });
	const clear = new Battle({ attacker, defender, move }).getDamage();
	const sun = new Battle({
		attacker,
		defender,
		move,
		field: { weather: "Sun" },
	}).getDamage();
	expect(sun.rolls[0]?.number ?? 0).toBeGreaterThan(
		clear.rolls[0]?.number ?? 0,
	);
	const noWeather = assertDefRequirement({
		attacker,
		defender,
		move,
		target: { type: "chance", value: 95 },
	});
	const inSun = assertDefRequirement({
		attacker,
		defender,
		move,
		field: { weather: "Sun" },
		target: { type: "chance", value: 95 },
	});
	expect((inSun?.hp ?? 0) + (inSun?.dv ?? 0)).toBeGreaterThan(
		(noWeather?.hp ?? 0) + (noWeather?.dv ?? 0),
	);
});

test("Body Press/Foul Play/Psyshock and dynamic category behavior", () => {
	const bodyPress = assertAtkRequirement({
		attacker: genTestMon({
			baseStat: { attack: 70, defense: 140 },
			statRuleset: "mainSeries",
		}),
		defender: genTestMon({
			baseStat: { hp: 100, defense: 110, specialDefense: 100 },
			statRuleset: "mainSeries",
		}),
		move: createMove({
			id: 776,
			type: "Fighting",
			base: 80,
			category: "Physical",
		}),
		target: { type: "guaranteed-2hit" },
	});
	expect(bodyPress?.axis).toBe("defense");

	const foulPlayMove = createMove({
		id: 492,
		type: "Dark",
		base: 220,
		category: "Physical",
	});
	const fpAttacker = genTestMon({
		baseStat: { attack: 30 },
		effortValues: { attack: 0 },
		statRuleset: "mainSeries",
	});
	const fpDefender = genTestMon({
		baseStat: { hp: 60, attack: 80, defense: 60, specialDefense: 80 },
		statRuleset: "mainSeries",
	});
	const fp0 = new Battle({
		attacker: fpAttacker,
		defender: fpDefender,
		move: foulPlayMove,
	}).getDamage();
	const fp252 = new Battle({
		attacker: genTestMon({
			...fpAttacker,
			effortValues: { ...fpAttacker.effortValues, attack: 252 },
		}),
		defender: fpDefender,
		move: foulPlayMove,
	}).getDamage();
	expect(fp252.rolls[0]?.number ?? 0).toBe(fp0.rolls[0]?.number ?? 0);
	const fpLowerDefAtk = new Battle({
		attacker: fpAttacker,
		defender: genTestMon({
			...fpDefender,
			effortValues: { ...fpDefender.effortValues, attack: 252 },
		}),
		move: foulPlayMove,
	}).getDamage();
	expect(fpLowerDefAtk.rolls[0]?.number ?? 0).toBeGreaterThan(
		fp0.rolls[0]?.number ?? 0,
	);
	const fpDefReq = assertDefRequirement({
		attacker: fpAttacker,
		defender: fpDefender,
		move: foulPlayMove,
		target: { type: "chance", value: 95 },
	});
	expect(fpDefReq?.defAxis).toBe("defense");

	const psyRes = assertDefRequirement({
		attacker: genTestMon({
			baseStat: { specialAttack: 130 },
			effortValues: { specialAttack: 252 },
			statRuleset: "mainSeries",
		}),
		defender: genTestMon({
			baseStat: { hp: 95, defense: 120, specialDefense: 60 },
			statRuleset: "mainSeries",
		}),
		move: createMove({
			id: 473,
			type: "Psychic",
			base: 80,
			category: "Special",
		}),
		target: { type: "guaranteed-2hit" },
	});
	expect(psyRes?.defAxis).toBe("defense");

	const teraRes = assertDefRequirement({
		attacker: genTestMon({
			id: 6,
			specialForm: "Tera",
			teraType: "Fire",
			baseStat: { attack: 150, specialAttack: 60 },
			effortValues: { attack: 252 },
			statRuleset: "mainSeries",
		}),
		defender: genTestMon({
			baseStat: { hp: 100, defense: 120, specialDefense: 70 },
			statRuleset: "mainSeries",
		}),
		move: createMove({
			id: 851,
			type: "Normal",
			base: 80,
			category: "Special",
		}),
		target: { type: "chance", value: 90 },
	});
	expect(teraRes?.defAxis).toBe("defense");
});

test("ruleset EV caps and failure coverage", () => {
	const attacker = genTestMon({
		statRuleset: "champions",
		baseStat: { attack: 120 },
		effortValues: { speed: 32, specialAttack: 32 },
	});
	const defender = genTestMon({
		statRuleset: "champions",
		baseStat: { hp: 95, defense: 95, specialDefense: 95 },
		effortValues: { attack: 32 },
	});
	const d = getMinDefRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 100, category: "Physical" }),
		target: { type: "chance", value: 1 },
	});
	expect(d.satisfied).toBe(true);
	if (d.satisfied) {
		const total = Object.values({
			...defender.effortValues,
			...d.investment,
		}).reduce((a, b) => a + b, 0);
		expect(total).toBeLessThanOrEqual(66);
		expect(d.investment.hp ?? 0).toBeLessThanOrEqual(32);
	}
	const impossibleDef = getMinDefRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 400, category: "Physical" }),
		target: { type: "guaranteed" },
	});
	expect(impossibleDef.satisfied).toBe(false);

	const impossibleAtk = getMinAtkRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 1, category: "Physical" }),
		target: { type: "guaranteed" },
	});
	expect(impossibleAtk.satisfied).toBe(false);

	const zeroReq = getMinAtkRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 120, category: "Physical" }),
		target: { type: "chance", value: 0 },
	});
	expect(zeroReq.satisfied).toBe(true);
	if (zeroReq.satisfied) expect(Object.values(zeroReq.investment)[0]).toBe(0);
});

test("mainSeries EV-cap boundaries include unrelated EVs", () => {
	const attacker = genTestMon({
		statRuleset: "mainSeries",
		baseStat: { attack: 130 },
		effortValues: { speed: 252, specialAttack: 252 },
	});
	const defender = genTestMon({
		statRuleset: "mainSeries",
		baseStat: { hp: 90, defense: 90, specialDefense: 90 },
		effortValues: { speed: 252, attack: 252 },
	});
	const atkRes = getMinAtkRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 120, category: "Physical" }),
		target: { type: "chance", value: 0 },
	});
	expect(atkRes.satisfied).toBe(true);
	if (atkRes.satisfied) {
		const total = Object.values({
			...attacker.effortValues,
			...atkRes.investment,
		}).reduce((a, b) => a + b, 0);
		expect(total).toBeLessThanOrEqual(510);
		const invested =
			atkRes.investment.attack ??
			atkRes.investment.specialAttack ??
			atkRes.investment.defense ??
			0;
		expect(invested).toBeLessThanOrEqual(252);
	}
	const defRes = getMinDefRequirement({
		attacker,
		defender,
		move: createMove({ type: "Normal", base: 120, category: "Physical" }),
		target: { type: "chance", value: 0 },
	});
	expect(defRes.satisfied).toBe(true);
	if (defRes.satisfied) {
		const total = Object.values({
			...defender.effortValues,
			...defRes.investment,
		}).reduce((a, b) => a + b, 0);
		expect(total).toBeLessThanOrEqual(510);
		expect(defRes.investment.hp ?? 0).toBeLessThanOrEqual(252);
		const axis = "defense" in defRes.investment ? "defense" : "specialDefense";
		expect(defRes.investment[axis] ?? 0).toBeLessThanOrEqual(252);
	}
});

test("champions real-world tuned cases from manual verification", () => {
	const championsAtk = assertAtkRequirement({
		attacker: genTestMon({
			statRuleset: "champions",
			level: 50,
			types: ["Electric"],
			baseStat: {
				hp: 80,
				attack: 70,
				defense: 70,
				specialAttack: 125,
				specialDefense: 80,
				speed: 110,
			},
			nature: { plus: "specialAttack", minus: "attack" },
		}),
		defender: genTestMon({
			statRuleset: "champions",
			level: 50,
			types: ["Water"],
			baseStat: {
				hp: 100,
				attack: 70,
				defense: 90,
				specialAttack: 70,
				specialDefense: 95,
				speed: 60,
			},
			nature: { plus: "specialDefense", minus: "attack" },
		}),
		move: createMove({
			type: "Electric",
			base: 55,
			category: "Special",
		}),
		target: { type: "guaranteed-2hit" },
	});
	expect(championsAtk?.axis).toBe("specialAttack");
	expect(championsAtk?.ev).toBe(17);

	const championsDef = assertDefRequirement({
		attacker: genTestMon({
			statRuleset: "champions",
			level: 50,
			types: ["Fire"],
			baseStat: {
				hp: 84,
				attack: 78,
				defense: 78,
				specialAttack: 109,
				specialDefense: 85,
				speed: 100,
			},
		}),
		defender: genTestMon({
			statRuleset: "champions",
			level: 50,
			types: ["Steel", "Fairy"],
			baseStat: {
				hp: 95,
				attack: 80,
				defense: 115,
				specialAttack: 95,
				specialDefense: 110,
				speed: 50,
			},
		}),
		move: createMove({
			type: "Fire",
			base: 90,
			category: "Special",
		}),
		field: { weather: "Sun" },
		target: { type: "chance", value: 75 },
	});
	expect(championsDef?.defAxis).toBe("specialDefense");
	expect(championsDef?.hp).toBe(1);
	expect(championsDef?.dv).toBe(1);
});

test("boundary target semantics stay stable", () => {
	expect(
		meetsTarget("atk", 100, { type: "chance", value: 100 }, 100, [
			{ number: 50 },
		]),
	).toBe(true);
	expect(
		meetsTarget("atk", 100, { type: "guaranteed-2hit" }, 50, [{ number: 50 }]),
	).toBe(true);
	expect(
		meetsTarget("def", 100, { type: "guaranteed-2hit" }, 50, [{ number: 50 }]),
	).toBe(false);
});

test("getMinAtkRequirement does not optimize defender Attack for Foul Play", () => {
	const foulPlayMove = createMove({
		id: 492,
		type: "Dark",
		base: 220,
		category: "Physical",
	});
	const attacker = genTestMon({
		baseStat: { attack: 30 },
		effortValues: { attack: 0 },
		statRuleset: "mainSeries",
	});
	const defender = genTestMon({
		baseStat: { hp: 100, attack: 80, defense: 80, specialDefense: 80 },
		effortValues: { hp: 0, attack: 0, defense: 0, specialDefense: 0, speed: 0 },
		statRuleset: "mainSeries",
	});
	const defenderAtk252 = genTestMon({
		...defender,
		effortValues: { ...defender.effortValues, attack: 252 },
	});
	const lowAtkDamage = new Battle({
		attacker,
		defender,
		move: foulPlayMove,
	}).getDamage();
	const highAtkDamage = new Battle({
		attacker,
		defender: defenderAtk252,
		move: foulPlayMove,
	}).getDamage();
	expect(highAtkDamage.rolls[0]?.number ?? 0).toBeGreaterThan(
		lowAtkDamage.rolls[0]?.number ?? 0,
	);
	const target = {
		type: "chance",
		value: 1,
	} as const;
	const req = getMinAtkRequirement({
		attacker,
		defender,
		move: foulPlayMove,
		target,
	});
	expect(req.satisfied).toBe(false);
	if (!req.satisfied) expect(req.reason.length).toBeGreaterThan(0);
});

// TODO: add fixture-level deterministic tie-break assertion for equal-total (hp + defense-axis)
// candidates; expected behavior is lower HP wins when totals are equal.
