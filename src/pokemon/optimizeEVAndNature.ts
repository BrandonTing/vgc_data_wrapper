import type { Stat } from "../damage/config";
import { Pokemon } from "./base";
import { getMaxEvPerStat, getMaxTotalEvs } from "./effortValue";

type Nature = Pokemon["nature"];
type StatKey = keyof Stat;
type NonHpStatKey = Exclude<StatKey, "hp">;

type OptimizeEVAndNatureSnapshot = {
	effortValues: Stat;
	nature: Nature;
	stats: Stat;
	totalEffortValues: number;
};

type OptimizeEVAndNatureResult =
	| {
			original: OptimizeEVAndNatureSnapshot;
			optimized: OptimizeEVAndNatureSnapshot;
			savedEffortValues: number;
			foundImprovement: true;
	  }
	| {
			foundImprovement: false;
	  };

const STAT_KEYS: StatKey[] = [
	"hp",
	"attack",
	"defense",
	"specialAttack",
	"specialDefense",
	"speed",
];

const NON_HP_STAT_KEYS: NonHpStatKey[] = [
	"attack",
	"defense",
	"specialAttack",
	"specialDefense",
	"speed",
];

const NATURES: Nature[] = [
	{},
	...NON_HP_STAT_KEYS.flatMap((plus) =>
		NON_HP_STAT_KEYS.filter((minus) => minus !== plus).map((minus) => ({
			plus,
			minus,
		})),
	),
];

export function optimizeEVAndNature(
	pokemon: Pokemon,
): OptimizeEVAndNatureResult {
	const originalStats = pokemon.getStats(false);
	const derivedStats = getDerivedStats(pokemon);
	if (!statsEqual(originalStats, derivedStats)) {
		throw new Error("Provided manual stats are inconsistent");
	}

	const originalNature = cloneNature(pokemon.nature);
	const originalEvs = cloneStats(pokemon.effortValues);
	const originalTotal = getTotalEvs(originalEvs);
	const original = {
		effortValues: originalEvs,
		nature: originalNature,
		stats: cloneStats(originalStats),
		totalEffortValues: originalTotal,
	};

	const best = NATURES.reduce(
		(currentBest, nature) => {
			const candidate = buildCandidateEvs(pokemon, originalStats, nature);
			if (!candidate) return currentBest;

			if (
				!currentBest ||
				isBetter(candidate, currentBest, originalEvs, originalNature)
			) {
				return candidate;
			}
			return currentBest;
		},
		null as null | {
			effortValues: Stat;
			nature: Nature;
			totalEffortValues: number;
		},
	);

	const optimized = best ?? {
		effortValues: originalEvs,
		nature: originalNature,
		totalEffortValues: originalTotal,
	};

	const savedEffortValues = originalTotal - optimized.totalEffortValues;
	const optimizedSnapshot = {
		effortValues: optimized.effortValues,
		nature: optimized.nature,
		stats: cloneStats(originalStats),
		totalEffortValues: optimized.totalEffortValues,
	};

	if (savedEffortValues > 0) {
		return {
			original,
			optimized: optimizedSnapshot,
			savedEffortValues,
			foundImprovement: true,
		};
	}

	return {
		foundImprovement: false,
	};
}

function getDerivedStats(pokemon: Pokemon): Stat {
	const clone = clonePokemonLike(
		pokemon,
		undefined,
		cloneStats(pokemon.effortValues),
	);
	return clone.getStats(false);
}

function clonePokemonLike(
	pokemon: Pokemon,
	nature: Nature | undefined,
	effortValues: Stat,
): Pokemon {
	return new Pokemon({
		level: pokemon.level,
		baseStat: cloneStats(pokemon.baseStat),
		individualValues: cloneStats(pokemon.individualValues),
		effortValues,
		statRuleset: pokemon.statRuleset,
		nature: nature ?? cloneNature(pokemon.nature),
	});
}

function buildCandidateEvs(
	pokemon: Pokemon,
	targetStats: Stat,
	nature: Nature,
) {
	const maxPerStat = getMaxEvPerStat(pokemon.statRuleset);
	const effortValues = {
		hp: 0,
		attack: 0,
		defense: 0,
		specialAttack: 0,
		specialDefense: 0,
		speed: 0,
	};

	for (const key of STAT_KEYS) {
		const ev = findMinEvForStat(
			pokemon,
			key,
			targetStats[key],
			nature,
			maxPerStat,
		);
		if (ev === null) return null;
		effortValues[key] = ev;
	}

	const totalEffortValues = getTotalEvs(effortValues);
	if (totalEffortValues > getMaxTotalEvs(pokemon.statRuleset)) {
		return null;
	}

	return { effortValues, nature: cloneNature(nature), totalEffortValues };
}

function findMinEvForStat(
	pokemon: Pokemon,
	statKey: StatKey,
	targetStat: number,
	nature: Nature,
	maxPerStat: number,
): number | null {
	for (let ev = 0; ev <= maxPerStat; ev++) {
		const effortValues = {
			hp: 0,
			attack: 0,
			defense: 0,
			specialAttack: 0,
			specialDefense: 0,
			speed: 0,
		};
		effortValues[statKey] = ev;
		const value = clonePokemonLike(pokemon, nature, effortValues).getStat(
			statKey,
			false,
		);
		if (value === targetStat) return ev;
		if (value > targetStat) return null;
	}
	return null;
}

function isBetter(
	candidate: { effortValues: Stat; nature: Nature; totalEffortValues: number },
	best: { effortValues: Stat; nature: Nature; totalEffortValues: number },
	originalEvs: Stat,
	originalNature: Nature,
) {
	if (candidate.totalEffortValues !== best.totalEffortValues) {
		return candidate.totalEffortValues < best.totalEffortValues;
	}
	const candidateNatureMatch = natureEqual(candidate.nature, originalNature);
	const bestNatureMatch = natureEqual(best.nature, originalNature);
	if (candidateNatureMatch !== bestNatureMatch) return candidateNatureMatch;

	const candidateDistance = getDistance(candidate.effortValues, originalEvs);
	const bestDistance = getDistance(best.effortValues, originalEvs);
	if (candidateDistance !== bestDistance) {
		return candidateDistance < bestDistance;
	}

	for (const key of STAT_KEYS) {
		if (candidate.effortValues[key] !== best.effortValues[key]) {
			return candidate.effortValues[key] < best.effortValues[key];
		}
	}
	return false;
}

function getDistance(a: Stat, b: Stat) {
	return STAT_KEYS.reduce((total, key) => total + Math.abs(a[key] - b[key]), 0);
}

function getTotalEvs(effortValues: Stat) {
	return Object.values(effortValues).reduce((sum, value) => sum + value, 0);
}

function statsEqual(a: Stat, b: Stat) {
	return STAT_KEYS.every((key) => a[key] === b[key]);
}

function natureEqual(a: Nature, b: Nature) {
	return a.plus === b.plus && a.minus === b.minus;
}

function cloneStats(stat: Stat): Stat {
	return { ...stat };
}

function cloneNature(nature: Nature): Nature {
	return { ...nature };
}
