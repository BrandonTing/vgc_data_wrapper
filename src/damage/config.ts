import type { Pokemon } from "../pokemon";
import type { Flags, TypedExtract } from "../typeUtils";

export const statProps = [
	"hp",
	"attack",
	"defense",
	"specialAttack",
	"specialDefense",
	"speed",
] as const;

export type StatKeys = (typeof statProps)[number];

export type Stat = {
	[key in StatKeys]: number;
};

export const types = [
	"Normal",
	"Fire",
	"Water",
	"Grass",
	"Electric",
	"Ice",
	"Fighting",
	"Poison",
	"Ground",
	"Flying",
	"Psychic",
	"Bug",
	"Rock",
	"Ghost",
	"Dragon",
	"Dark",
	"Steel",
	"Fairy",
] as const;

export type Type = (typeof types)[number];
export type TeraTypes = Type | "Stellar";

type MoveCategory = "Special" | "Physical";

type MoveTarget = "selectedTarget" | "allAdjacentFoes" | "allAdjacent";

export type Move = {
	id: number;
	base: number;
	type: Type;
	flags?: Flags<
		| "hasRecoil"
		| "hasSecondary"
		| "isContact"
		| "isPunch"
		| "isSound"
		| "isSlicing"
		| "isBite"
		| "isPulse"
		| "isMultihit"
		| "isPriority"
		| "isCriticalHit"
	>;
	target: MoveTarget;
	category: MoveCategory;
	repeatTimes?: number;
};

type Weather = "Sun" | "Rain" | "Sand" | "Snow";

type Terrain = "Electric" | "Grassy" | "Misty" | "Psychic";

type Aura = "Fairy" | "Dark";

type Ruin = "Tablets" | "Sword" | "Vessel" | "Beads";

export type BattleFieldStatus = Partial<{
	weather: Weather;
	terrain: Terrain;
	aura: Array<Aura>;
	ruin: Array<Ruin>;
	isDouble: boolean;
}>;

export type BattleStatus = {
	attacker: Pokemon;
	defender: Pokemon;
	move: Move;
	field?: BattleFieldStatus;
};


type PokemonDmgFactor<T extends "Attacker" | "Defender"> = (T extends "Attacker" ? {
	atk: TypedExtract<StatKeys, "attack" | "specialAttack">
} : {
	def: TypedExtract<StatKeys, "attack" | "specialAttack">
}) & Record<TypedExtract<keyof Pokemon, "ability" | "item" | "isTera">, boolean> & Pokemon["flags"]


export type DamageResult = {
	rolls: Array<{
		number: number;
		percentage: number;
	}>;
	koChance: number;
	// TODO
	factors?: {
		attacker: PokemonDmgFactor<"Attacker">,
		defender: PokemonDmgFactor<"Defender">,
		field: BattleFieldStatus,
		movee: Move["flags"]
	}
};
