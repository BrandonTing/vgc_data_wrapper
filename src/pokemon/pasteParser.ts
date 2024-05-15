import items from "../../data/item.json";
import type { Stat, TeraTypes } from "../damage/config";
import { Pokemon, type Gender } from "./base";
import { pokemonSchema } from "./schema";
import type { Ability, Item } from "./typeHelper";

const natures: Record<string, Pokemon["nature"]> = {
	Hardy: {},
	Lonely: { plus: "attack", minus: "defense" },
	Brave: { plus: "attack", minus: "speed" },
	Adamant: { plus: "attack", minus: "specialAttack" },
	Naughty: { plus: "attack", minus: "specialDefense" },
	Bold: { plus: "defense", minus: "attack" },
	Docile: {},
	Relaxed: { plus: "defense", minus: "speed" },
	Impish: { plus: "defense", minus: "specialAttack" },
	Lax: { plus: "defense", minus: "specialDefense" },
	Timid: { plus: "speed", minus: "attack" },
	Hasty: { plus: "speed", minus: "defense" },
	Serious: {},
	Jolly: { plus: "speed", minus: "specialAttack" },
	Naive: { plus: "speed", minus: "specialDefense" },
	Modest: { plus: "specialAttack", minus: "attack" },
	Mild: { plus: "specialAttack", minus: "defense" },
	Quiet: { plus: "specialAttack", minus: "speed" },
	Bashful: {},
	Rash: { plus: "specialAttack", minus: "specialDefense" },
	Calm: { plus: "specialDefense", minus: "attack" },
	Gentle: { plus: "specialDefense", minus: "defense" },
	Sassy: { plus: "specialDefense", minus: "speed" },
	Careful: { plus: "specialDefense", minus: "specialAttack" },
	Quirky: {}
}

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
		const { item, ev, iv, level, nature, ability, moves, name, teraType, gender } =
			infoFromPaste;
		return new Pokemon({
			name,
			gender,
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
	gender: Gender
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
			if (!name) {
				throw new Error("Pokemon name is required");
			}
			let pokemonName = name.trim()
			if (pokemonName?.includes("(M)")) {
				info.gender = "Male"
				pokemonName = pokemonName.replace(/ \(M\)/, "")
			} else if (name?.includes("(F)")) {
				info.gender = "Female"
				pokemonName = pokemonName.replace(/ \(F\)/, "")
			}
			info.name = pokemonName; // remove gender notation;
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
			if (!nature || !natures[nature]) {
				continue;
			}
			info.nature = natures[nature]
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
		stat[getStatKeyFromPaste(key)] = +num
	}
	return stat;
}

function getNatureNameFromModifier(pokemonNature: Pokemon["nature"]): string {
	return Object.entries(natures).find(([_, nature]) =>
		nature.minus === pokemonNature.minus && nature.plus === pokemonNature.plus
	)?.[0] ?? ""
}

function pokemonNameConverter(name: string): string {
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

export function getPasteFromPokemons(pokemons: Array<Pokemon>): string {
	return pokemons.map(pokemon => getPasteFromPokemon(pokemon)).join('\n\n')
}

function getPasteFromPokemon(pokemon: Pokemon): string {
	const evStr = Object.entries(pokemon.effortValues).map(([key, value]) => {
		if (value === 0) {
			return
		}
		return `${value} ${getStatKeyForPaste(key)}`
	}).filter(Boolean).join(" / ")
	return `
${pokemon.name}${pokemon.gender === "Male" ? " (M)" : pokemon.gender === "Female" ? " (F)" : ""} @ ${pokemon.item ?? ""}
Ability: ${pokemon.ability}
Level: ${pokemon.level}
Tera Type: ${pokemon.teraType}
EVs: ${evStr}
${getNatureNameFromModifier(pokemon.nature)} Nature
${pokemon.moves?.map(move => `- ${move}`).join("\n")}
`
}

function getStatKeyForPaste(key: string) {
	switch (key) {
		case "hp":
			return "HP"
		case "attack":
			return "Atk"
		case "defense":
			return "Def"
		case "specialAttack":
			return "SpA"
		case "specialDefense":
			return "SpD"
		case "speed":
			return "Spe"
		default:
			return key
	}
}


function getStatKeyFromPaste(key: string): keyof (Pokemon['stats'] & {}) {
	switch (key) {
		case "HP":
			return "hp"
		case "Atk":
			return "attack"
		case "Def":
			return "defense"
		case "SpA":
			return "specialAttack"
		case "SpD":
			return "specialDefense"
		case "Spe":
			return "speed"
		default:
			return "hp"
	}
}
