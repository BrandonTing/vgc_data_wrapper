import { expect, test } from "bun:test";
import { createMove } from "../../src";
import { Battle } from "../../src/damage/battle";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

test("champion (default) vs non-champion damage rolls comparison", () => {
    // Setup test Pokémon
    const attacker = genTestMon({
        types: ["Normal"],
        baseStat: {
            specialAttack: 100,
        },
        effortValues: {
            specialAttack: 252,
        },
    });

    const defender = genTestMon({
        types: ["Normal"],
        stats: {
            hp: 100,
            specialDefense: 100,
        },
    });

    const move = createMove({
        type: "Normal",
        base: 100,
        category: "Special",
    });

    // Test champion (15 rolls) - default
    const battleChampion = new Battle({
        attacker,
        defender,
        move,
    });

    const damageChampion = battleChampion.getDamage();
    const rollsChampion = getDamangeNumberFromResult(damageChampion);

    // Champion should have 15 rolls (excludes the minimum)
    expect(rollsChampion).toHaveLength(15);

    // Test non-champion (16 rolls)
    const battleNonChampion = new Battle({
        attacker,
        defender,
        move,
        isChampion: false,
    });

    const damageNonChampion = battleNonChampion.getDamage();
    const rollsNonChampion = getDamangeNumberFromResult(damageNonChampion);

    // Non-champion should have 16 rolls
    expect(rollsNonChampion).toHaveLength(16);

    // Champion rolls should be the first 15 of non-champion rolls
    // (both ordered from highest to lowest damage)
    expect(rollsChampion).toEqual(rollsNonChampion.slice(0, 15));
});

test("champion KO chance calculation with 15 rolls", () => {
    const attacker = genTestMon({
        types: ["Normal"],
        baseStat: {
            specialAttack: 150,
        },
        effortValues: {
            specialAttack: 252,
        },
    });

    const defender = genTestMon({
        types: ["Normal"],
        stats: {
            hp: 100,
            specialDefense: 50,
        },
    });

    const move = createMove({
        type: "Normal",
        base: 100,
        category: "Special",
    });

    const battleChampion = new Battle({
        attacker,
        defender,
        move,
        isChampion: true,
    });

    const damageChampion = battleChampion.getDamage();

    // With 15 rolls and higher damage, KO chance should be calculated correctly
    // based on 15 rolls instead of 16
    expect(damageChampion.koChance).toBeGreaterThanOrEqual(0);
    expect(damageChampion.koChance).toBeLessThanOrEqual(100);

    // Verify rolls array has 15 elements
    expect(damageChampion.rolls).toHaveLength(15);
});

test("non-champion KO chance calculation with 16 rolls", () => {
    const attacker = genTestMon({
        types: ["Normal"],
        baseStat: {
            specialAttack: 150,
        },
        effortValues: {
            specialAttack: 252,
        },
    });

    const defender = genTestMon({
        types: ["Normal"],
        stats: {
            hp: 100,
            specialDefense: 50,
        },
    });

    const move = createMove({
        type: "Normal",
        base: 100,
        category: "Special",
    });

    const battleNonChampion = new Battle({
        attacker,
        defender,
        move,
        isChampion: false,
    });

    const damageNonChampion = battleNonChampion.getDamage();

    // With 16 rolls, KO chance should be calculated correctly
    expect(damageNonChampion.koChance).toBeGreaterThanOrEqual(0);
    expect(damageNonChampion.koChance).toBeLessThanOrEqual(100);

    // Verify rolls array has 16 elements
    expect(damageNonChampion.rolls).toHaveLength(16);
});

test("champion 2HKO vs 3HKO boundary test", () => {
    // Create a scenario where champion vs non-champion affects KO chance
    const attacker = genTestMon({
        types: ["Normal"],
        baseStat: {
            specialAttack: 100,
        },
        effortValues: {
            specialAttack: 252,
        },
    });

    const defender = genTestMon({
        types: ["Normal"],
        stats: {
            hp: 100,
            specialDefense: 100,
        },
    });

    const move = createMove({
        type: "Normal",
        base: 50,
        category: "Special",
    });

    // Non-champion 16 rolls
    const battleNonChampion = new Battle({
        attacker,
        defender,
        move,
        isChampion: false,
    });

    const damageNonChampion = battleNonChampion.getDamage();
    const minNonChampion = Math.min(
        ...getDamangeNumberFromResult(damageNonChampion),
    );

    // Champion 15 rolls (excludes the lowest damage)
    const battleChampion = new Battle({
        attacker,
        defender,
        move,
        isChampion: true,
    });

    const damageChampion = battleChampion.getDamage();
    const minChampion = Math.min(...getDamangeNumberFromResult(damageChampion));

    // Champion's minimum should be higher than non-champion's minimum
    expect(minChampion).toBeGreaterThan(minNonChampion);
});
