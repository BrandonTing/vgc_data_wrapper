import { expect, test } from "bun:test";
import { createMove } from "../../../src";
import { getPower } from "../../../src/damage/power";
import { genTestMon } from "../utils";

test("get power without any modifiers", () => {
	const expected = 95;
	const testMon = genTestMon();
	const testMove = createMove({
		base: expected,
		type: "Normal",
		category: "Physical",
	});
	const power = getPower({
		attacker: testMon,
		defender: testMon,
		move: testMove,
		field: {},
	});
	expect(power.operator).toBe(95);
	expect(power.factors).toEqual({
		attacker: {},
		defender: {},
		move: {},
		field: {},
	});
});

test("get power with type enhancing item", () => {
	const expected = 95;
	const testMon = genTestMon({
		item: "Type Enhancing",
	});
	const testMove = createMove({
		base: expected,
		type: "Normal",
		category: "Physical",
	});
	const power = getPower({
		attacker: testMon,
		defender: testMon,
		move: testMove,
		field: {},
	});
	expect(power.operator).toBe(114);
	expect(power.factors?.attacker?.item).toBe(true);
});

test("terrain power modifiers only affect grounded Pokemon", () => {
	const groundedAttacker = genTestMon({ types: ["Electric"] });
	const flyingAttacker = genTestMon({ types: ["Electric", "Flying"] });
	const levitateAttacker = genTestMon({
		types: ["Electric"],
		ability: "Levitate",
	});
	const ironBallFlyingAttacker = genTestMon({
		types: ["Electric", "Flying"],
		item: "Iron Ball",
	});
	const teraFlyingAttacker = genTestMon({
		types: ["Electric"],
		specialForm: "Tera",
		teraType: "Flying",
	});
	const flyingTeraElectricAttacker = genTestMon({
		types: ["Electric", "Flying"],
		specialForm: "Tera",
		teraType: "Electric",
	});
	const defender = genTestMon();
	const move = createMove({
		base: 100,
		type: "Electric",
		category: "Special",
	});
	const field = { terrain: "Electric" as const };

	expect(
		getPower({ attacker: groundedAttacker, defender, move, field }).operator,
	).toBe(130);
	expect(
		getPower({ attacker: flyingAttacker, defender, move, field }).operator,
	).toBe(100);
	expect(
		getPower({ attacker: levitateAttacker, defender, move, field }).operator,
	).toBe(100);
	expect(
		getPower({ attacker: ironBallFlyingAttacker, defender, move, field })
			.operator,
	).toBe(130);
	expect(
		getPower({ attacker: teraFlyingAttacker, defender, move, field }).operator,
	).toBe(100);
	expect(
		getPower({ attacker: flyingTeraElectricAttacker, defender, move, field })
			.operator,
	).toBe(130);
});

test("Rising Voltage uses grounded defender checks", () => {
	const attacker = genTestMon();
	const groundedDefender = genTestMon();
	const flyingDefender = genTestMon({ types: ["Flying"] });
	const levitateDefender = genTestMon({ ability: "Levitate" });
	const ironBallFlyingDefender = genTestMon({
		types: ["Flying"],
		item: "Iron Ball",
	});
	const teraFlyingDefender = genTestMon({
		types: ["Normal"],
		specialForm: "Tera",
		teraType: "Flying",
	});
	const flyingTeraNormalDefender = genTestMon({
		types: ["Flying"],
		specialForm: "Tera",
		teraType: "Normal",
	});
	const move = createMove({
		id: 804,
		base: 70,
		type: "Electric",
		category: "Special",
	});
	const field = { terrain: "Electric" as const };

	expect(
		getPower({ attacker, defender: groundedDefender, move, field }).operator,
	).toBe(182);
	expect(
		getPower({ attacker, defender: flyingDefender, move, field }).operator,
	).toBe(91);
	expect(
		getPower({ attacker, defender: levitateDefender, move, field }).operator,
	).toBe(91);
	expect(
		getPower({ attacker, defender: ironBallFlyingDefender, move, field })
			.operator,
	).toBe(182);
	expect(
		getPower({ attacker, defender: teraFlyingDefender, move, field }).operator,
	).toBe(91);
	expect(
		getPower({ attacker, defender: flyingTeraNormalDefender, move, field })
			.operator,
	).toBe(182);
});

test("Misty Terrain Dragon reduction requires a grounded defender", () => {
	const attacker = genTestMon();
	const groundedDefender = genTestMon();
	const flyingDefender = genTestMon({ types: ["Flying"] });
	const levitateDefender = genTestMon({ ability: "Levitate" });
	const ironBallFlyingDefender = genTestMon({
		types: ["Flying"],
		item: "Iron Ball",
	});
	const move = createMove({
		base: 100,
		type: "Dragon",
		category: "Special",
	});
	const field = { terrain: "Misty" as const };

	expect(
		getPower({ attacker, defender: groundedDefender, move, field }).operator,
	).toBe(50);
	expect(
		getPower({ attacker, defender: flyingDefender, move, field }).operator,
	).toBe(100);
	expect(
		getPower({ attacker, defender: levitateDefender, move, field }).operator,
	).toBe(100);
	expect(
		getPower({ attacker, defender: ironBallFlyingDefender, move, field })
			.operator,
	).toBe(50);
});
