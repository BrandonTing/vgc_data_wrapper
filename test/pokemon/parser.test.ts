import { afterEach, beforeEach, expect, test } from "bun:test";
import { getPasteFromPokemons, getPokemonFromPaste } from "../../src";

const originalFetch = globalThis.fetch;

beforeEach(() => {
	globalThis.fetch = (async (input: string | URL | Request) => {
		const url = input.toString();
		const isLandorus = url.includes("landorus-therian");
		return {
			json: async () => ({
				id: isLandorus ? 645 : 727,
				weight: isLandorus ? 680 : 830,
				types: isLandorus
					? [{ type: { name: "ground" } }, { type: { name: "flying" } }]
					: [{ type: { name: "fire" } }, { type: { name: "dark" } }],
				stats: isLandorus
					? [
							{ base_stat: 89, stat: { name: "hp" } },
							{ base_stat: 145, stat: { name: "attack" } },
							{ base_stat: 90, stat: { name: "defense" } },
							{ base_stat: 105, stat: { name: "special-attack" } },
							{ base_stat: 80, stat: { name: "special-defense" } },
							{ base_stat: 91, stat: { name: "speed" } },
						]
					: [
							{ base_stat: 95, stat: { name: "hp" } },
							{ base_stat: 115, stat: { name: "attack" } },
							{ base_stat: 90, stat: { name: "defense" } },
							{ base_stat: 80, stat: { name: "special-attack" } },
							{ base_stat: 90, stat: { name: "special-defense" } },
							{ base_stat: 60, stat: { name: "speed" } },
						],
				sprites: { front_default: "https://img.test/mon.png" },
			}),
		} as unknown as Response;
	}) as typeof fetch;
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("parse paste successfully", async () => {
	const incineroar = await getPokemonFromPaste(`
Incineroar @ Sitrus Berry  
Ability: Intimidate  
Level: 50  
Tera Type: Water  
EVs: 236 HP / 4 Atk / 76 Def / 156 SpD / 36 Spe  
Careful Nature  
- Knock Off  
- Flare Blitz  
- Parting Shot  
- Fake Out  
`);
	expect(incineroar.teraType).toBe("Water");
	expect(incineroar.types).toEqual(["Fire", "Dark"]);
	const paste = getPasteFromPokemons([incineroar]);
	const reParsedIncineroar = await getPokemonFromPaste(paste);
	expect(reParsedIncineroar.teraType).toBe("Water");
	expect(reParsedIncineroar.types).toEqual(["Fire", "Dark"]);
	expect(reParsedIncineroar.weight).toEqual(83);
});

test("parse Landorus-Therian successfully", async () => {
	const landorusTherian = await getPokemonFromPaste(`
Landorus-Therian (M) @ Choice Scarf
Ability: Intimidate
Level: 50
EVs: 196 HP / 60 Atk / 4 Def / 20 SpD / 228 Spe
Adamant Nature
- Earthquake
- Superpower
- Rock Slide
- U-turn
`);
	expect(landorusTherian.gender).toEqual("Male");
	expect(landorusTherian.types).toEqual(["Ground", "Flying"]);
});
