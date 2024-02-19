import { z } from "zod";
import { type Stat, type StatKeys, type Type } from "../damage/config";

const typeSchema = z
	.object({
		type: z.object({
			name: z.string(),
		}),
	})
	.transform((arg) => {
		const preModifiedType = arg.type.name;
		const type =
			preModifiedType.charAt(0).toUpperCase() + preModifiedType.slice(1);
		return type as Type;
	});

export const pokemonSchema = z.object({
	id: z.number(),
	weight: z.number(),
	types: z.union([z.tuple([typeSchema]), z.tuple([typeSchema, typeSchema])]),
	stats: z
		.array(
			z.object({
				base_stat: z.number(),
				stat: z.object({
					name: z.string(),
				}),
			}),
		)
		.transform((arg) => {
			return arg.reduce((pre, cur) => {
				const propertyName = getStatKey(cur.stat.name);
				pre[propertyName] = cur.base_stat;
				return pre;
			}, {} as Stat);
		}),
});

function getStatKey(pokeapiKey: string): StatKeys {
	if (
		pokeapiKey === "hp" ||
		pokeapiKey === "attack" ||
		pokeapiKey === "defense" ||
		pokeapiKey === "speed"
	) {
		return pokeapiKey;
	}
	if (pokeapiKey === "special-attack") {
		return "specialAttack";
	}

	if (pokeapiKey === "special-defense") {
		return "specialDefense";
	}
	throw new Error("invalid stat key name");
}
