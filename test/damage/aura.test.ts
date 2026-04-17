import { expect, test } from "bun:test";
import { Battle, createMove } from "../../src";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

test("Pixilate with Fairy Aura", () => {
    const sylveon = genTestMon({
        types: ["Fairy"],
        baseStat: { specialAttack: 110 },
        ability: "Pixilate",
    });
    const dragonite = genTestMon({
        types: ["Dragon", "Flying"],
        baseStat: { hp: 91, specialDefense: 100 },
    });
    const move = createMove({
        base: 90,
        type: "Normal",
        category: "Special",
        target: "allAdjacentFoes",
    });
    const battle = new Battle({
        attacker: sylveon,
        defender: dragonite,
        move,
        field: { aura: ["Fairy"], isDouble: true },
    });
    const damage = battle.getDamage();
    const actual = getDamangeNumberFromResult(damage);
    expect(actual).toEqual([
        132, 132, 134, 134, 138, 138, 140, 140, 144, 144, 146, 146, 150, 150, 152, 156,
    ]);
    expect(damage.factors.field?.aura).toEqual(true);
    expect(damage.factors.attacker?.ability).toEqual(true);
});

test("Fairy move under Fairy Aura", () => {
    const attacker = genTestMon({
        types: ["Fairy"],
        baseStat: { specialAttack: 120 },
    });
    const defender = genTestMon({
        types: ["Dragon"],
        baseStat: { hp: 91, specialDefense: 100 },
    });
    const move = createMove({
        base: 90,
        type: "Fairy",
        category: "Special",
    });
    const battle = new Battle({
        attacker,
        defender,
        move,
        field: { aura: ["Fairy"] },
    });
    const damage = battle.getDamage();
    const actual = getDamangeNumberFromResult(damage);
    expect(actual).toEqual([
        158, 162, 162, 164, 168, 168, 170, 170, 174, 176, 176, 180, 182, 182, 186, 188,
    ]);
    expect(damage.factors.field?.aura).toEqual(true);
});

test("Dark move under Dark Aura", () => {
    const attacker = genTestMon({
        types: ["Dark"],
        baseStat: { specialAttack: 120 },
    });
    const defender = genTestMon({
        types: ["Fairy"],
        baseStat: { hp: 91, specialDefense: 100 },
    });
    const move = createMove({
        base: 90,
        type: "Dark",
        category: "Special",
    });
    const battle = new Battle({
        attacker,
        defender,
        move,
        field: { aura: ["Dark"] },
    });
    const damage = battle.getDamage();
    const actual = getDamangeNumberFromResult(damage);
    expect(actual).toEqual([
        39, 40, 40, 41, 42, 42, 42, 42, 43, 44, 44, 45, 45, 45, 46, 47,
    ]);
    expect(damage.factors.field?.aura).toEqual(true);
});

test("Aura Break present (interaction test)", () => {
    const attacker = genTestMon({
        types: ["Fairy"],
        baseStat: { specialAttack: 120 },
    });
    const defender = genTestMon({
        types: ["Dragon"],
        baseStat: { hp: 91, specialDefense: 100 },
    });
    const move = createMove({
        base: 90,
        type: "Fairy",
        category: "Special",
    });
    const battle = new Battle({
        attacker,
        defender,
        move,
        field: { aura: ["Fairy", "Aura Break"] },
    });
    const damage = battle.getDamage();
    const actual = getDamangeNumberFromResult(damage);
    expect(actual).toEqual([
        90, 90, 92, 92, 96, 96, 96, 98, 98, 98, 102, 102, 102, 104, 104, 108,
    ]);
    expect(damage.factors.field?.aura).toEqual(true);
});
