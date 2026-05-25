import { z } from "zod";
import { Battle, createMove } from "./damage";
import type { BattleFieldStatus, DamageResult, Move, Stat, TeraTypes, Type } from "./damage/config";
import { Pokemon } from "./pokemon";

const statSchema = z
	.object({
		hp: z.number().int().nonnegative(),
		attack: z.number().int().nonnegative(),
		defense: z.number().int().nonnegative(),
		specialAttack: z.number().int().nonnegative(),
		specialDefense: z.number().int().nonnegative(),
		speed: z.number().int().nonnegative(),
	})
	.strict();

const derivedOnlyStatSchema = z
	.object({
		hp: z.number().int().min(0),
		attack: z.number().int().min(0),
		defense: z.number().int().min(0),
		specialAttack: z.number().int().min(0),
		specialDefense: z.number().int().min(0),
		speed: z.number().int().min(0),
	})
	.strict();

const typeSchema = z.enum([
	"Normal","Fire","Water","Grass","Electric","Ice","Fighting","Poison","Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy",
]);
const teraTypeSchema = z.union([typeSchema, z.literal("Stellar")]);
const statusSchema = z.enum(["Healthy", "Burned", "Poisoned", "Badly Poisoned", "Asleep", "Frozen", "Paralyzed"]);
const specialFormSchema = z.enum(["None", "Mega", "Dynamax", "GigaDynamax", "Tera"]);
const statRulesetSchema = z.enum(["champions", "mainSeries"]);

const statStageSchema = z.object({
	attack: z.number().int().min(-6).max(6).optional(),
	defense: z.number().int().min(-6).max(6).optional(),
	specialAttack: z.number().int().min(-6).max(6).optional(),
	specialDefense: z.number().int().min(-6).max(6).optional(),
	speed: z.number().int().min(-6).max(6).optional(),
}).strict();

const flagsSchema = z.object({
	helpingHand: z.boolean().optional(), powerSpot: z.boolean().optional(), steelySpirit: z.boolean().optional(), charge: z.boolean().optional(), hasEvolution: z.boolean().optional(), lightScreen: z.boolean().optional(), reflect: z.boolean().optional(), hasFriendGuard: z.boolean().optional(),
}).strict();

const commonBattlerSchema = z.object({
	pokemonId: z.number().int().positive().optional(),
	pokemonName: z.string().optional(),
	level: z.number().int().min(1).max(100).optional(),
	types: z.union([z.tuple([typeSchema]), z.tuple([typeSchema, typeSchema])]),
	statRuleset: statRulesetSchema.optional(),
	effortValues: derivedOnlyStatSchema.partial().optional(),
	individualValues: derivedOnlyStatSchema.partial().optional(),
	nature: z.object({ plus: z.enum(["attack", "defense", "specialAttack", "specialDefense", "speed"]).optional(), minus: z.enum(["attack", "defense", "specialAttack", "specialDefense", "speed"]).optional() }).strict().optional(),
	statStage: statStageSchema.optional(),
	ability: z.string().optional(),
	item: z.string().optional(),
	teraType: teraTypeSchema.optional(),
	specialForm: specialFormSchema.optional(),
	status: statusSchema.optional(),
	flags: flagsSchema.optional(),
	takenDamage: z.number().int().min(0).optional(),
}).strict();

const derivedBattlerSchema = commonBattlerSchema.extend({
	statMode: z.literal("derived"),
	baseStat: derivedOnlyStatSchema,
	stats: z.never().optional(),
});

const manualBattlerSchema = commonBattlerSchema.extend({
	statMode: z.literal("manual"),
	stats: statSchema,
	baseStat: derivedOnlyStatSchema.optional(),
});

const moveSchema = z.object({
	moveId: z.number().int().positive().optional(),
	moveName: z.string().optional(),
	base: z.number().int().nonnegative(),
	type: teraTypeSchema,
	category: z.enum(["Special", "Physical"]),
	target: z.enum(["selectedTarget", "allAdjacentFoes", "allAdjacent"]),
	flags: z.object({ hasRecoil: z.boolean().optional(), hasSecondary: z.boolean().optional(), isContact: z.boolean().optional(), isPunch: z.boolean().optional(), isSound: z.boolean().optional(), isSlicing: z.boolean().optional(), isBite: z.boolean().optional(), isPulse: z.boolean().optional(), isMultihit: z.boolean().optional(), isPriority: z.boolean().optional(), isCriticalHit: z.boolean().optional() }).strict().optional(),
	repeatTimes: z.number().int().positive().optional(),
}).strict();

const fieldSchema = z.object({ weather: z.enum(["Sun", "Rain", "Sand", "Snow"]).optional(), terrain: z.enum(["Electric", "Grassy", "Misty", "Psychic"]).optional(), aura: z.array(z.enum(["Fairy", "Dark", "Aura Break"])).optional(), ruin: z.array(z.enum(["Tablets", "Sword", "Vessel", "Beads"])).optional(), isDouble: z.boolean().optional() }).strict();

export const AiDamageCalcInputSchema = z.object({ attacker: z.union([derivedBattlerSchema, manualBattlerSchema]), defender: z.union([derivedBattlerSchema, manualBattlerSchema]), move: moveSchema, field: fieldSchema.optional() }).strict().superRefine((arg, ctx) => {
	const checkEv = (ev: Partial<Stat> | undefined, ruleset: "champions" | "mainSeries", path: (string|number)[]) => {
		if (!ev) return;
		const max = ruleset === "champions" ? 32 : 252;
		const totalMax = ruleset === "champions" ? 66 : 510;
		const values = Object.values(ev);
		for (const value of values) {
			if (!Number.isInteger(value) || value < 0 || value > max) ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: `Invalid effortValues for ${ruleset}` });
		}
		const total = values.reduce((s, v) => s + (v ?? 0), 0);
		if (total > totalMax) ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: `Total effortValues exceeds ${totalMax} for ${ruleset}` });
	};
	for (const side of ["attacker", "defender"] as const) {
		const p = arg[side];
		checkEv(p.effortValues, p.statRuleset ?? "champions", [side, "effortValues"]);
	}
});

export type AiDamageCalcInput = z.infer<typeof AiDamageCalcInputSchema>;

export type NormalizedAiDamageCalcInput = {
	attacker: NormalizedBattler;
	defender: NormalizedBattler;
	move: Move;
	field: BattleFieldStatus;
};

type NormalizedBattler = {
	id?: number;
	name?: string;
	level: number;
	types: [Type] | [Type, Type];
	baseStat: Stat;
	statRuleset: "champions" | "mainSeries";
	effortValues: Stat;
	individualValues: Stat;
	stats?: Stat;
	statStage: Omit<Stat, "hp">;
	ability?: string;
	item?: string;
	teraType?: TeraTypes;
	specialForm: "None" | "Mega" | "Dynamax" | "GigaDynamax" | "Tera";
	status: "Healthy" | "Burned" | "Poisoned" | "Badly Poisoned" | "Asleep" | "Frozen" | "Paralyzed";
	flags?: { [k: string]: boolean | undefined };
	takenDamage: number;
};

export const AiDamageCalcOutputSchema = z.object({
	rolls: z.array(z.object({ number: z.number(), percentage: z.number() }).strict()),
	koChance: z.number(),
	factors: z.object({ attacker: z.record(z.any()), defender: z.record(z.any()), move: z.record(z.any()), field: z.record(z.any()) }).strict(),
}).strict();
export type AiDamageCalcOutput = z.infer<typeof AiDamageCalcOutputSchema>;

function normalizeBattler(input: AiDamageCalcInput["attacker"]): NormalizedBattler {
	const defaults: Stat = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
	const ivDefault: Stat = { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 };
	const stageDefault = { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
	return {
		id: input.pokemonId,
		name: input.pokemonName,
		level: input.level ?? 50,
		types: input.types,
		baseStat: { ...defaults, ...(input.baseStat ?? defaults) },
		statRuleset: input.statRuleset ?? "champions",
		effortValues: { ...defaults, ...(input.effortValues ?? {}) },
		individualValues: { ...ivDefault, ...(input.individualValues ?? {}) },
		stats: input.statMode === "manual" ? input.stats : undefined,
		statStage: { ...stageDefault, ...(input.statStage ?? {}) },
		ability: input.ability,
		item: input.item,
		teraType: input.teraType,
		specialForm: input.specialForm ?? "None",
		status: input.status ?? "Healthy",
		flags: input.flags,
		takenDamage: input.takenDamage ?? 0,
	};
}

export function normalizeAiDamageCalcInput(input: AiDamageCalcInput): NormalizedAiDamageCalcInput {
	const attacker = normalizeBattler(input.attacker);
	const defender = normalizeBattler(input.defender);
	const move = createMove({ id: input.move.moveId ?? 0, base: input.move.base, type: input.move.type, category: input.move.category, target: input.move.target, flags: input.move.flags, repeatTimes: input.move.repeatTimes });
	return { attacker, defender, move, field: { isDouble: true, ...(input.field ?? {}) } };
}

export function calculateAiDamage(input: AiDamageCalcInput): DamageResult {
	const normalized = normalizeAiDamageCalcInput(input);
	const battle = new Battle({
		attacker: new Pokemon(normalized.attacker),
		defender: new Pokemon(normalized.defender),
		move: normalized.move,
		field: normalized.field,
	});
	return battle.getDamage();
}

export function safeCalculateAiDamage(input: unknown): DamageResult {
	return calculateAiDamage(AiDamageCalcInputSchema.parse(input));
}
