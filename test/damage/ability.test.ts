import { expect, test } from "bun:test";
import { Battle, createMove } from "../../src";
import { genTestMon, getDamangeNumberFromResult } from "./utils";
test("Supreme Overlord", () => {
    const kingGambit = genTestMon({
        types: ["Dark", "Steel"],
        baseStat: {
            attack: 135,
        },
        ability: "Supreme Overlord 1"
    })
    const amoonguss = genTestMon({
        types: ["Grass", "Poison"],
        baseStat: {
            hp: 114,
            defense: 70
        }
    })
    const move = createMove({
        base: 80,
        type: "Steel",
    })
    const battle = new Battle({
        attacker: kingGambit,
        defender: amoonguss,
        move,
    });
    const actual = getDamangeNumberFromResult(battle.getDamage());
    const expected = [
        85,
        87,
        88,
        88,
        90,
        91,
        91,
        93,
        94,
        94,
        96,
        97,
        97,
        99,
        100,
        102
    ];
    expect(actual).toEqual(expected);
    kingGambit.ability = "Supreme Overlord 2"
    const down2Actual = getDamangeNumberFromResult(battle.getDamage());
    const down2Expected = [
        93,
        94,
        96,
        97,
        97,
        99,
        100,
        102,
        102,
        103,
        105,
        106,
        106,
        108,
        109,
        111
    ];
    expect(actual).toEqual(expected);
    kingGambit.ability = "Supreme Overlord 3"
    const down3Actual = getDamangeNumberFromResult(battle.getDamage());
    const down3Expected = [
        102,
        102,
        103,
        105,
        106,
        108,
        108,
        109,
        111,
        112,
        114,
        114,
        115,
        117,
        118,
        120
    ];
    expect(actual).toEqual(expected);

})