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
	expect(power).toBe(95);
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
	expect(power).toBe(114);
});
