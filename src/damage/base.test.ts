import {test, expect} from "bun:test"
import { getBasePower, type BattleFieldStatus, type Move, type Pokemon, type Stat, type StatStage } from "."

function genTestStat(partial?: Partial<Stat>): Stat {
    return Object.assign({
            hp: 100,
            attack: 100,
            defense: 100,
            specialAttack: 100,
            specialDefense: 100,
            speed: 100,
        } satisfies Stat,   
        partial
    )
}

function genTestStatStage(partial?: Partial<StatStage>): StatStage {
    return Object.assign({
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
        } satisfies StatStage,   
        partial
    )
}

function genTestMon(partial?: Partial<Pokemon>): Pokemon {
    return {
        id: 0, 
        stat: genTestStat(partial?.stat),
        statStage:genTestStatStage(partial?.statStage),
        weight: partial?.weight ?? 0,
        abilityId: partial?.abilityId ?? 0,
        itemId: partial?.itemId ?? 0,
    }
}

function genTestMove(partial?: Partial<Move>): Move {
    return Object.assign({
        id: 0,
        base: 100,
        type: "Normal"
    } satisfies Move, partial)
}

test("correctly calculate base power", function () {
    const testPokemon = genTestMon()
    const testMove: Move  = genTestMove()
    const basePower = getBasePower(testPokemon, testPokemon, testMove);
    expect(basePower).toBe(100)
})

test("correctly calculate base power for terrain related moves", function () {
    const testPokemon = genTestMon()
    const testHydroSteam  = genTestMove({
        id: 875,
        base: 80
    })
    const basePowerHydroSteam = getBasePower(testPokemon, testPokemon, testHydroSteam, {
        weather: "Sun"
    });
    expect(basePowerHydroSteam).toBe(120)

    const testPsyblade  = genTestMove({
        id: 876,
        base: 80
    })
    const basePowerPsyblade = getBasePower(testPokemon, testPokemon, testPsyblade, {
        terrain: "Electric"
    });
    expect(basePowerPsyblade).toBe(120)

    const testMistyExplosion  = genTestMove({
        id: 802,
        base: 100
    })
    const basePowerMistyExplosion = getBasePower(testPokemon, testPokemon, testMistyExplosion, {
        terrain: "Misty"
    });
    expect(basePowerMistyExplosion).toBe(150)

    const testEarthQuake = genTestMove({
        id: 89,
        base: 100
    })
    const baseEarthQuake = getBasePower(testPokemon, testPokemon, testEarthQuake, {
        terrain: "Grassy"
    });
    expect(baseEarthQuake).toBe(50)
    const testBulldoze = genTestMove({
        id: 523,
        base: 60
    })
    const baseBulldoze = getBasePower(testPokemon, testPokemon, testBulldoze, {
        terrain: "Grassy"
    });
    expect(baseBulldoze).toBe(30)

    const testTerrainPulse = genTestMove({
        id: 805,
        base: 50
    })
    const baseTerrainPulse = getBasePower(testPokemon, testPokemon, testTerrainPulse, {
        terrain: "Grassy"
    });
    expect(baseTerrainPulse).toBe(100)

})