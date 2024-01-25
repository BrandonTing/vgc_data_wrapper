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

type StatStage = Omit<Stat, "hp">;
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
export type TypesWithStellar = Type | "Stellar";

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
	level: number;
	stat: Stat;
	type: Array<Type>;
	statStage: StatStage;
	weight: number;
	abilityId: number;
	item?: string;
	teraType?: TypesWithStellar;
	gender: Gender;
	status: Status;
	flags?: Flags<
		| "helpingHand"
		| "powerSpot"
		| "steelySpirit"
		| "charge"
		| "hasEvolution"
		| "lightScreen"
		| "reflect"
		| "hasFriendGuard"
	>;
};

type MoveCategory = "Special" | "Physical";

type MoveTarget = "normal" | "allAdjacentFoes" | "allAdjacent";

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

export type BattleFieldStatus = {
	weather?: Weather;
	terrain?: Terrain;
	downCounts?: number;
	aura?: Aura;
	ruin?: Ruin;
	isDouble?: boolean;
};

export type BattleStatus = {
	attacker: Pokemon;
	defender: Pokemon;
	move: Move;
	field?: BattleFieldStatus;
};