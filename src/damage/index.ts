import type { BattleStatus } from "./config";
import { getPower } from "./power";

export * as basePower from "./basePower";
export * as type from "./type";

function getDamage(option: BattleStatus): number {
	const power = getPower(option);
	return 0;
}
