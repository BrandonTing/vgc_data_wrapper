import { expect, test } from "bun:test";
import { getPasteFromPokemons, getPokemonFromPaste } from "../../src";

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
Earthquake
Superpower
Rock Slide
U-turn
`);
	expect(landorusTherian.gender).toEqual("Male");
	expect(landorusTherian.types).toEqual(["Ground", "Flying"]);
});
