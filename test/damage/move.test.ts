import { expect, test } from "bun:test";
import { Battle, createMove } from "../../src";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

test("freeze dry", () => {
  const ironBundle = genTestMon({
    types: ["Ice", "Water"],
    baseStat: {
      specialAttack: 124,
    },
  });
  const gastrodon = genTestMon({
    types: ["Water", "Ground"],
    baseStat: {
      hp: 111,
      specialDefense: 82,
    },
  });
  const move = createMove({
    id: 573,
    base: 70,
    type: "Ice",
    category: "Special",
  });
  const battle = new Battle({
    attacker: ironBundle,
    defender: gastrodon,
    move,
  });
  const actual = getDamangeNumberFromResult(battle.getDamage());
  const expected = [
    228, 228, 232, 232, 240, 240, 240, 244, 244, 252, 252, 256, 256, 264, 264,
    268,
  ];
  expect(actual).toEqual(expected);
});

test("terapagos using Tera Starstorm", () => {
  const terapagos = genTestMon({
    id: 1024,
    isTera: true,
    teraType: "Stellar",
  });
  const testMon = genTestMon({});
  const move = createMove({
    id: 906,
    base: 120,
    category: "Special",
  });
  const battle = new Battle({
    attacker: terapagos,
    defender: testMon,
    move,
  });
  const damage = battle.getDamage();
  expect(damage.factors.attacker.isTera).toBe(true);
  expect(damage.factors.field.isDouble).toBe(true);
  expect(damage.factors.attacker.atk).toBe("specialAttack");

  const terapagosPhysical = genTestMon({
    id: 1024,
    isTera: true,
    teraType: "Stellar",
    stats: {
      attack: 101,
      specialAttack: 100,
    },
  });
  battle.setPokemon("attacker", terapagosPhysical);
  testMon.toggleTera({ isTera: true });
  const againstTeraDefender = battle.getDamage();
  expect(againstTeraDefender.factors.attacker.isTera).toBe(true);
  expect(againstTeraDefender.factors.defender.isTera).toBe(true);
  expect(againstTeraDefender.factors.field.isDouble).toBe(true);
  expect(againstTeraDefender.factors.attacker.atk).toBe("attack");

  const terapagosStellar = genTestMon({
    name: "terapagos-stellar",
    isTera: true,
    teraType: "Stellar",
  });
  battle.setPokemon("attacker", terapagosStellar);
  const damageFromTerapagosStellar = battle.getDamage();
  expect(damageFromTerapagosStellar.factors.attacker.isTera).toBe(true);
  expect(damageFromTerapagosStellar.factors.field.isDouble).toBe(true);
  expect(damageFromTerapagosStellar.factors.attacker.atk).toBe("specialAttack");
});

test("Ivy Cudgel changes type", () => {
  const ogerpon = genTestMon({
    name: "ogerpon",
    types: ["Grass"],
    baseStat: {
      attack: 120,
    },
  });
  const defender = genTestMon({
    types: ["Flying", "Fire"],
    baseStat: {
      hp: 78,
      defense: 78,
    },
  });
  const move = createMove({
    id: 904,
    type: "Grass",
    base: 100,
  });
  const battle = new Battle({
    attacker: ogerpon,
    defender,
    move,
  });
  let actual = [20, 20, 20, 21, 21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 24];
  let damage = battle.getDamage();
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);
  const ogerponWellspring = genTestMon({
    name: "ogerpon-wellspring-mask",
    types: ["Grass", "Water"],
    baseStat: {
      attack: 120,
    },
    item: "Ogerpon Mask",
  });
  battle.setPokemon("attacker", ogerponWellspring);
  damage = battle.getDamage();
  actual = [
    194, 198, 198, 200, 204, 206, 210, 210, 212, 216, 218, 218, 222, 224, 228,
    230,
  ];
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);

  const ogerponHearthflame = genTestMon({
    name: "ogerpon-hearthflame-mask",
    types: ["Grass", "Fire"],
    baseStat: {
      attack: 120,
    },
    item: "Ogerpon Mask",
  });
  battle.setPokemon("attacker", ogerponHearthflame);
  damage = battle.getDamage();
  actual = [48, 49, 49, 50, 51, 51, 52, 52, 53, 54, 54, 54, 55, 56, 57, 57];
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);
  const ogerponCornerstone = genTestMon({
    name: "ogerpon-cornerstone-mask",
    types: ["Grass", "Rock"],
    baseStat: {
      attack: 120,
    },
    item: "Ogerpon Mask",
  });
  battle.setPokemon("attacker", ogerponCornerstone);
  damage = battle.getDamage();
  actual = [
    388, 396, 396, 400, 408, 412, 420, 420, 424, 432, 436, 436, 444, 448, 456,
    460,
  ];
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);
});

test("Revelation Dance changes type", () => {
  const attacker = genTestMon({
    types: ["Fire", "Flying"],
    baseStat: {
      specialAttack: 98,
    },
  });
  const defender = genTestMon({
    types: ["Flying", "Fire"],
    baseStat: {
      hp: 78,
      specialDefense: 85,
    },
  });
  const move = createMove({
    id: 686,
    type: "Normal",
    category: "Special",
    base: 90,
  });

  const actual = [
    29, 29, 30, 30, 30, 30, 30, 31, 31, 32, 32, 33, 33, 33, 33, 34,
  ];
  const battle = new Battle({
    attacker,
    defender,
    move,
  });

  const damage = battle.getDamage();
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);
});

test("Ivy Cudgel changes type", () => {
  const ogerpon = genTestMon({
    name: "ogerpon",
    types: ["Grass"],
    baseStat: {
      attack: 120,
    },
  });
  const defender = genTestMon({
    types: ["Flying", "Fire"],
    baseStat: {
      hp: 78,
      defense: 78,
    },
  });
  const move = createMove({
    id: 904,
    type: "Grass",
    base: 100,
  });
  const battle = new Battle({
    attacker: ogerpon,
    defender,
    move,
  });
  let actual = [20, 20, 20, 21, 21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 24];
  let damage = battle.getDamage();
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);
  const ogerponWellspring = genTestMon({
    name: "ogerpon-wellspring-mask",
    types: ["Grass", "Water"],
    baseStat: {
      attack: 120,
    },
    item: "Ogerpon Mask",
  });
  battle.setPokemon("attacker", ogerponWellspring);
  damage = battle.getDamage();
  actual = [
    194, 198, 198, 200, 204, 206, 210, 210, 212, 216, 218, 218, 222, 224, 228,
    230,
  ];
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);

  const ogerponHearthflame = genTestMon({
    name: "ogerpon-hearthflame-mask",
    types: ["Grass", "Fire"],
    baseStat: {
      attack: 120,
    },
    item: "Ogerpon Mask",
  });
  battle.setPokemon("attacker", ogerponHearthflame);
  damage = battle.getDamage();
  actual = [48, 49, 49, 50, 51, 51, 52, 52, 53, 54, 54, 54, 55, 56, 57, 57];
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);
  const ogerponCornerstone = genTestMon({
    name: "ogerpon-cornerstone-mask",
    types: ["Grass", "Rock"],
    baseStat: {
      attack: 120,
    },
    item: "Ogerpon Mask",
  });
  battle.setPokemon("attacker", ogerponCornerstone);
  damage = battle.getDamage();
  actual = [
    388, 396, 396, 400, 408, 412, 420, 420, 424, 432, 436, 436, 444, 448, 456,
    460,
  ];
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);
});

test("Tera Blast changes category", () => {
  const attacker = genTestMon({
    types: ["Fire", "Dark"],
    baseStat: {
      attack: 115,
      specialAttack: 80,
    },
    isTera: true,
    teraType: "Water",
  });
  const defender = genTestMon({
    types: ["Fire", "Dark"],
    baseStat: {
      hp: 95,
      defense: 90,
      specialDefense: 90,
    },
  });
  const move = createMove({
    id: 851,
    type: "Normal",
    category: "Special",
    base: 80,
  });

  const actual = [
    114, 114, 116, 116, 120, 120, 120, 122, 122, 126, 126, 128, 128, 132, 132, 134,
  ];
  const battle = new Battle({
    attacker,
    defender,
    move,
  });

  const damage = battle.getDamage();
  expect(getDamangeNumberFromResult(damage)).toEqual(actual);
});


test("Tera Blast changes type", () => {
  const attacker = genTestMon({
    types: ["Fire", "Flying"],
    baseStat: {
      attack: 84,
      specialAttack: 109,
    },
  });
  const defender = genTestMon({
    types: ["Grass", "Poison"],
    baseStat: {
      hp: 80,
      defense: 83,
      specialDefense: 100,
    },
  });
  const move = createMove({
    id: 851,
    type: "Normal",
    category: "Special",
    base: 80,
  });
  const battle = new Battle({
    attacker,
    defender,
    move,
  });

  const actualBeforeTera = [
    33, 33, 33, 34, 34, 35, 35, 35, 36, 36, 37, 37, 37, 38, 38, 39
  ];
  const damageBeforeTera = battle.getDamage();
  expect(getDamangeNumberFromResult(damageBeforeTera)).toEqual(actualBeforeTera);

  attacker.toggleTera({
    isTera: true,
    type: "Water",
  })

  const actualAfterTera = [
    24, 24, 24, 25, 25, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 29
  ];

  const damage = battle.getDamage();
  expect(getDamangeNumberFromResult(damage)).toEqual(actualAfterTera);
});
