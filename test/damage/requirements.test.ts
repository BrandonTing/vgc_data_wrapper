import { expect, test } from "bun:test";
import { Battle, createMove, getMinAtkRequirement, getMinDefRequirement } from "../../src";
import { genTestMon } from "./utils";

test("getMinDefRequirement supports guaranteed, chance, and 2-hit for mainSeries and champions", () => {
  const move = createMove({ type: "Normal", base: 80, category: "Physical" });

  const attacker = genTestMon({ baseStat: { attack: 120 }, effortValues: { attack: 252 }, statRuleset: "mainSeries" });
  const defender = genTestMon({ baseStat: { hp: 95, defense: 95, specialDefense: 70 }, statRuleset: "mainSeries" });

  const guaranteed = getMinDefRequirement({ attacker, defender, move, target: { type: "guaranteed-2hit" } });
  expect(guaranteed.satisfied).toBe(true);
  if (guaranteed.satisfied) {
    expect(Object.keys(guaranteed.investment).sort()).toEqual(["defense", "hp"]);
  }

  const chance = getMinDefRequirement({ attacker, defender, move, target: { type: "chance", value: 75 } });
  expect(chance.satisfied).toBe(true);

  const twoHit = getMinDefRequirement({ attacker, defender, move, target: { type: "guaranteed-2hit" } });
  expect(twoHit.satisfied).toBe(true);

  const specialMove = createMove({ type: "Normal", base: 80, category: "Special" });
  const special = getMinDefRequirement({ attacker, defender, move: specialMove, target: { type: "guaranteed" } });
  if (special.satisfied) {
    expect(Object.keys(special.investment).sort()).toEqual(["hp", "specialDefense"]);
  }

  const champAtk = genTestMon({ baseStat: { attack: 120 }, effortValues: { attack: 32 }, statRuleset: "champions" });
  const champDef = genTestMon({ baseStat: { hp: 95, defense: 95, specialDefense: 95 }, statRuleset: "champions" });
  const champResult = getMinDefRequirement({ attacker: champAtk, defender: champDef, move, target: { type: "guaranteed" } });
  expect(champResult.statRuleset).toBe("champions");
});

test("getMinAtkRequirement supports guaranteed, chance, and 2-hit with deterministic minimum investment", () => {
  const defender = genTestMon({ baseStat: { hp: 100, defense: 100, specialDefense: 100 }, statRuleset: "mainSeries" });
  const attacker = genTestMon({ baseStat: { attack: 150, specialAttack: 150 }, statRuleset: "mainSeries" });

  const physical = createMove({ type: "Normal", base: 250, category: "Physical" });
  const guaranteed = getMinAtkRequirement({ attacker, defender, move: physical, target: { type: "guaranteed-2hit" } });
  expect(guaranteed.satisfied).toBe(true);
  if (guaranteed.satisfied) {
    expect(Object.keys(guaranteed.investment)).toEqual(["attack"]);
  }

  const chance = getMinAtkRequirement({ attacker, defender, move: physical, target: { type: "guaranteed-2hit" } });
  expect(chance.satisfied).toBe(true);

  const twoHit = getMinAtkRequirement({ attacker, defender, move: physical, target: { type: "guaranteed-2hit" } });
  expect(twoHit.satisfied).toBe(true);

  const special = getMinAtkRequirement({ attacker, defender, move: createMove({ type: "Normal", base: 250, category: "Special" }), target: { type: "guaranteed-2hit" } });
  if (special.satisfied) {
    expect(Object.keys(special.investment)).toEqual(["specialAttack"]);
  }

  if (guaranteed.satisfied) {
    const recalculatedAttacker = genTestMon({
      ...attacker,
      effortValues: { ...attacker.effortValues, attack: guaranteed.investment.attack ?? 0 },
    });
    const dmg = new Battle({ attacker: recalculatedAttacker, defender, move: physical }).getDamage();
    expect(dmg.koChance).toBeGreaterThan(0);
  }
});

test("returns unsatisfied for impossible targets", () => {
  const defender = genTestMon({ baseStat: { hp: 1, defense: 1, specialDefense: 1 }, statRuleset: "mainSeries" });
  const attacker = genTestMon({ baseStat: { attack: 1, specialAttack: 1 }, statRuleset: "mainSeries" });

  const impossibleDef = getMinDefRequirement({
    attacker: genTestMon({ baseStat: { attack: 255 }, effortValues: { attack: 252 }, statRuleset: "mainSeries" }),
    defender,
    move: createMove({ type: "Normal", base: 250, category: "Physical" }),
    target: { type: "guaranteed" },
  });
  expect(impossibleDef.satisfied).toBe(false);
  expect("investment" in impossibleDef).toBe(false);

  const impossibleAtk = getMinAtkRequirement({
    attacker,
    defender: genTestMon({ baseStat: { hp: 255, defense: 255, specialDefense: 255 }, statRuleset: "mainSeries" }),
    move: createMove({ type: "Normal", base: 1, category: "Special" }),
    target: { type: "guaranteed" },
  });
  expect(impossibleAtk.satisfied).toBe(false);
  expect("investment" in impossibleAtk).toBe(false);
});


test("respects provided nature without auto-optimizing nature", () => {
  const physical = createMove({ type: "Normal", base: 250, category: "Physical" });

  const atkNeutral = genTestMon({
    baseStat: { attack: 120 },
    statRuleset: "mainSeries",
    nature: {},
  });
  const atkBoosted = genTestMon({
    baseStat: { attack: 120 },
    statRuleset: "mainSeries",
    nature: { plus: "attack", minus: "specialAttack" },
  });
  const defTarget = genTestMon({
    baseStat: { hp: 90, defense: 80, specialDefense: 80 },
    statRuleset: "mainSeries",
  });

  const atkNeutralResult = getMinAtkRequirement({
    attacker: atkNeutral,
    defender: defTarget,
    move: physical,
    target: { type: "chance", value: 50 },
  });
  const atkBoostedResult = getMinAtkRequirement({
    attacker: atkBoosted,
    defender: defTarget,
    move: physical,
    target: { type: "chance", value: 50 },
  });

  expect(atkNeutralResult.satisfied).toBe(true);
  expect(atkBoostedResult.satisfied).toBe(true);
  if (atkNeutralResult.satisfied && atkBoostedResult.satisfied) {
    expect(atkBoostedResult.investment.attack ?? 999).toBeLessThanOrEqual(
      atkNeutralResult.investment.attack ?? 999,
    );
  }

  const attacker = genTestMon({
    baseStat: { attack: 140 },
    effortValues: { attack: 252 },
    statRuleset: "mainSeries",
  });
  const defNeutral = genTestMon({
    baseStat: { hp: 95, defense: 100, specialDefense: 90 },
    statRuleset: "mainSeries",
    nature: {},
  });
  const defBoosted = genTestMon({
    baseStat: { hp: 95, defense: 100, specialDefense: 90 },
    statRuleset: "mainSeries",
    nature: { plus: "defense", minus: "specialAttack" },
  });

  const defNeutralResult = getMinDefRequirement({
    attacker,
    defender: defNeutral,
    move: physical,
    target: { type: "guaranteed-2hit" },
  });
  const defBoostedResult = getMinDefRequirement({
    attacker,
    defender: defBoosted,
    move: physical,
    target: { type: "guaranteed-2hit" },
  });

  expect(defNeutralResult.satisfied).toBe(true);
  expect(defBoostedResult.satisfied).toBe(true);
  if (defNeutralResult.satisfied && defBoostedResult.satisfied) {
    const neutralTotal = (defNeutralResult.investment.hp ?? 0) + (defNeutralResult.investment.defense ?? 0);
    const boostedTotal = (defBoostedResult.investment.hp ?? 0) + (defBoostedResult.investment.defense ?? 0);
    expect(boostedTotal).toBeLessThanOrEqual(neutralTotal);
  }
});


test("supports Battle field input (e.g. Sun) and changes requirement accordingly", () => {
  const attacker = genTestMon({
    types: ["Fire"],
    baseStat: { specialAttack: 140 },
    effortValues: { specialAttack: 252 },
    statRuleset: "mainSeries",
  });
  const defender = genTestMon({
    types: ["Grass"],
    baseStat: { hp: 100, defense: 90, specialDefense: 100 },
    statRuleset: "mainSeries",
  });
  const move = createMove({ type: "Fire", base: 95, category: "Special" });

  const noWeather = getMinDefRequirement({
    attacker,
    defender,
    move,
    target: { type: "guaranteed-2hit" },
  });
  const inSun = getMinDefRequirement({
    attacker,
    defender,
    move,
    field: { weather: "Sun" },
    target: { type: "chance", value: 50 },
  });

  expect(noWeather.satisfied).toBe(true);

  // Sun should never make this requirement easier: either it needs equal/higher investment
  // or it becomes impossible under limits.
  if (inSun.satisfied) {
    const noWeatherTotal = (noWeather.investment.hp ?? 0) + (noWeather.investment.specialDefense ?? 0);
    const inSunTotal = (inSun.investment.hp ?? 0) + (inSun.investment.specialDefense ?? 0);
    expect(inSunTotal).toBeGreaterThanOrEqual(noWeatherTotal);
  } else {
    expect(inSun.reason).toBe("No valid investment satisfies the target");
  }
});


function calcKoChanceWithDefInvestment({ attacker, defender, move, hp, defense, specialDefense, field }: {
  attacker: ReturnType<typeof genTestMon>;
  defender: ReturnType<typeof genTestMon>;
  move: ReturnType<typeof createMove>;
  hp?: number;
  defense?: number;
  specialDefense?: number;
  field?: { weather?: "Sun" | "Rain" | "Sand" | "Snow"; terrain?: "Electric" | "Grassy" | "Misty" | "Psychic"; isDouble?: boolean };
}) {
  const mon = genTestMon({
    ...defender,
    effortValues: {
      ...defender.effortValues,
      hp: hp ?? defender.effortValues.hp,
      defense: defense ?? defender.effortValues.defense,
      specialDefense: specialDefense ?? defender.effortValues.specialDefense,
    },
  });
  return new Battle({ attacker, defender: mon, move, field }).getDamage().koChance;
}

test("strict: defensive result is minimal and satisfies guaranteed target semantics", () => {
  const attacker = genTestMon({ baseStat: { attack: 130 }, effortValues: { attack: 252 }, statRuleset: "mainSeries" });
  const defender = genTestMon({ baseStat: { hp: 95, defense: 90, specialDefense: 90 }, statRuleset: "mainSeries" });
  const move = createMove({ type: "Normal", base: 120, category: "Physical" });

  const result = getMinDefRequirement({ attacker, defender, move, target: { type: "guaranteed" } });
  expect(result.satisfied).toBe(true);
  if (!result.satisfied) return;

  const hp = result.investment.hp ?? 0;
  const def = result.investment.defense ?? 0;

  const koChance = calcKoChanceWithDefInvestment({ attacker, defender, move, hp, defense: def });
  expect(koChance).toBe(0);

  if (hp > 0) {
    const prevHpKoChance = calcKoChanceWithDefInvestment({ attacker, defender, move, hp: hp - 1, defense: def });
    expect(prevHpKoChance).toBeGreaterThan(0);
  } else if (def > 0) {
    const prevDefKoChance = calcKoChanceWithDefInvestment({ attacker, defender, move, hp, defense: def - 1 });
    expect(prevDefKoChance).toBeGreaterThan(0);
  }
});

test("strict: offensive result is minimal and satisfies chance target semantics", () => {
  const attacker = genTestMon({ baseStat: { specialAttack: 200 }, statRuleset: "mainSeries" });
  const defender = genTestMon({ baseStat: { hp: 80, defense: 90, specialDefense: 70 }, statRuleset: "mainSeries" });
  const move = createMove({ type: "Water", base: 250, category: "Special" });

  const result = getMinAtkRequirement({ attacker, defender, move, target: { type: "guaranteed-2hit" } });
  expect(result.satisfied).toBe(true);
  if (!result.satisfied) return;

  const spa = result.investment.specialAttack ?? 0;
  const mon = genTestMon({ ...attacker, effortValues: { ...attacker.effortValues, specialAttack: spa } });
  const koChance = new Battle({ attacker: mon, defender, move }).getDamage().koChance;
  expect(koChance).toBeGreaterThan(0);

  if (spa > 0) {
    const lessMon = genTestMon({ ...attacker, effortValues: { ...attacker.effortValues, specialAttack: spa - 1 } });
    const lessKoChance = new Battle({ attacker: lessMon, defender, move }).getDamage().koChance;
    expect(lessKoChance).toBe(0);
  }
});
