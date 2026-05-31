import { buildAiPlaygroundSnapshot } from "vgc_data_wrapper";
import type { PlaygroundSnapshot } from "vgc_data_wrapper";

export const SAMPLE_AI_DAMAGE_INPUT = {
  attacker: {
    statMode: "derived",
    types: ["Normal"],
    baseStat: {
      hp: 100,
      attack: 100,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed: 100,
    },
  },
  defender: {
    statMode: "manual",
    types: ["Normal"],
    stats: {
      hp: 100,
      attack: 100,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed: 100,
    },
  },
  move: {
    base: 100,
    type: "Normal",
    category: "Special",
    target: "selectedTarget",
  },
} as const;

export const SAMPLE_AI_DAMAGE_INPUT_TEXT = JSON.stringify(
  SAMPLE_AI_DAMAGE_INPUT,
  null,
  2,
);

export type DeterministicEvaluation = {
  rawInputText: string;
  parseError: string | null;
  snapshot: PlaygroundSnapshot | null;
};

export function evaluateDeterministicInput(
  rawInputText: string,
): DeterministicEvaluation {
  try {
    const rawInput: unknown = JSON.parse(rawInputText);
    return {
      rawInputText,
      parseError: null,
      snapshot: buildAiPlaygroundSnapshot(rawInput),
    };
  } catch (error) {
    return {
      rawInputText,
      parseError: error instanceof Error ? error.message : String(error),
      snapshot: null,
    };
  }
}
