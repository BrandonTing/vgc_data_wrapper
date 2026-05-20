import { expect, test } from "bun:test";
import { Pokemon } from "../../src/pokemon";

test("default champions path: 0 investment incineroar should have 170 hp & 135 attack", () => {
	const incineroar = new Pokemon({
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
		},
	});
	const expectedHP = 170;
	const expectedAtk = 135;
	const actualStat = incineroar.getStats();
	expect(actualStat.hp).toBe(expectedHP);
	expect(actualStat.attack).toBe(expectedAtk);
});

test("legacy main-series EV path uses floor(ev / 4)", () => {
	const incineroar = new Pokemon({
		statRuleset: "mainSeries",
		baseStat: {
			hp: 95,
			attack: 115,
		},
		effortValues: {
			hp: 252,
			attack: 252,
		},
	});
	const expectedHP = 202;
	const expectedAtk = 167;
	const actualStat = incineroar.getStats();
	expect(actualStat.hp).toBe(expectedHP);
	expect(actualStat.attack).toBe(expectedAtk);
});

test("legacy +nature still applies 1.1", () => {
	const incineroar = new Pokemon({
		statRuleset: "mainSeries",
		baseStat: {
			attack: 115,
		},
		effortValues: {
			attack: 252,
		},
		nature: {
			plus: "attack",
		},
	});
	expect(incineroar.getStats().attack).toBe(183);
});

test("legacy -nature still applies 0.9", () => {
	const incineroar = new Pokemon({
		statRuleset: "mainSeries",
		baseStat: {
			attack: 115,
		},
		nature: {
			minus: "attack",
		},
	});
	expect(incineroar.getStats().attack).toBe(121);
});

test("champions path uses 2 * abilityPoint", () => {
	const incineroar = new Pokemon({
		baseStat: { attack: 115 },
		abilityPoints: { attack: 32 },
	});
	expect(incineroar.getStat("attack")).toBe(167);
});

test("champions ability adjustment supports 0.9 / 1 / 1.1", () => {
	const base = {
		baseStat: { attack: 115 },
		abilityPoints: { attack: 32 },
	} as const;
	expect(new Pokemon(base).getStat("attack")).toBe(167);
	expect(
		new Pokemon({ ...base, nature: { plus: "attack" } }).getStat("attack"),
	).toBe(183);
	expect(
		new Pokemon({ ...base, nature: { minus: "attack" } }).getStat("attack"),
	).toBe(150);
});

test("champions per-stat max is 32", () => {
	expect(
		() =>
			new Pokemon({
				abilityPoints: {
					attack: 33,
				},
			}),
	).toThrow();
});

test("champions total ability points max is 66", () => {
	expect(
		() =>
			new Pokemon({
				abilityPoints: {
					hp: 12,
					attack: 12,
					defense: 12,
					specialAttack: 12,
					specialDefense: 12,
					speed: 12,
				},
			}),
	).toThrow();
});

test("stage modified stat should return integer value", () => {
	const mon = new Pokemon({
		stats: {
			attack: 100,
		},
		statStage: {
			attack: -1,
		},
	});
	const actualAtk = mon.getStat("attack");
	expect(actualAtk).toBe(66);
});

test("get base stat from pokeapi if id is provided", async () => {
	const incineroar = new Pokemon();
	await incineroar.initWithId(727);
	const expectedHP = 170;
	const expectedAtk = 135;
	const actualStat = incineroar.getStats();
	expect(actualStat.hp).toBe(expectedHP);
	expect(actualStat.attack).toBe(expectedAtk);
});
