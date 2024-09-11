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
  const damage = battle.getDamage()
  const actual = getDamangeNumberFromResult(damage);
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
  expect(damage.factors.attacker.ability).toEqual(true);
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
  expect(down2Actual).toEqual(down2Expected);
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
  expect(down3Actual).toEqual(down3Expected);
})

test("Liquid Voice", () => {
  const primirina = genTestMon({
    types: ["Water", "Fairy"],
    baseStat: {
      specialAttack: 126,
    },
    ability: "Liquid Voice"
  })
  const incineroar = genTestMon({
    types: ["Fire", "Dark"],
    baseStat: {
      hp: 95,
      specialDefense: 90
    }
  })
  const move = createMove({
    base: 90,
    type: "Normal",
    category: "Special",
    flags: {
      isSound: true,
    },
    target: "allAdjacentFoes"
  })
  const battle = new Battle({
    attacker: primirina,
    defender: incineroar,
    move,
  });
  const damage = battle.getDamage()
  const actual = getDamangeNumberFromResult(damage);
  const expected = [
    102,
    102,
    102,
    104,
    104,
    108,
    108,
    108,
    110,
    110,
    114,
    114,
    114,
    116,
    116,
    120
  ];
  expect(actual).toEqual(expected);
  expect(damage.factors.attacker.ability).toEqual(true);
})