import { type TemporalFactor, createFactorHelper } from "./battle";
import type { BattleStatus, Move } from "./config";
import {
  checkMatchType,
  checkStatOfMoveCategoryIsHighest,
  mergeFactorList,
  pipeModifierHelper,
} from "./utils";

export function getDefense(
  option: Pick<BattleStatus, "defender" | "move">,
): TemporalFactor {
  const { move, defender } = option;
  function checkCountStages(stageChange: number) {
    if (move.flags?.isCriticalHit &&
      stageChange > 0
    ) {
      return false;
    }
    // sacred sword
    if (move.id === 533|| move.id===663) {
      return false
    }
    return true;
  }

  const usePhysicalDef = checkUsePhysicalHelper(move);
  const key: "defense" | "specialDefense" = usePhysicalDef
    ? "defense"
    : "specialDefense";
  const defStat = defender.getStat(
    key,
    checkCountStages(defender.statStage[key]),
  );
  const operator = pipeModifierHelper(
    { operator: 4096, factors: {} } as TemporalFactor,
    [modifyByWeather, modifyByDefenderAbility, modifyByItem, modifyByRuin],
    (pre, cur) => {
      const { operator, factors } = cur(option);
      return {
        operator: Math.round(pre.operator * operator),
        factors: mergeFactorList(pre.factors, factors),
      };
    },
  );
  const result = Math.round((defStat * operator.operator) / 4096 - 0.001);

  return { operator: result, factors: operator.factors };
}

function modifyByWeather({
  defender,
  field,
  move: { category },
}: Pick<BattleStatus, "defender" | "field" | "move">): TemporalFactor {
  const getFactor = createFactorHelper({
    defender: {
      weather: true,
    },
  });
  // Snow
  if (
    checkMatchType(defender, "Ice") &&
    field?.weather === "Snow" &&
    category === "Physical"
  ) {
    return getFactor(1.5);
  }
  // Sand
  if (
    checkMatchType(defender, "Rock") &&
    field?.weather === "Sand" &&
    category === "Special"
  ) {
    return getFactor(1.5);
  }
  return { operator: 1 };
}

function modifyByDefenderAbility({
  defender,
  move,
  field,
}: Pick<BattleStatus, "defender" | "move" | "field">): TemporalFactor {
  const getFactor = createFactorHelper({
    defender: {
      ability: true,
    },
  });

  const { ability } = defender;
  // Fur Coat
  if (ability === "Fur Coat" && move.category === "Physical") {
    return getFactor(2);
  }
  // Marvel Scale
  if (
    ability === "Marvel Scale" &&
    defender.status === "Burned" &&
    move.category === "Physical"
  ) {
    return getFactor(1.5, {
      defender: {
        status: true,
      },
    });
  }
  // Quark Drive & Protosynthesis
  if (ability === "Quark Drive") {
    let factors: TemporalFactor["factors"] = {};
    let activated = false;
    if (defender.item === "Booster Energy") {
      activated = true;
      factors = {
        defender: {
          item: true,
        },
      };
    }
    if (field?.terrain === "Electric") {
      activated = true;
      factors = {
        field: {
          terrain: true,
        },
      };
    }
    if (
      activated &&
      checkStatOfMoveCategoryIsHighest(move.category, defender.getStats())
    ) {
      return getFactor(1.3, factors);
    }
  }
  if (ability === "Protosynthesis") {
    let factors: TemporalFactor["factors"] = {};
    let activated = false;
    if (defender.item === "Booster Energy") {
      activated = true;
      factors = {
        defender: {
          ability: true,
        },
      };
    }
    if (field?.weather === "Sun") {
      activated = true;
      factors = {
        defender: {
          weather: true,
        },
      };
    }
    if (
      activated &&
      checkStatOfMoveCategoryIsHighest(move.category, defender.getStats())
    ) {
      return getFactor(1.3, factors);
    }
  }

  return { operator: 1 };
}

function modifyByItem({
  defender: { item, flags },
  move,
}: Pick<BattleStatus, "defender" | "move">): TemporalFactor {
  const getFactor = createFactorHelper({
    defender: {
      item: true,
    },
  });
  if (
    item === "Assault Vest" &&
    move.category === "Special" &&
    !checkUsePhysicalHelper(move)
  ) {
    return getFactor(1.5);
  }
  if (item === "Eviolite" && flags?.hasEvolution) {
    return getFactor(1.5);
  }
  return { operator: 1 };
}

function modifyByRuin({
  defender,
  move,
  field,
}: Pick<BattleStatus, "move" | "field" | "defender">): TemporalFactor {
  // ruin ability doesn't affect owner
  const usePhysicalDef = checkUsePhysicalHelper(move);
  // Sword
  if (
    field?.ruin?.includes("Sword") &&
    usePhysicalDef &&
    defender.ability !== "Sword of Ruin"
  ) {
    return {
      operator: 0.75,
      factors: {
        attacker: {
          ruin: "Sword",
        },
      },
    };
  }
  // Beads
  if (
    field?.ruin?.includes("Beads") &&
    !usePhysicalDef &&
    defender.ability !== "Beads of Ruin"
  ) {
    return {
      operator: 0.75,
      factors: {
        attacker: {
          ruin: "Beads",
        },
      },
    };
  }
  return { operator: 1 };
}

function checkUsePhysicalHelper(move: Move): boolean {
  return move.category === "Physical" || move.id === 473 || move.id === 540; // Psyshock & Psystrike
}
