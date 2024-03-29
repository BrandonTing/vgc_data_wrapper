import items from "../../data/item.json";
import type { Stat, TeraTypes } from "../damage/config";
import { Pokemon } from "./base";
import { pokemonSchema } from "./schema";
import type { Ability, Item } from "./typeHelper";

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

export async function getPokemonsFromPasteUrl(
	url: string,
): Promise<Array<Pokemon>> {
	try {
		const content = await fetch(`${url}/json`);
		const paste = ((await content.json()) as unknown as { paste: string })
			.paste;
		return await getPokemonsFromPaste(paste);
	} catch (err) {
		throw new Error("Failed to parse info from provided paste url");
	}
}

export async function getPokemonsFromPaste(
	paste: string,
): Promise<Array<Pokemon>> {
	const pasteOfPokemons = paste
		.split(/\r?\n\r?\n/)
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
		const response = await fetch(
			`https://pokeapi.co/api/v2/pokemon/${pokemonNameConverter(
				infoFromPaste.name,
			)}`,
		);
		const data = await response.json();
		const pokemonInfo = pokemonSchema.parse(data);
		const { id, weight, types, stats, sprites } = pokemonInfo;
		const { item, ev, iv, level, nature, ability, moves, name, teraType } =
			infoFromPaste;
		return new Pokemon({
			name,
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
			moves,
			sprite: sprites,
			teraType,
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
	moves: Array<string>;
	teraType: TeraTypes;
}>;

function parsePaste(paste: string): PokemonInfoFromPaste {
	const lines = paste.split(/\r?\n/).filter(Boolean);
	const info: PokemonInfoFromPaste = { moves: [] };

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		if (i === 0) {
			// name & item
			const [name, item] = line.split(" @ ");
			info.name = name?.trim().replace(/ \(F\)/, ""); // remove female notation;
			// FIXME set type enhancing item
			info.item = item && item in items ? (item as Item) : undefined;
			continue;
		}
		if (line.includes("Ability: ")) {
			info.ability = line.split("Ability: ")[1]?.trim() as Ability;
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
		if (line.includes("- ")) {
			const move = line.split("- ")[1]?.trim();
			if (move) {
				info.moves?.push(move);
			}
		}
		if (line.includes("Tera Type")) {
			const teraType = line.split("Tera Type: ")[1]?.trim() as TeraTypes;
			if (teraType) {
				info.teraType = teraType;
			}
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

export function pokemonNameConverter(name: string): string {
	const fetchName = name.toLowerCase().replaceAll(" ", "-");

	if (fetchName === "urshifu") {
		return "urshifu-single-strike";
	}

	if (
		fetchName === "tornadus" ||
		fetchName === "thundurus" ||
		fetchName === "landorus"
	) {
		return `${fetchName}-incarnate`;
	}
	if (fetchName.includes("ogerpon")) {
		if (
			fetchName.includes("wellspring") ||
			fetchName.includes("cornerstone") ||
			fetchName.includes("hearthflame")
		) {
			return `${fetchName}-mask`;
		}
		return "ogerpon";
	}
	return fetchName;
}
