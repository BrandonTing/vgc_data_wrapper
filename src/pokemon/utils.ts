import { checkTeraWIthTypeMatch } from "../damage/utils";
import type { Pokemon } from "./base";

export function isTerapagosStellar(pokemon: Pokemon) {
    const isNormalTerapagosTeraStellar = (pokemon.id === 1024 || pokemon.name === "terapagos") &&
        checkTeraWIthTypeMatch(pokemon, "Stellar")
    const isTerapagosStellar = (pokemon.id === 10277 || pokemon.name === "terapagos-stellar")
    console.log(pokemon.id)
    console.log(pokemon.name)
    return isNormalTerapagosTeraStellar || isTerapagosStellar
}