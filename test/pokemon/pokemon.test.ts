import { expect, test } from "bun:test";
import { optimizeEVAndNature, Pokemon } from "../../src/pokemon";

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
		effortValues: { attack: 32 },
	});
	expect(incineroar.getStat("attack")).toBe(167);
});

test("champions ability adjustment supports 0.9 / 1 / 1.1", () => {
	const base = {
		baseStat: { attack: 115 },
		effortValues: { attack: 32 },
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
				effortValues: {
					attack: 33,
				},
			}),
	).toThrow();
});

test("champions total ability points max is 66", () => {
	expect(
		() =>
			new Pokemon({
				effortValues: {
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

test("champions optimizer should find lower-EV equivalent spreads", () => {
	const pokemon = new Pokemon({
		statRuleset: "champions",
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
		},
		effortValues: {
			defense: 11,
		},
	});

	const result = optimizeEVAndNature(pokemon);
	expect(result.foundImprovement).toBe(true);
	if (!result.foundImprovement) {
		throw new Error("Expected improvement");
	}

	expect(result.optimized.effortValues.speed).toBe(9);
	expect(result.optimized.nature).toEqual({
		plus: "defense",
		minus: "speed",
	});
	expect(result.savedEffortValues).toBe(2);
	expect(result.original.stats).toEqual(result.optimized.stats);
});

test("optimizer should preserve valid breakpoint EVs", () => {
	const pokemon = new Pokemon({
		statRuleset: "champions",
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
		},
		effortValues: {
			attack: 32,
		},
		nature: {
			plus: "attack",
			minus: "speed",
		},
	});

	const result = optimizeEVAndNature(pokemon);
	expect(result.foundImprovement).toBe(false);
});

test("optimizer should have deterministic tie-breaks", () => {
	const pokemon = new Pokemon({
		statRuleset: "champions",
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
		},
		effortValues: {
			attack: 1,
			defense: 2,
		},
		nature: {
			plus: "attack",
			minus: "speed",
		},
	});

	const first = optimizeEVAndNature(pokemon);
	const second = optimizeEVAndNature(pokemon);

	expect(first).toEqual(second);
	if (first.foundImprovement) {
		expect(first.optimized.nature).toEqual(pokemon.nature);
	}
});

test("optimizer should throw on inconsistent manual stats", () => {
	const pokemon = new Pokemon({
		statRuleset: "champions",
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
		},
		effortValues: {
			attack: 4,
		},
		stats: {
			attack: 999,
		},
	});

	expect(() => optimizeEVAndNature(pokemon)).toThrow(
		"Provided manual stats are inconsistent",
	);
});

test("optimizer should preserve minus target when input nature has minus", () => {
	const pokemon = new Pokemon({
		statRuleset: "champions",
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
		},
		effortValues: {
			attack: 10,
			defense: 11,
		},
		nature: {
			minus: "specialAttack",
		},
	});

	const result = optimizeEVAndNature(pokemon, {
		statAcceptReduction: ["specialAttack"],
	});

	if (result.foundImprovement) {
		expect(result.optimized.nature.minus).toBe("specialAttack");
	}
});

test("optimizer should allow lowered non-HP stats when statAcceptReduction is set", () => {
	const pokemon = new Pokemon({
		statRuleset: "champions",
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
		},
		effortValues: {
			attack: 10,
			specialAttack: 10,
			speed: 11,
		},
		nature: {
			plus: "attack",
			minus: "speed",
		},
	});

	const result = optimizeEVAndNature(pokemon, {
		statAcceptReduction: ["specialAttack"],
	});
	expect(result.foundImprovement).toBe(true);
	if (!result.foundImprovement) {
		throw new Error("Expected improvement");
	}
	expect(result.optimized.nature.minus).toBe("speed");
	expect(result.optimized.stats.specialAttack).toBeLessThanOrEqual(
		result.original.stats.specialAttack,
	);
	expect(result.optimized.stats.attack).toBe(result.original.stats.attack);
	expect(result.optimized.stats.speed).toBe(result.original.stats.speed);
});

test("optimizer should reject hp in statAcceptReduction", () => {
	const pokemon = new Pokemon({
		statRuleset: "champions",
	});
	expect(() =>
		optimizeEVAndNature(pokemon, {
			statAcceptReduction: ["hp"],
		}),
	).toThrow("HP reduction is not supported");
});
