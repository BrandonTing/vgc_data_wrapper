const statProps = [
	"hp",
	"attack",
	"defense",
	"specialAttack",
	"specialDefense",
	"speed",
] as const;

export type Stat = {
	[key in (typeof statProps)[number]]: number;
};

export type StatStage = Omit<Stat, "hp">;
const types = [
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

type Gender = "Male" | "Female" | "Unknown";

type Status =
	| "Healthy"
	| "Burned"
	| "Poisoned"
	| "Badly Poisoned"
	| "Asleep"
	| "Frozen"
	| "Paralyzed";

type Flags<T extends string> = {
	[P in T]?: boolean;
};

export type Pokemon = {
	id: number;
	stat: Stat;
	type: Array<Type>;
	statStage: StatStage;
	weight: number;
	abilityId: number;
	item?: string;
	teraType?: Type | "stellar";
	gender: Gender;
	status: Status;
	flags?: Flags<
		| "helpingHand"
		| "powerSpot"
		| "steelySpirit"
		| "charge"
		| "criticalHit"
		| "hasEvolution"
	>;
};

export type MoveCategory = "Special" | "Physical";

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
	>;
	category: MoveCategory;
};

type Weather = "Sun" | "Rain" | "Sand" | "Snow";

type Terrain = "Electric" | "Grassy" | "Misty" | "Psychic";

type Aura = "Fairy" | "Dark";

type Ruin = "Tablets" | "Sword" | "Vessel" | "Beads";

export type BattleFieldStatus = {
	weather?: Weather;
	terrain?: Terrain;
	downCounts?: number;
	aura?: Aura;
	ruin?: Ruin;
};

export type BattleStatus = {
	attacker: Pokemon;
	defender: Pokemon;
	move: Move;
	field: BattleFieldStatus;
};
