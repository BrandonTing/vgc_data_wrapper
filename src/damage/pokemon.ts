import type { Flags } from "../typeUtils";
import type { Stat, TeraTypes, Type } from "./config";

type Gender = "Male" | "Female" | "Unknown";

type Status =
	| "Healthy"
	| "Burned"
	| "Poisoned"
	| "Badly Poisoned"
	| "Asleep"
	| "Frozen"
	| "Paralyzed";

type PokemonFlags = Flags<
	| "helpingHand"
	| "powerSpot"
	| "steelySpirit"
	| "charge"
	| "hasEvolution"
	| "lightScreen"
	| "reflect"
	| "hasFriendGuard"
>;

interface PokemonInfo {
	id: number;
	level: number;
	types: Array<Type>;
	baseStat: Stat;
	nature?: {
		plus?: keyof Omit<Stat, "hp">;
		minus?: keyof Omit<Stat, "hp">;
	};
	effortValues: Stat;
	individualValues: Stat;
	stats?: Stat;
	statStage: Omit<Stat, "hp">;
	weight: number;
	abilityId: number;
	item?: string;
	teraType?: TeraTypes;
	gender: Gender;
	status: Status;
	flags?: PokemonFlags;
}

interface IPokemon extends PokemonInfo {
	getStats: () => Stat;
	getStat: (key: keyof Stat) => number;
	setFlags: (flags: PokemonFlags) => void;
	toggleTera: ((tera: true, type: TeraTypes) => void) | ((tera: false) => void);
}

export class Pokemon implements IPokemon {
	id: number;
	level: number;
	types: Array<Type>;
	teraType?: TeraTypes;

	weight: number;
	abilityId: number;
	gender: Gender;
	status: Status;
	baseStat: Stat;
	effortValues: Stat;
	individualValues: Stat;
	stats?: Stat;
	statStage: Omit<Stat, "hp">;
	nature: {
		plus?: keyof Omit<Stat, "hp">;
		minus?: keyof Omit<Stat, "hp">;
	};

	item?: string;
	flags?: PokemonFlags;

	constructor(
		info: {
			id: number;
		} & Partial<
			Omit<
				PokemonInfo,
				| "id"
				| "stats"
				| "baseStat"
				| "individualValues"
				| "effortValues"
				| "statStage"
			>
		> & {
				stats?: Partial<Stat>;
				baseStat?: Partial<Stat>;
				individualValues?: Partial<Stat>;
				effortValues?: Partial<Stat>;
				statStage?: Partial<Omit<Stat, "hp">>;
			},
	) {
		this.id = info.id;
		this.level = info.level ?? 50;
		// fetch pokemon infomation by id
		this.types = info.types ?? ["Normal"];
		this.teraType = info.teraType;

		this.weight = info.weight ?? 0;
		this.abilityId = info.weight ?? 0;
		this.gender = info.gender ?? "Unknown";

		this.status = info.status ?? "Healthy";
		this.item = info.item;
		// stats
		if (info.stats) {
			this.stats = genDefaultStat(info.stats);
		}
		this.baseStat = genDefaultBaseStat(info.baseStat);
		this.individualValues = genDefaultIV(info.individualValues);
		this.effortValues = genDefaultEv(info.effortValues);
		this.statStage = genDefaultStage(info.statStage);
		this.nature = info.nature ?? {};
	}
	getStat(key: keyof Stat): number {
		// support manually set stat, if so, ignore base stat, iv and ev
		if (this.stats?.[key]) return this.stats[key];
		if (key === "hp") {
			return this.getHp(
				this.baseStat[key],
				this.individualValues[key],
				this.effortValues[key],
			);
		}

		return this.getTargetStat(
			key,
			this.baseStat[key],
			this.individualValues[key],
			this.effortValues[key],
		);
	}
	getStats(): Stat {
		// support manually set stat, if so, ignore base stat, iv and ev
		if (this.stats) return this.stats;
		const baseStatEntries = Object.keys(this.baseStat) as Array<keyof Stat>;
		return baseStatEntries.reduce((pre, key) => {
			pre[key] = this.getStat(key);
			return pre;
		}, {} as Stat);
	}
	setFlags(flags: PokemonFlags) {
		this.flags = this.flags ? Object.assign(this.flags, flags) : flags;
	}
	toggleTera:
		| ((tera: true, type: TeraTypes) => void)
		| ((tera: false) => void) = (tera, type) => {
		if (tera) {
			this.teraType = type;
			return;
		}
		this.teraType = undefined;
	};
	private getHp(base: number, iv: number, ev: number): number {
		// Shedinja
		if (this.id === 292) return 1;
		return (
			Math.trunc(((base * 2 + iv + Math.trunc(ev / 4)) * this.level) / 100) +
			10 +
			this.level
		);
	}
	private getTargetStat(
		key: keyof Omit<Stat, "hp">,
		base: number,
		iv: number,
		ev: number,
	): number {
		return Math.trunc(
			(Math.trunc(((base * 2 + iv + Math.trunc(ev / 4)) * this.level) / 100) +
				5) *
				this.getNatureModifer(key),
		);
	}
	private getNatureModifer(key: keyof Omit<Stat, "hp">): number {
		if (key === this.nature.plus) return 1.1;
		if (key === this.nature.minus) return 0.9;
		return 1;
	}
}

function genDefaultStat(partial?: Partial<Stat>): Stat {
	return Object.assign(
		{
			hp: 100,
			attack: 100,
			defense: 100,
			specialAttack: 100,
			specialDefense: 100,
			speed: 100,
		} satisfies Stat,
		partial,
	);
}

function genDefaultBaseStat(partial?: Partial<Stat>): Stat {
	return Object.assign(
		{
			hp: 100,
			attack: 100,
			defense: 100,
			specialAttack: 100,
			specialDefense: 100,
			speed: 100,
		} satisfies Stat,
		partial,
	);
}

function genDefaultIV(partial?: Partial<Stat>): Stat {
	return Object.assign(
		{
			hp: 31,
			attack: 31,
			defense: 31,
			specialAttack: 31,
			specialDefense: 31,
			speed: 31,
		} satisfies Stat,
		partial,
	);
}

function genDefaultEv(partial?: Partial<Stat>): Stat {
	return Object.assign(
		{
			hp: 0,
			attack: 0,
			defense: 0,
			specialAttack: 0,
			specialDefense: 0,
			speed: 0,
		} satisfies Stat,
		partial,
	);
}

function genDefaultStage(
	partial?: Partial<Omit<Stat, "hp">>,
): Omit<Stat, "hp"> {
	return Object.assign(
		{
			attack: 0,
			defense: 0,
			specialAttack: 0,
			specialDefense: 0,
			speed: 0,
		} satisfies Omit<Stat, "hp">,
		partial,
	);
}