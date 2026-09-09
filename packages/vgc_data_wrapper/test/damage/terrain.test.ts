import { expect, test } from "bun:test";
import { Battle, createMove } from "../../src";
import { genTestMon, getDamangeNumberFromResult } from "./utils";

const expandingForce = createMove({
	id: 797,
	base: 80,
	type: "Psychic",
	category: "Special",
});

const expandingForceDefender = genTestMon({
	types: ["Normal"],
	baseStat: { hp: 100, specialDefense: 100 },
});

const expandingForceSingleTargetDamage = [
	46, 46, 48, 48, 48, 49, 49, 51, 51, 51, 52, 52, 52, 54, 54, 55,
];

const boostedExpandingForceSingleTargetDamage = [
	88, 90, 90, 91, 93, 94, 94, 96, 97, 97, 99, 100, 100, 102, 103, 105,
];

function getExpandingForceDamage({
	isDouble,
	terrain,
	attackerTypes = ["Psychic"],
}: {
	isDouble: boolean;
	terrain?: "Psychic";
	attackerTypes?: ["Psychic"] | ["Psychic", "Flying"];
}) {
	return new Battle({
		attacker: genTestMon({
			types: attackerTypes,
			baseStat: { specialAttack: 100 },
		}),
		defender: expandingForceDefender,
		move: expandingForce,
		field: { isDouble, terrain },
	}).getDamage();
}

test("Expanding Force becomes a spread move for a grounded attacker in Psychic Terrain doubles", () => {
	const singleDamage = getExpandingForceDamage({
		isDouble: false,
		terrain: "Psychic",
	});
	const doubleDamage = getExpandingForceDamage({
		isDouble: true,
		terrain: "Psychic",
	});

	expect(getDamangeNumberFromResult(singleDamage)).toEqual(
		boostedExpandingForceSingleTargetDamage,
	);
	expect(getDamangeNumberFromResult(doubleDamage)).toEqual([
		66, 66, 67, 67, 69, 69, 70, 70, 72, 72, 73, 73, 75, 75, 76, 78,
	]);
	expect(doubleDamage.factors.field.terrain).toBe(true);
	expect(doubleDamage.factors.field.isDouble).toBe(true);
	expect(getDamangeNumberFromResult(doubleDamage)).not.toEqual(
		getDamangeNumberFromResult(singleDamage),
	);
});

test("Expanding Force remains single-target without Psychic Terrain", () => {
	const singleDamage = getExpandingForceDamage({ isDouble: false });
	const doubleDamage = getExpandingForceDamage({ isDouble: true });

	expect(getDamangeNumberFromResult(singleDamage)).toEqual(
		expandingForceSingleTargetDamage,
	);
	expect(getDamangeNumberFromResult(doubleDamage)).toEqual(
		expandingForceSingleTargetDamage,
	);
	expect(doubleDamage.factors.field.isDouble).toBeUndefined();
});

test("Expanding Force remains single-target for an ungrounded attacker in Psychic Terrain", () => {
	const attackerTypes: ["Psychic", "Flying"] = ["Psychic", "Flying"];
	const singleDamage = getExpandingForceDamage({
		isDouble: false,
		terrain: "Psychic",
		attackerTypes,
	});
	const doubleDamage = getExpandingForceDamage({
		isDouble: true,
		terrain: "Psychic",
		attackerTypes,
	});

	expect(getDamangeNumberFromResult(singleDamage)).toEqual(
		expandingForceSingleTargetDamage,
	);
	expect(getDamangeNumberFromResult(doubleDamage)).toEqual(
		expandingForceSingleTargetDamage,
	);
	expect(doubleDamage.factors.field.terrain).toBeUndefined();
	expect(doubleDamage.factors.field.isDouble).toBeUndefined();
});

test("Electric Terrain damage boost changes when a Flying attacker is grounded by Iron Ball", () => {
	const defender = genTestMon({
		types: ["Water"],
		baseStat: {
			hp: 100,
			specialDefense: 100,
		},
	});
	const move = createMove({
		base: 90,
		type: "Electric",
		category: "Special",
	});
	const field = { terrain: "Electric" as const };
	const ungroundedBattle = new Battle({
		attacker: genTestMon({
			types: ["Electric", "Flying"],
			baseStat: { specialAttack: 100 },
		}),
		defender,
		move,
		field,
	});
	const groundedBattle = new Battle({
		attacker: genTestMon({
			types: ["Electric", "Flying"],
			baseStat: { specialAttack: 100 },
			item: "Iron Ball",
		}),
		defender,
		move,
		field,
	});

	const ungroundedDamage = getDamangeNumberFromResult(
		ungroundedBattle.getDamage(),
	);
	const groundedDamage = getDamangeNumberFromResult(groundedBattle.getDamage());

	expect(ungroundedDamage).toEqual([
		102, 104, 104, 108, 108, 108, 110, 110, 114, 114, 114, 116, 116, 120, 120,
		122,
	]);
	expect(groundedDamage).toEqual([
		134, 134, 138, 138, 140, 140, 144, 144, 146, 146, 150, 150, 152, 152, 156,
		158,
	]);
	expect(groundedDamage).not.toEqual(ungroundedDamage);
});

test("Rising Voltage damage changes when a Flying defender is grounded by Iron Ball", () => {
	const attacker = genTestMon({
		types: ["Electric"],
		baseStat: { specialAttack: 100 },
	});
	const move = createMove({
		id: 804,
		base: 70,
		type: "Electric",
		category: "Special",
	});
	const field = { terrain: "Electric" as const };
	const ungroundedBattle = new Battle({
		attacker,
		defender: genTestMon({
			types: ["Flying"],
			baseStat: { hp: 100, specialDefense: 100 },
		}),
		move,
		field,
	});
	const groundedBattle = new Battle({
		attacker,
		defender: genTestMon({
			types: ["Flying"],
			baseStat: { hp: 100, specialDefense: 100 },
			item: "Iron Ball",
		}),
		move,
		field,
	});

	const ungroundedDamage = getDamangeNumberFromResult(
		ungroundedBattle.getDamage(),
	);
	const groundedDamage = getDamangeNumberFromResult(groundedBattle.getDamage());

	expect(ungroundedDamage).toEqual([
		104, 108, 108, 108, 110, 110, 114, 114, 116, 116, 116, 120, 120, 122, 122,
		126,
	]);
	expect(groundedDamage).toEqual([
		206, 210, 212, 216, 216, 218, 222, 224, 228, 230, 230, 234, 236, 240, 242,
		246,
	]);
	expect(groundedDamage).not.toEqual(ungroundedDamage);
});

test("Grassy Terrain Earthquake damage reduction changes when a Levitate defender is grounded by Iron Ball", () => {
	const attacker = genTestMon({
		types: ["Ground"],
		baseStat: { attack: 100 },
	});
	const move = createMove({
		id: 89,
		base: 100,
		type: "Ground",
		category: "Physical",
	});
	const field = { terrain: "Grassy" as const };
	const ungroundedBattle = new Battle({
		attacker,
		defender: genTestMon({
			types: ["Normal"],
			ability: "Levitate",
			baseStat: { hp: 100, defense: 100 },
		}),
		move,
		field,
	});
	const groundedBattle = new Battle({
		attacker,
		defender: genTestMon({
			types: ["Normal"],
			ability: "Levitate",
			baseStat: { hp: 100, defense: 100 },
			item: "Iron Ball",
		}),
		move,
		field,
	});

	const ungroundedDamage = getDamangeNumberFromResult(
		ungroundedBattle.getDamage(),
	);
	const groundedDamage = getDamangeNumberFromResult(groundedBattle.getDamage());

	expect(ungroundedDamage).toEqual([
		58, 58, 60, 60, 60, 61, 61, 63, 63, 64, 64, 66, 66, 67, 67, 69,
	]);
	expect(groundedDamage).toEqual([
		30, 30, 30, 31, 31, 31, 31, 33, 33, 33, 33, 34, 34, 34, 34, 36,
	]);
	expect(groundedDamage).not.toEqual(ungroundedDamage);
});

test("Psyblade damage changes when a Flying attacker is grounded by Iron Ball", () => {
	const defender = genTestMon({
		types: ["Fighting"],
		baseStat: { hp: 100, defense: 100 },
	});
	const move = createMove({
		id: 876,
		base: 80,
		type: "Psychic",
		category: "Physical",
	});
	const field = { terrain: "Electric" as const };
	const ungroundedBattle = new Battle({
		attacker: genTestMon({
			types: ["Psychic", "Flying"],
			baseStat: { attack: 100 },
		}),
		defender,
		move,
		field,
	});
	const groundedBattle = new Battle({
		attacker: genTestMon({
			types: ["Psychic", "Flying"],
			baseStat: { attack: 100 },
			item: "Iron Ball",
		}),
		defender,
		move,
		field,
	});

	const ungroundedDamage = getDamangeNumberFromResult(
		ungroundedBattle.getDamage(),
	);
	const groundedDamage = getDamangeNumberFromResult(groundedBattle.getDamage());

	expect(ungroundedDamage).toEqual([
		92, 92, 96, 96, 96, 98, 98, 102, 102, 102, 104, 104, 104, 108, 108, 110,
	]);
	expect(groundedDamage).toEqual([
		134, 138, 138, 140, 144, 144, 146, 146, 150, 150, 152, 152, 156, 156, 158,
		162,
	]);
	expect(groundedDamage).not.toEqual(ungroundedDamage);
});

test("Dragonize Normal move is reduced by Misty Terrain against a grounded defender", () => {
	const attacker = genTestMon({
		types: ["Water"],
		ability: "Dragonize",
		baseStat: { specialAttack: 100 },
	});
	const defender = genTestMon({
		types: ["Normal"],
		baseStat: { hp: 100, specialDefense: 100 },
	});
	const move = createMove({
		base: 100,
		type: "Normal",
		category: "Special",
	});
	const noTerrainDamage = getDamangeNumberFromResult(
		new Battle({ attacker, defender, move }).getDamage(),
	);
	const mistyTerrainDamage = getDamangeNumberFromResult(
		new Battle({
			attacker,
			defender,
			move,
			field: { terrain: "Misty" },
		}).getDamage(),
	);

	expect(noTerrainDamage).toEqual([
		45, 46, 46, 47, 48, 48, 49, 49, 50, 50, 51, 51, 52, 52, 53, 54,
	]);
	expect(mistyTerrainDamage).toEqual([
		23, 24, 24, 24, 24, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 28,
	]);
});

test("Galvanize Normal move uses converted Electric type for STAB and terrain", () => {
	const attacker = genTestMon({
		types: ["Normal"],
		ability: "Galvanize",
		baseStat: { specialAttack: 100 },
	});
	const defender = genTestMon({
		types: ["Normal"],
		baseStat: { hp: 100, specialDefense: 100 },
	});
	const move = createMove({
		base: 100,
		type: "Normal",
		category: "Special",
	});
	const noTerrainDamage = getDamangeNumberFromResult(
		new Battle({ attacker, defender, move }).getDamage(),
	);
	const electricTerrainDamage = getDamangeNumberFromResult(
		new Battle({
			attacker,
			defender,
			move,
			field: { terrain: "Electric" },
		}).getDamage(),
	);

	expect(noTerrainDamage).toEqual([
		45, 46, 46, 47, 48, 48, 49, 49, 50, 50, 51, 51, 52, 52, 53, 54,
	]);
	expect(electricTerrainDamage).toEqual([
		59, 60, 60, 61, 62, 63, 63, 64, 65, 65, 66, 67, 67, 68, 69, 70,
	]);
});

test("Terrain Pulse damage uses terrain-converted types for grounded attackers", () => {
	const terrainPulse = createMove({
		id: 805,
		base: 50,
		type: "Normal",
		category: "Special",
	});
	const cases = [
		{
			terrain: "Electric" as const,
			attackerTypes: ["Electric"] as const,
			defenderTypes: ["Water"] as const,
			expected: [
				150, 150, 152, 152, 156, 158, 158, 162, 162, 164, 168, 168, 170, 170,
				174, 176,
			],
		},
		{
			terrain: "Grassy" as const,
			attackerTypes: ["Grass"] as const,
			defenderTypes: ["Water"] as const,
			expected: [
				150, 150, 152, 152, 156, 158, 158, 162, 162, 164, 168, 168, 170, 170,
				174, 176,
			],
		},
		{
			terrain: "Misty" as const,
			attackerTypes: ["Fairy"] as const,
			defenderTypes: ["Dragon"] as const,
			expected: [
				116, 116, 120, 120, 120, 122, 122, 126, 126, 128, 128, 132, 132, 134,
				134, 138,
			],
		},
		{
			terrain: "Psychic" as const,
			attackerTypes: ["Psychic"] as const,
			defenderTypes: ["Fighting"] as const,
			expected: [
				150, 150, 152, 152, 156, 158, 158, 162, 162, 164, 168, 168, 170, 170,
				174, 176,
			],
		},
	];

	for (const { terrain, attackerTypes, defenderTypes, expected } of cases) {
		const damage = getDamangeNumberFromResult(
			new Battle({
				attacker: genTestMon({
					types: [...attackerTypes],
					baseStat: { specialAttack: 100 },
				}),
				defender: genTestMon({
					types: [...defenderTypes],
					baseStat: { hp: 100, specialDefense: 100 },
				}),
				move: terrainPulse,
				field: { terrain },
			}).getDamage(),
		);

		expect(damage).toEqual(expected);
	}
});

test("Terrain Pulse damage stays Normal without terrain or when attacker is not grounded", () => {
	const terrainPulse = createMove({
		id: 805,
		base: 50,
		type: "Normal",
		category: "Special",
	});
	const defender = genTestMon({
		types: ["Rock"],
		baseStat: { hp: 100, specialDefense: 100 },
	});
	const noTerrainDamage = getDamangeNumberFromResult(
		new Battle({
			attacker: genTestMon({
				types: ["Normal"],
				baseStat: { specialAttack: 100 },
			}),
			defender,
			move: terrainPulse,
		}).getDamage(),
	);
	const ungroundedDamage = getDamangeNumberFromResult(
		new Battle({
			attacker: genTestMon({
				types: ["Normal", "Flying"],
				baseStat: { specialAttack: 100 },
			}),
			defender,
			move: terrainPulse,
			field: { terrain: "Electric" },
		}).getDamage(),
	);

	expect(noTerrainDamage).toEqual([
		15, 15, 15, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 18,
	]);
	expect(ungroundedDamage).toEqual([
		15, 15, 15, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 18,
	]);
});
