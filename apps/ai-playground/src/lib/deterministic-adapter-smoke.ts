import {
  AiDamageCalcInputSchema,
  buildAiPlaygroundSnapshot,
  normalizeAiDamageCalcInput,
  safeCalculateAiDamage,
} from "vgc_data_wrapper";

/** Confirms that the app resolves the deterministic adapter through the workspace package contract. */
export const deterministicAdapterSmoke = {
  packageName: "vgc_data_wrapper",
  exports: [
    "AiDamageCalcInputSchema",
    "normalizeAiDamageCalcInput",
    "safeCalculateAiDamage",
    "buildAiPlaygroundSnapshot",
  ],
  importReady:
    typeof AiDamageCalcInputSchema.safeParse === "function" &&
    typeof normalizeAiDamageCalcInput === "function" &&
    typeof safeCalculateAiDamage === "function" &&
    typeof buildAiPlaygroundSnapshot === "function",
} as const;
