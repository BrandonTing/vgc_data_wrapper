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
    
})