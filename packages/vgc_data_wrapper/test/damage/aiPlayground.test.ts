import { expect, test } from "bun:test";
import {
	buildAiPlaygroundSnapshot,
	buildGroundingNotes,
	createPlaygroundPanels,
} from "../../src/aiPlayground";

const validInput = {
	attacker: {
		statMode: "derived" as const,
		types: ["Ghost", "Fairy"] as const,
		baseStat: {
			hp: 55,
			attack: 55,
			defense: 55,
			specialAttack: 135,
			specialDefense: 135,
			speed: 135,
		},
	},
	defender: {
		statMode: "manual" as const,
		types: ["Ground", "Flying"] as const,
		stats: {
			hp: 165,
			attack: 145,
			defense: 110,
			specialAttack: 112,
			specialDefense: 100,
			speed: 143,
		},
	},
	move: {
		base: 95,
		type: "Fairy" as const,
		category: "Special" as const,
		target: "selectedTarget" as const,
	},
};

test("buildAiPlaygroundSnapshot includes validation, normalized input, and result", () => {
	const snapshot = buildAiPlaygroundSnapshot(validInput);
	expect(snapshot.validation.isValid).toBe(true);
	expect(snapshot.normalizedInput).not.toBeNull();
	expect(snapshot.result).not.toBeNull();
	expect(snapshot.groundingNotes).toContain("field.isDouble defaulted to true");
});

test("buildAiPlaygroundSnapshot returns schema issues for invalid input", () => {
	const snapshot = buildAiPlaygroundSnapshot({ attacker: {} });
	expect(snapshot.validation.isValid).toBe(false);
	expect(snapshot.validation.issues.length).toBeGreaterThan(0);
	expect(snapshot.normalizedInput).toBeNull();
	expect(snapshot.result).toBeNull();
});

test("createPlaygroundPanels creates all first-phase observability panels", () => {
	const snapshot = buildAiPlaygroundSnapshot(validInput);
	const panels = createPlaygroundPanels(snapshot, "Guaranteed OHKO");
	expect(panels.map((panel) => panel.id)).toEqual([
		"raw-structured-input",
		"schema-validation-result",
		"normalized-defaulted-input",
		"raw-damage-result",
		"ai-explanation",
		"grounding-validation-notes",
	]);
	const notes =
		(panels[5]?.json as { notes: string[] } | undefined)?.notes ?? [];
	expect(notes.length).toBeGreaterThan(0);
});

test("buildGroundingNotes catches deterministic mismatch", () => {
	const snapshot = buildAiPlaygroundSnapshot(validInput);
	const notes = buildGroundingNotes(
		snapshot.result ?? { koChance: 0, rolls: [], factors: {} as never },
		"Guaranteed OHKO",
	);
	expect(notes.length).toBeGreaterThan(0);
});
