import { expect, test } from "bun:test";
import { Pokemon } from "../../src/damage/pokemon";

test("0 investmented incineroar should have 170 hp & 135 attack", () => {
	const incineroar = new Pokemon({
		id: 727,
		level: 50,
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
		id: 727,
		level: 50,
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
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
		id: 727,
		level: 50,
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
		},
		effortValues: {
			hp: 0,
			attack: 252,
			defense: 0,
			specialAttack: 0,
			specialDefense: 0,
			speed: 0,
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
		id: 727,
		level: 50,
		baseStat: {
			hp: 95,
			attack: 115,
			defense: 90,
			specialAttack: 80,
			specialDefense: 90,
			speed: 60,
		},
		effortValues: {
			hp: 0,
			attack: 0,
			defense: 0,
			specialAttack: 0,
			specialDefense: 0,
			speed: 0,
		},
		nature: {
			minus: "attack",
		},
	});
	const expectedAtk = 121;
	const actualStat = incineroar.getStats();
	expect(actualStat.attack).toBe(expectedAtk);
});
