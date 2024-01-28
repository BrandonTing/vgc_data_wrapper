import type { Move } from "./config";

export function createMove({
	base,
	type,
	category,
	flags,
	id,
	repeatTimes,
	target,
}: Partial<Move>): Move {
	return {
		base: base ?? 0,
		type: type ?? "Normal",
		category: category ?? "Physical",
		flags,
		id: id ?? 0,
		repeatTimes,
		target: target ?? "selectedTarget",
	};
}
