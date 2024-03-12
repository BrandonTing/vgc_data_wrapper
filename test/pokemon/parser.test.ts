import { expect, test } from "bun:test";
import { getPokemonFromPaste } from "../../src";

function getTestPaste() {
	return `
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
`;
}

test("parse paste successfully", async () => {
	const incineroar = await getPokemonFromPaste(getTestPaste());
	expect(incineroar.teraType).toBe("Water");
	expect(incineroar.types).toEqual(["Fire", "Dark"]);
});
