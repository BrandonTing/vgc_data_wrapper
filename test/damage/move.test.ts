import { expect, test } from "bun:test";
import { Battle, createMove } from "../../src";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

test("freeze dry", () => {
    const ironBundle = genTestMon({
        types: ["Ice", "Water"],
        baseStat: {
            specialAttack: 124,
        },
    })
    const gastrodon = genTestMon({
        types: ["Water", "Ground"],
        baseStat: {
            hp: 111,
            specialDefense: 82
        }
    })
    const move = createMove({
        id: 573,
        base: 70,
        type: "Ice",
        category: "Special"
    })
    const battle = new Battle({
        attacker: ironBundle,
        defender: gastrodon,
        move,
    });
    const actual = getDamangeNumberFromResult(battle.getDamage());
    const expected = [
        228,
        228,
        232,
        232,
        240,
        240,
        240,
        244,
        244,
        252,
        252,
        256,
        256,
        264,
        264,
        268
    ];
    expect(actual).toEqual(expected);

})

test("terapagos using Tera Starstorm", () => {
    const terapagos = genTestMon({
        id: 1024,
        isTera: true,
        teraType: "Stellar"
    });
    const testMon = genTestMon({})
    const move = createMove({
        id: 906,
        base: 120,
        category: "Special"
    })
    const battle = new Battle({
        attacker: terapagos,
        defender: testMon,
        move
    })
    const damage = battle.getDamage()
    expect(damage.factors.attacker.isTera).toBe(true)
    expect(damage.factors.field.isDouble).toBe(true)
    expect(damage.factors.attacker.atk).toBe("specialAttack")

    const terapagosPhysical = genTestMon({
        id: 1024,
        isTera: true,
        teraType: "Stellar",
        stats: {
            attack: 101,
            specialAttack: 100
        }
    });
    battle.setPokemon("attacker", terapagosPhysical)
    testMon.toggleTera({ isTera: true })
    const againstTeraDefender = battle.getDamage()
    expect(againstTeraDefender.factors.attacker.isTera).toBe(true)
    expect(againstTeraDefender.factors.defender.isTera).toBe(true)
    expect(againstTeraDefender.factors.field.isDouble).toBe(true)
    expect(againstTeraDefender.factors.attacker.atk).toBe("attack")

    const terapagosStellar = genTestMon({
        name: "terapagos-stellar",
        isTera: true,
        teraType: "Stellar"
    });
    battle.setPokemon("attacker", terapagosStellar)
    const damageFromTerapagosStellar = battle.getDamage()
    expect(damageFromTerapagosStellar.factors.attacker.isTera).toBe(true)
    expect(damageFromTerapagosStellar.factors.field.isDouble).toBe(true)
    expect(damageFromTerapagosStellar.factors.attacker.atk).toBe("specialAttack")
})