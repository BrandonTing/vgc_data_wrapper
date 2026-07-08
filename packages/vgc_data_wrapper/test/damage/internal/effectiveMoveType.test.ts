import { expect, test } from "bun:test";
import { createMove } from "../../../src";
import { getEffectiveMoveType } from "../../../src/damage/effectiveMoveType";
import { genTestMon } from "../utils";

test("Terrain Pulse uses terrain type for grounded attackers", () => {
	const attacker = genTestMon();
	const terrainPulse = createMove({ id: 805, type: "Normal" });

	expect(
		getEffectiveMoveType(attacker, terrainPulse, { terrain: "Electric" }),
	).toBe("Electric");
	expect(
		getEffectiveMoveType(attacker, terrainPulse, { terrain: "Grassy" }),
	).toBe("Grass");
	expect(
		getEffectiveMoveType(attacker, terrainPulse, { terrain: "Misty" }),
	).toBe("Fairy");
	expect(
		getEffectiveMoveType(attacker, terrainPulse, { terrain: "Psychic" }),
	).toBe("Psychic");
});

test("Terrain Pulse stays Normal without terrain or an ungrounded attacker", () => {
	const terrainPulse = createMove({ id: 805, type: "Normal" });
	const groundedAttacker = genTestMon();
	const flyingAttacker = genTestMon({ types: ["Flying"] });

	expect(getEffectiveMoveType(groundedAttacker, terrainPulse)).toBe("Normal");
	expect(
		getEffectiveMoveType(flyingAttacker, terrainPulse, { terrain: "Electric" }),
	).toBe("Normal");
});
