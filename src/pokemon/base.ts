import type { Stat, TeraTypes, Type } from "../damage/config";
import type { Flags } from "../typeUtils";
import type { Ability, Item } from "./typeHelper";

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

type StatStages = Omit<Stat, "hp">;

type Nature = {
	plus?: keyof StatStages;
	minus?: keyof StatStages;
};

type PokemonType = [Type] | [Type, Type];
type PokemonInfo = {
	id?: number; // ID from national dex
	level: number; // affect stat & damage calculation; default 50;
	types: PokemonType; // Fire, Water, etc.
	baseStat: Stat;
	effortValues: Stat;
	individualValues: Stat;
	nature?: Nature;
	stats?: Stat; // can be set manually or derived from baseStat & EV & IV & nature. If this is set manually then other inputs are ignored.
	statStage: StatStages;
	weight: number; // affect related damage calculation like Grass Knot.
	ability?: Ability;
	item?: Item;
	teraType?: TeraTypes | null; // null mean not in tera form.
	gender: Gender;
	status: Status;
	flags?: PokemonFlags;
};
type ToggleTeraOption =
	| {
			isTera: true;
			type: TeraTypes;
	  }
	| {
			isTera: false;
	  };

interface IPokemon extends PokemonInfo {
	getStats: () => Stat;
	getStat: (key: keyof Stat) => number;
	setFlags: (flags: PokemonFlags) => void;
	toggleTera: (option: ToggleTeraOption) => void;
	initWithId: (
		id: number,
		option?: {
			effortValues?: Partial<Stat>;
			individualValues?: Partial<Stat>;
			statStage: Partial<StatStages>;
			nature?: Nature;
			item?: Item;
			teraType?: TeraTypes;
			status?: Status;
			level?: number;
			gender?: Gender;
			flags?: PokemonFlags;
		},
	) => void;
	setNature: (nature: Nature) => void;
}

export class Pokemon implements IPokemon {
	id?: number;
	level: number;
	types: PokemonType;
	teraType?: TeraTypes | null;

	weight: number;
	ability?: Ability;
	gender: Gender;
	status: Status;
	baseStat: Stat;
	effortValues: Stat;
	individualValues: Stat;
	stats?: Stat;
	statStage: StatStages;
	nature: {
		plus?: keyof StatStages;
		minus?: keyof StatStages;
	};

	item?: Item;
	flags?: PokemonFlags;

	constructor(
		info?: {
			id?: number;
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
				statStage?: Partial<StatStages>;
			},
	) {
		this.id = info?.id;
		this.level = info?.level ?? 50;
		// fetch pokemon infomation by id
		this.types = info?.types ?? ["Normal"];
		this.teraType = info?.teraType ?? null;
		this.weight = info?.weight ?? 0;
		this.ability = info?.ability;
		this.gender = info?.gender ?? "Unknown";
		this.status = info?.status ?? "Healthy";
		this.item = info?.item;
		// stats
		if (info?.stats) {
			this.stats = genDefaultStat(info?.stats);
		}
		this.baseStat = genDefaultBaseStat(info?.baseStat);
		this.individualValues = genDefaultIV(info?.individualValues);
		this.effortValues = genDefaultEv(info?.effortValues);
		this.statStage = genDefaultStage(info?.statStage);
		this.nature = info?.nature ?? {};
		this.flags = info?.flags;
	}

	getStat(key: keyof Stat): number {
		// before init
		if (!this.stats && !this.baseStat) {
			throw new Error("Please init pokemon with ID or manually set stats");
		}
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
		if (!this.stats && !this.baseStat) {
			throw new Error("Please init pokemon with ID or manually set stats");
		}
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
	setNature(nature: Nature) {
		this.nature = this.nature ? Object.assign(this.nature, nature) : nature;
	}
	toggleTera(option: ToggleTeraOption): void {
		if (option.isTera) {
			this.teraType = option.type;
			return;
		}
		this.teraType = null;
	}
	async initWithId(
		id: number,
		option?: {
			effortValues?: Partial<Stat>;
			individualValues?: Partial<Stat>;
			statStage: Partial<StatStages>;
		},
	) {
		this.id = id;
		try {
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
			const data = (await response.json()) as {
				stats: Array<{ base_stat: number; stat: { name: string } }>;
				types:
					| [{ type: { name: string } }]
					| [{ type: { name: string } }, { type: { name: string } }];
				weight: number;
			};
			for (let i = 0; i < data.stats.length; i++) {
				const stat = data.stats[i];
				switch (stat?.stat.name) {
					case "hp":
					case "attack":
					case "defense":
					case "speed":
						this.baseStat[stat.stat.name] = stat.base_stat;
						break;
					case "special-attack":
						this.baseStat.specialAttack = stat.base_stat;
						break;
					case "special-defense":
						this.baseStat.specialDefense = stat.base_stat;
						break;
					default:
						return;
				}
			}
			this.weight = data.weight;
			this.types = data.types.map((type) =>
				capitalize(type.type.name),
			) as PokemonType;
			if (option?.effortValues) {
				this.effortValues = Object.assign(
					this.effortValues,
					option.effortValues,
				);
			}
			if (option?.individualValues) {
				this.individualValues = Object.assign(
					this.individualValues,
					option.individualValues,
				);
			}
			if (option?.statStage) {
				this.statStage = Object.assign(this.statStage, option.statStage);
			}
		} catch (err) {
			console.log("Failed to init pokemon from pokeapi: ", err);
			throw new Error("Failed to init pokemon from pokeapi");
		}
	}
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
		key: keyof StatStages,
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
	private getNatureModifer(key: keyof StatStages): number {
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

function genDefaultStage(partial?: Partial<StatStages>): StatStages {
	return Object.assign(
		{
			attack: 0,
			defense: 0,
			specialAttack: 0,
			specialDefense: 0,
			speed: 0,
		} satisfies StatStages,
		partial,
	);
}

function capitalize<T extends string>(s: T) {
	return (s[0]?.toUpperCase() + s.slice(1)) as Capitalize<typeof s>;
}