import typeChart from "../../data/typeChart.json";
import type { TeraTypes, Type } from "./config";

type TypeEffectiveness = Record<Type, number>;
type TypeEffectivenessMap = Record<Type, TypeEffectiveness>;

const typeAttackEffectivenessMap = typeChart satisfies TypeEffectivenessMap;

export function getEffectivenessOnPokemon(
	atkType: Type,
	targetPokemonTypes: Array<TeraTypes>,
): number {
	return targetPokemonTypes
		.map((type) =>
			type === "Stellar" ? 1 : typeAttackEffectivenessMap[atkType][type],
		)
		.reduce((pre, cur) => pre * cur, 1 as number);
}
