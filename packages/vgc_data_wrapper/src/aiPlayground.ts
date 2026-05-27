import {
	type AiDamageCalcInput,
	AiDamageCalcInputSchema,
	normalizeAiDamageCalcInput,
	safeCalculateAiDamage,
} from "./aiDamage";
import type { DamageResult } from "./damage/config";

export type SchemaValidationIssue = {
	path: string;
	message: string;
};

export type PlaygroundSnapshot = {
	rawInput: unknown;
	validation: {
		isValid: boolean;
		issues: SchemaValidationIssue[];
	};
	normalizedInput: ReturnType<typeof normalizeAiDamageCalcInput> | null;
	result: DamageResult | null;
	groundingNotes: string[];
};

export function buildAiPlaygroundSnapshot(
	rawInput: unknown,
): PlaygroundSnapshot {
	const parsed = AiDamageCalcInputSchema.safeParse(rawInput);
	if (!parsed.success) {
		return {
			rawInput,
			validation: {
				isValid: false,
				issues: parsed.error.issues.map((issue) => ({
					path: issue.path.join(".") || "root",
					message: issue.message,
				})),
			},
			normalizedInput: null,
			result: null,
			groundingNotes: [],
		};
	}

	const normalizedInput = normalizeAiDamageCalcInput(parsed.data);
	const result = safeCalculateAiDamage(parsed.data);

	return {
		rawInput,
		validation: { isValid: true, issues: [] },
		normalizedInput,
		result,
		groundingNotes: collectDefaultNotes(parsed.data),
	};
}

export function buildGroundingNotes(
	result: DamageResult,
	aiExplanation: string,
): string[] {
	const notes: string[] = [];
	const hasGuaranteedClaim = /guaranteed\s+ohko/i.test(aiExplanation);
	if (hasGuaranteedClaim && result.koChance < 1) {
		notes.push(
			"AI claims guaranteed OHKO, but deterministic koChance is below 100%.",
		);
	}
	const hasZeroChanceClaim = /no\s+chance\s+to\s+ohko/i.test(aiExplanation);
	if (hasZeroChanceClaim && result.koChance > 0) {
		notes.push(
			"AI claims no OHKO chance, but deterministic koChance is above 0%.",
		);
	}
	return notes;
}

export type PlaygroundPanel = {
	id:
		| "raw-structured-input"
		| "schema-validation-result"
		| "normalized-defaulted-input"
		| "raw-damage-result"
		| "ai-explanation"
		| "grounding-validation-notes";
	title: string;
	json?: unknown;
	text?: string;
};

export function createPlaygroundPanels(
	snapshot: PlaygroundSnapshot,
	aiExplanation = "",
): PlaygroundPanel[] {
	const groundingNotes = snapshot.result
		? [
				...snapshot.groundingNotes,
				...buildGroundingNotes(snapshot.result, aiExplanation),
			]
		: snapshot.groundingNotes;
	return [
		{
			id: "raw-structured-input",
			title: "Raw Structured Input",
			json: snapshot.rawInput,
		},
		{
			id: "schema-validation-result",
			title: "Schema Validation Result",
			json: snapshot.validation,
		},
		{
			id: "normalized-defaulted-input",
			title: "Normalized / Defaulted Input",
			json: snapshot.normalizedInput,
		},
		{
			id: "raw-damage-result",
			title: "Raw DamageResult",
			json: snapshot.result,
		},
		{
			id: "ai-explanation",
			title: "AI Explanation",
			text: aiExplanation,
		},
		{
			id: "grounding-validation-notes",
			title: "Grounding / Validation Notes",
			json: { notes: groundingNotes },
		},
	];
}
function collectDefaultNotes(input: AiDamageCalcInput): string[] {
	const notes: string[] = [];
	for (const side of ["attacker", "defender"] as const) {
		const battler = input[side];
		if (battler.level === undefined)
			notes.push(`${side}.level defaulted to 50`);
		if (!battler.effortValues)
			notes.push(`${side}.effortValues defaulted to all 0`);
		if (!battler.individualValues)
			notes.push(`${side}.individualValues defaulted to all 31`);
		if (!battler.statStage) notes.push(`${side}.statStage defaulted to all 0`);
		if (battler.status === undefined)
			notes.push(`${side}.status defaulted to Healthy`);
		if (battler.specialForm === undefined)
			notes.push(`${side}.specialForm defaulted to None`);
	}
	if (input.field?.isDouble === undefined) {
		notes.push("field.isDouble defaulted to true");
	}
	return notes;
}
