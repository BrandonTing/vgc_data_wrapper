import { expect, test } from "bun:test";
import { Pokemon } from "../../src/pokemon";

test("0 investmented incineroar should have 170 hp & 135 attack", () => {
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

test("252 ha investmented incineroar should have 202 hp & 167 attack", () => {
	const incineroar = new Pokemon({
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

test("252a investmented +a nature incineroar should have 183 attack", () => {
	const incineroar = new Pokemon({
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
	const expectedAtk = 183;
	const actualStat = incineroar.getStats();
	expect(actualStat.attack).toBe(expectedAtk);
});
test("0a investmented -a nature incineroar should have 121 attack", () => {
	const incineroar = new Pokemon({
		baseStat: {
			attack: 115,
		},
		nature: {
			minus: "attack",
		},
	});
	const expectedAtk = 121;
	const actualStat = incineroar.getStats();
	expect(actualStat.attack).toBe(expectedAtk);
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
