import { expect, test } from "bun:test";
import type { AiDamageCalcInput } from "../../src/aiDamage";
import {
	AiDamageCalcInputSchema,
	calculateAiDamage,
	normalizeAiDamageCalcInput,
	safeCalculateAiDamage,
} from "../../src/aiDamage";

const derivedManualInput: AiDamageCalcInput = {
	attacker: {
		statMode: "derived",
		types: ["Ghost", "Fairy"],
		baseStat: {
			hp: 55,
			attack: 55,
			defense: 55,
			specialAttack: 135,
			specialDefense: 135,
			speed: 135,
		},
		level: 50,
		effortValues: { hp: 4, specialAttack: 252, speed: 252 },
		individualValues: { attack: 0 },
		statRuleset: "mainSeries",
		specialForm: "Tera",
	},
	defender: {
		statMode: "manual",
		types: ["Ground", "Flying"],
		stats: {
			hp: 165,
			attack: 165,
			defense: 110,
			specialAttack: 112,
			specialDefense: 100,
			speed: 143,
		},
		statStage: { specialDefense: -1 },
	},
	move: {
		base: 95,
		type: "Fairy",
		category: "Special",
		target: "selectedTarget",
	},
	field: { isDouble: true },
};

test("schema accepts valid derived attacker + manual defender", () => {
	expect(() => AiDamageCalcInputSchema.parse(derivedManualInput)).not.toThrow();
});

test("schema accepts minimal mechanical-default input", () => {
	expect(() =>
		AiDamageCalcInputSchema.parse({
			attacker: {
				statMode: "derived",
				types: ["Normal"],
				baseStat: {
					hp: 100,
					attack: 100,
					defense: 100,
					specialAttack: 100,
					specialDefense: 100,
					speed: 100,
				},
			},
			defender: {
				statMode: "manual",
				types: ["Normal"],
				stats: {
					hp: 100,
					attack: 100,
					defense: 100,
					specialAttack: 100,
					specialDefense: 100,
					speed: 100,
				},
			},
			move: {
				base: 100,
				type: "Normal",
				category: "Special",
				target: "selectedTarget",
			},
		}),
	).not.toThrow();
});

test("strict unknown-key rejection", () => {
	expect(() =>
		AiDamageCalcInputSchema.parse({ ...derivedManualInput, x: 1 }),
	).toThrow();
});

test("shorthand keys rejected", () => {
	expect(() =>
		AiDamageCalcInputSchema.parse({
			...derivedManualInput,
			defender: { ...derivedManualInput.defender, stats: { hp: 1, atk: 2 } },
		}),
	).toThrow();
});

test("isChampion and calcContext rejected", () => {
	expect(() =>
		AiDamageCalcInputSchema.parse({ ...derivedManualInput, isChampion: true }),
	).toThrow();
	expect(() =>
		AiDamageCalcInputSchema.parse({ ...derivedManualInput, calcContext: {} }),
	).toThrow();
});

test("manual mode uses stats as authoritative", () => {
	const r1 = calculateAiDamage({
		...derivedManualInput,
		defender: {
			...derivedManualInput.defender,
			baseStat: {
				hp: 1,
				attack: 1,
				defense: 1,
				specialAttack: 1,
				specialDefense: 1,
				speed: 1,
			},
			effortValues: { hp: 0 },
		},
	});
	const r2 = calculateAiDamage(derivedManualInput);
	expect(r1.rolls).toEqual(r2.rolls);
});

test("default materialization works", () => {
	const normalized = normalizeAiDamageCalcInput({
		attacker: {
			statMode: "derived",
			types: ["Normal"],
			baseStat: {
				hp: 100,
				attack: 100,
				defense: 100,
				specialAttack: 100,
				specialDefense: 100,
				speed: 100,
			},
		},
		defender: {
			statMode: "manual",
			types: ["Normal"],
			stats: {
				hp: 100,
				attack: 100,
				defense: 100,
				specialAttack: 100,
				specialDefense: 100,
				speed: 100,
			},
		},
		move: {
			base: 100,
			type: "Normal",
			category: "Special",
			target: "selectedTarget",
		},
	});
	expect(normalized.attacker.level).toBe(50);
	expect(normalized.attacker.status).toBe("Healthy");
	expect(normalized.attacker.effortValues.hp).toBe(0);
	expect(normalized.attacker.individualValues.hp).toBe(31);
	expect(normalized.field.isDouble).toBe(true);
});

test("output compatible with DamageResult and safe wrapper", () => {
	const result = safeCalculateAiDamage(derivedManualInput);
	expect(Array.isArray(result.rolls)).toBe(true);
	expect(typeof result.koChance).toBe("number");
	expect(result.factors.attacker).toBeObject();
});

test("invalid EV totals rejected based on statRuleset", () => {
	expect(() =>
		AiDamageCalcInputSchema.parse({
			...derivedManualInput,
			attacker: {
				...derivedManualInput.attacker,
				effortValues: { hp: 252, attack: 252, defense: 252 },
				statRuleset: "mainSeries",
			},
		}),
	).toThrow();
	expect(() =>
		AiDamageCalcInputSchema.parse({
			...derivedManualInput,
			attacker: {
				...derivedManualInput.attacker,
				effortValues: { hp: 33 },
				statRuleset: "champions",
			},
		}),
	).toThrow();
});
