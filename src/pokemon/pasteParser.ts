import items from "../../data/item.json";
import type { Stat } from "../damage/config";
import { Pokemon } from "./base";
import { pokemonSchema } from "./schema";
import type { Ability, Item } from "./typeHelper";

export async function getPokemonsFromPaste(
	paste: string,
): Promise<Array<Pokemon>> {
	const pasteOfPokemons = paste
		.split("\n\n")
		.filter(Boolean)
		.map((str) => getPokemonFromPaste(str));
	const pokemons = await Promise.allSettled(pasteOfPokemons);
	return pokemons
		.map((pokemonResult) => {
			if (pokemonResult.status === "fulfilled") {
				return pokemonResult.value;
			}
			return;
		})
		.filter(Boolean);
}

export async function getPokemonFromPaste(paste: string): Promise<Pokemon> {
	const infoFromPaste = parsePaste(paste);
	if (!infoFromPaste.name) {
		throw new Error("Invalid format: name is not provided");
	}
	try {
		// get basestat, type, weight, id from pokeapi
		const fetchName = infoFromPaste.name.toLowerCase().replace(" ", "-");
		const response = await fetch(
			`https://pokeapi.co/api/v2/pokemon/${fetchName}`,
		);
		const data = await response.json();
		const pokemonInfo = pokemonSchema.parse(data);
		const { id, weight, types, stats } = pokemonInfo;
		const { item, ev, iv, level, nature, ability } = infoFromPaste;
		return new Pokemon({
			baseStat: stats,
			id,
			weight,
			types,
			item,
			effortValues: ev,
			individualValues: iv,
			level,
			nature,
			ability,
		});
	} catch (err) {
		throw new Error("Invalid Name: cannot find target pokemon");
	}
}

type PokemonInfoFromPaste = Partial<{
	name: string;
	item: Item;
	ability: Ability;
	level: number;
	ev: Partial<Stat>;
	nature: Pokemon["nature"];
	iv: Partial<Stat>;
}>;

function parsePaste(paste: string): PokemonInfoFromPaste {
	const lines = paste.split("\n").filter(Boolean);
	const info: PokemonInfoFromPaste = {};
	for (const line of lines) {
		if (line.includes(" @ ")) {
			// name & item
			const [name, item] = line.split(" @ ");
			info.name = name;
			// FIXME set type enhancing item
			info.item = item && item in items ? (item as Item) : undefined;
			continue;
		}
		if (line.includes("Ability: ")) {
			info.ability = line.split("Ability: ")[1] as Ability;
			continue;
		}
		if (line.includes("Level: ")) {
			const levelStr = line.split("Level: ")[1];
			info.level = levelStr ? +levelStr : 50;
			continue;
		}
		if (line.includes("EVs: ")) {
			const evs = line.split("EVs: ")[1];
			if (!evs) {
				continue;
			}
			info.ev = getStatFromPaste(evs);
		}
		if (line.includes("IVs: ")) {
			const ivs = line.split("IVs: ")[1];
			if (!ivs) {
				continue;
			}
			info.iv = getStatFromPaste(ivs);
		}
		if (line.includes("Nature")) {
			const nature = line.split(" Nature")[0];
			if (!nature || !natures.includes(nature)) {
				continue;
			}
			info.nature = getNatureModifierFromName(
				nature as unknown as (typeof natures)[number],
			);
		}
	}
	return info;
}

function getStatFromPaste(paste: string): Partial<Stat> {
	const stat: Partial<Stat> = {};
	const statStrings = paste.split(" / ");
	for (const statStr of statStrings) {
		const [num, key] = statStr.split(" ");
		if (!num || !key) {
			continue;
		}
		switch (key) {
			case "HP":
				stat.hp = +num;
				break;
			case "Atk":
				stat.attack = +num;
				break;
			case "Def":
				stat.defense = +num;
				break;
			case "SpA":
				stat.specialAttack = +num;
				break;
			case "SpD":
				stat.specialDefense = +num;
				break;
			case "Spe":
				stat.speed = +num;
				break;
			default:
				break;
		}
	}
	return stat;
}

const natures = [
	"Hardy",
	"Lonely",
	"Brave",
	"Adamant",
	"Naughty",
	"Bold",
	"Docile",
	"Relaxed",
	"Impish",
	"Lax",
	"Timid",
	"Hasty",
	"Serious",
	"Jolly",
	"Naive",
	"Modest",
	"Mild",
	"Quiet",
	"Bashful",
	"Rash",
	"Calm",
	"Gentle",
	"Sassy",
	"Careful",
	"Quirky",
] as const;

export function getNatureModifierFromName(
	name: (typeof natures)[number],
): Pokemon["nature"] {
	const nature: Pokemon["nature"] = {};
	// plus
	if (
		name === "Timid" ||
		name === "Hasty" ||
		name === "Jolly" ||
		name === "Naive"
	) {
		nature.plus = "speed";
	}
	if (
		name === "Calm" ||
		name === "Gentle" ||
		name === "Sassy" ||
		name === "Careful"
	) {
		nature.plus = "specialDefense";
	}
	if (
		name === "Modest" ||
		name === "Mild" ||
		name === "Quiet" ||
		name === "Rash"
	) {
		nature.plus = "specialAttack";
	}
	if (
		name === "Bold" ||
		name === "Relaxed" ||
		name === "Impish" ||
		name === "Lax"
	) {
		nature.plus = "defense";
	}
	if (
		name === "Lonely" ||
		name === "Brave" ||
		name === "Adamant" ||
		name === "Naughty"
	) {
		nature.plus = "attack";
	}

	// minus
	if (
		name === "Sassy" ||
		name === "Quiet" ||
		name === "Relaxed" ||
		name === "Brave"
	) {
		nature.minus = "speed";
	}
	if (
		name === "Naive" ||
		name === "Rash" ||
		name === "Lax" ||
		name === "Naughty"
	) {
		nature.minus = "specialDefense";
	}
	if (
		name === "Jolly" ||
		name === "Careful" ||
		name === "Impish" ||
		name === "Adamant"
	) {
		nature.minus = "specialAttack";
	}
	if (
		name === "Hasty" ||
		name === "Gentle" ||
		name === "Mild" ||
		name === "Lonely"
	) {
		nature.minus = "defense";
	}

	if (
		name === "Timid" ||
		name === "Calm" ||
		name === "Modest" ||
		name === "Bold"
	) {
		nature.minus = "attack";
	}

	return nature;
}
