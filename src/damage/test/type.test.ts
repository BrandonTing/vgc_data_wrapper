import { expect, test } from "bun:test";
import { getEffectivenessOnPokemon } from "../type";

test("normal move hit normal type should be 1x effective", () => {
	const effectiveness = getEffectivenessOnPokemon("Normal", ["Normal"]);
	expect(effectiveness).toBe(1);
});

test("normal move hit steel type should be 0.5x effective", () => {
	const effectiveness = getEffectivenessOnPokemon("Normal", ["Steel"]);
	expect(effectiveness).toBe(0.5);
});

test("normal move hit steel & rock type should be 0.25x effective", () => {
	const effectiveness = getEffectivenessOnPokemon("Normal", ["Steel", "Rock"]);
	expect(effectiveness).toBe(0.25);
});

test("normal move hit ghost type should be 0x effective", () => {
	let effectiveness = getEffectivenessOnPokemon("Normal", ["Ghost"]);
	expect(effectiveness).toBe(0);
	effectiveness = getEffectivenessOnPokemon("Normal", ["Steel", "Ghost"]);
	expect(effectiveness).toBe(0);
});

test("fight move hit steel type should be 2x effective", () => {
	const effectiveness = getEffectivenessOnPokemon("Fighting", ["Steel"]);
	expect(effectiveness).toBe(2);
});

test("fight move hit steel & Rock type should be 4x effective", () => {
	const effectiveness = getEffectivenessOnPokemon("Fighting", [
		"Steel",
		"Rock",
	]);
	expect(effectiveness).toBe(4);
});

test("fight move hit steel type should be 1x effective", () => {
	const effectiveness = getEffectivenessOnPokemon("Fighting", ["Steel", "Bug"]);
	expect(effectiveness).toBe(1);
});
