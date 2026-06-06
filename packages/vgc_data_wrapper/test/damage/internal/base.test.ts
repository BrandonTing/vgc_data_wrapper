import { expect, test } from "bun:test";
import { createMove } from "../../../src";
import { getBasePower } from "../../../src/damage/basePower";
import type { Move } from "../../../src/damage/config";
import { genTestMon } from "../utils";

test("correctly calculate base power", () => {
	const testPokemon = genTestMon();
	const testMove: Move = createMove({
		base: 100,
	});
	const basePower = getBasePower(testPokemon, testPokemon, testMove);
	expect(basePower).toEqual({
		operator: 100,
	});
});

test("correctly calculate base power for terrain related moves", () => {
	const testPokemon = genTestMon();

	const testPsyblade = createMove({
		id: 876,
		base: 80,
	});
	const basePowerPsyblade = getBasePower(
		testPokemon,
		testPokemon,
		testPsyblade,
		{
			terrain: "Electric",
		},
	);
	expect(basePowerPsyblade).toEqual({
		operator: 120,
		factors: {
			field: {
				terrain: true,
			},
		},
	});

	const testMistyExplosion = createMove({
		id: 802,
		base: 100,
	});
	const basePowerMistyExplosion = getBasePower(
		testPokemon,
		testPokemon,
		testMistyExplosion,
		{
			terrain: "Misty",
		},
	);
	expect(basePowerMistyExplosion).toEqual({
		operator: 150,
		factors: {
			field: {
				terrain: true,
			},
		},
	});
	const testEarthQuake = createMove({
		id: 89,
		base: 100,
	});
	const baseEarthQuake = getBasePower(
		testPokemon,
		testPokemon,
		testEarthQuake,
		{
			terrain: "Grassy",
		},
	);
	expect(baseEarthQuake).toEqual({
		operator: 50,
		factors: {
			field: {
				terrain: true,
			},
		},
	});
	const testBulldoze = createMove({
		id: 523,
		base: 60,
	});
	const baseBulldoze = getBasePower(testPokemon, testPokemon, testBulldoze, {
		terrain: "Grassy",
	});
	expect(baseBulldoze).toEqual({
		operator: 30,
		factors: {
			field: {
				terrain: true,
			},
		},
	});

	const testTerrainPulse = createMove({
		id: 805,
		base: 50,
	});
	const baseTerrainPulse = getBasePower(
		testPokemon,
		testPokemon,
		testTerrainPulse,
		{
			terrain: "Grassy",
		},
	);
	expect(baseTerrainPulse).toEqual({
		operator: 100,
		factors: {
			field: {
				terrain: true,
			},
		},
	});
});

test("correctly calculate base power for speed related moves", () => {
	const testFastPokemon = genTestMon({
		stats: {
			speed: 300,
		},
	});
	const testSlowPokemon = genTestMon({
		stats: {
			speed: 50,
		},
	});
	const testElectricBall = createMove({
		id: 486,
	});
	let basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall.operator).toBe(150);

	if (testFastPokemon.stats) testFastPokemon.stats.speed = 175;
	basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall.operator).toBe(120);

	if (testFastPokemon.stats) testFastPokemon.stats.speed = 125;
	basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall.operator).toBe(80);

	if (testFastPokemon.stats) testFastPokemon.stats.speed = 75;
	basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall.operator).toBe(60);

	if (testFastPokemon.stats) testFastPokemon.stats.speed = 25;
	basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall.operator).toBe(40);

	if (testFastPokemon.stats) testFastPokemon.stats.speed = 300;
	const testGyroBall = createMove({
		id: 360,
	});
	let basePowerGyroBall = getBasePower(
		testSlowPokemon,
		testFastPokemon,
		testGyroBall,
	);
	expect(basePowerGyroBall.operator).toBe(150);

	if (testFastPokemon.stats) testFastPokemon.stats.speed = 200;
	basePowerGyroBall = getBasePower(
		testSlowPokemon,
		testFastPokemon,
		testGyroBall,
	);
	expect(basePowerGyroBall.operator).toBe(100);
});

test("electro ball: Choice Scarf and +1 speed stage match at the 1.5x threshold", () => {
	const defender = genTestMon({
		stats: {
			speed: 100,
		},
	});
	const electroBall = createMove({
		id: 486,
	});

	const scarfAttacker = genTestMon({
		stats: {
			speed: 100,
		},
		item: "Choice Scarf",
	});
	const plusOneAttacker = genTestMon({
		stats: {
			speed: 100,
		},
		statStage: {
			speed: 1,
		},
	});

	const scarfPower = getBasePower(scarfAttacker, defender, electroBall);
	const plusOnePower = getBasePower(plusOneAttacker, defender, electroBall);

	expect(scarfPower.operator).toBe(60);
	expect(plusOnePower.operator).toBe(60);
	expect(scarfPower.operator).toBe(plusOnePower.operator);
});

test("correctly calculate base power for Grass knot and Low kick", () => {
	const testPokemon = genTestMon();
	const lowKick = createMove({
		id: 67,
	});
	const grassKnot = createMove({
		id: 447,
	});
	const testHaavyPokemon = genTestMon({
		weight: 999,
	});
	let basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	let basePowerGrassknot = getBasePower(
		testPokemon,
		testHaavyPokemon,
		grassKnot,
	);
	expect(basePowerLowKick.operator).toBe(120);
	expect(basePowerGrassknot.operator).toBe(120);

	testHaavyPokemon.weight = 199;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick.operator).toBe(100);
	expect(basePowerGrassknot.operator).toBe(100);

	testHaavyPokemon.weight = 99;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick.operator).toBe(80);
	expect(basePowerGrassknot.operator).toBe(80);

	testHaavyPokemon.weight = 49;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick.operator).toBe(60);
	expect(basePowerGrassknot.operator).toBe(60);

	testHaavyPokemon.weight = 24;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick.operator).toBe(40);
	expect(basePowerGrassknot.operator).toBe(40);

	testHaavyPokemon.weight = 9;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick.operator).toBe(20);
	expect(basePowerGrassknot.operator).toBe(20);
});

test("correctly calculate base power for heavy slam & heat crash", () => {
	const testDefender = genTestMon({
		weight: 10,
	});
	const testAttacker = genTestMon({
		weight: 15,
	});
	const heavySlam = createMove({
		id: 484,
	});
	const heatcrash = createMove({
		id: 535,
	});
	let basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	let basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam.operator).toBe(40);
	expect(basePowerHeatCrash.operator).toBe(40);

	testAttacker.weight = 25;
	basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam.operator).toBe(60);
	expect(basePowerHeatCrash.operator).toBe(60);

	testAttacker.weight = 35;
	basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam.operator).toBe(80);
	expect(basePowerHeatCrash.operator).toBe(80);

	testAttacker.weight = 45;
	basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam.operator).toBe(100);
	expect(basePowerHeatCrash.operator).toBe(100);

	testAttacker.weight = 50;
	basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam.operator).toBe(120);
	expect(basePowerHeatCrash.operator).toBe(120);
});

test("base power of weather ball", () => {
	const testMon = genTestMon();
	const weatherBall = createMove({ id: 311, base: 50 });
	let basePower = getBasePower(testMon, testMon, weatherBall);
	expect(basePower).toEqual({
		operator: 50,
	});
	// sun
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Sun" });
	expect(basePower).toEqual({
		operator: 100,
		factors: {
			attacker: {
				weather: true,
			},
		},
	});
	// rain
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Rain" });
	expect(basePower).toEqual({
		operator: 100,
		factors: {
			attacker: {
				weather: true,
			},
		},
	});
	// sand
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Sand" });
	expect(basePower).toEqual({
		operator: 100,
		factors: {
			attacker: {
				weather: true,
			},
		},
	});
	// snow
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Snow" });
	expect(basePower).toEqual({
		operator: 100,
		factors: {
			attacker: {
				weather: true,
			},
		},
	});
});

test("base power of tera blast", () => {
	const testMon = genTestMon();
	const teraBlast = createMove({ id: 851, base: 80 });
	let basePower = getBasePower(testMon, testMon, teraBlast);
	expect(basePower.operator).toBe(80);
	const testTeraStellarMon = genTestMon();
	testTeraStellarMon.toggleTera({ isTera: true, type: "Stellar" });
	basePower = getBasePower(testTeraStellarMon, testMon, teraBlast);
	expect(basePower).toEqual({
		operator: 100,
		factors: {
			attacker: {
				isTera: true,
			},
		},
	});
});

test("base power of Power Trip & Stored Power", () => {
	const testMon = genTestMon({
		statStage: {
			attack: 6,
			defense: 5,
			specialAttack: 4,
			specialDefense: -3,
			speed: -2,
		},
	});
	const powerTrip = createMove({ id: 500 });
	const storedPower = createMove({ id: 681 });
	const basePowerPowerTrip = getBasePower(testMon, testMon, powerTrip);
	const basePowerStoredPower = getBasePower(testMon, testMon, storedPower);
	const expected = 20 + (6 + 5 + 4) * 20;
	expect(basePowerPowerTrip.operator).toBe(expected);
	expect(basePowerStoredPower.operator).toBe(expected);
});

test("terrain base power changes require the relevant Pokemon to be grounded", () => {
	const groundedAttacker = genTestMon();
	const flyingAttacker = genTestMon({ types: ["Flying"] });
	const levitateAttacker = genTestMon({ ability: "Levitate" });
	const ironBallFlyingAttacker = genTestMon({
		types: ["Flying"],
		item: "Iron Ball",
	});
	const teraFlyingAttacker = genTestMon({
		types: ["Normal"],
		specialForm: "Tera",
		teraType: "Flying",
	});
	const flyingTeraNormalAttacker = genTestMon({
		types: ["Flying"],
		specialForm: "Tera",
		teraType: "Normal",
	});
	const defender = genTestMon();
	const psyblade = createMove({ id: 876, base: 80 });
	const terrainPulse = createMove({ id: 805, base: 50 });
	const mistyExplosion = createMove({ id: 802, base: 100 });

	expect(
		getBasePower(groundedAttacker, defender, psyblade, {
			terrain: "Electric",
		}).operator,
	).toBe(120);
	expect(
		getBasePower(flyingAttacker, defender, psyblade, { terrain: "Electric" })
			.operator,
	).toBe(80);
	expect(
		getBasePower(levitateAttacker, defender, psyblade, { terrain: "Electric" })
			.operator,
	).toBe(80);
	expect(
		getBasePower(ironBallFlyingAttacker, defender, psyblade, {
			terrain: "Electric",
		}).operator,
	).toBe(120);
	expect(
		getBasePower(teraFlyingAttacker, defender, terrainPulse, {
			terrain: "Grassy",
		}).operator,
	).toBe(50);
	expect(
		getBasePower(flyingTeraNormalAttacker, defender, terrainPulse, {
			terrain: "Grassy",
		}).operator,
	).toBe(100);
	expect(
		getBasePower(groundedAttacker, defender, mistyExplosion, {
			terrain: "Misty",
		}).operator,
	).toBe(150);
});

test("Grassy Terrain Earthquake and Bulldoze reductions require grounded targets", () => {
	const attacker = genTestMon();
	const groundedDefender = genTestMon();
	const flyingDefender = genTestMon({ types: ["Flying"] });
	const levitateDefender = genTestMon({ ability: "Levitate" });
	const ironBallFlyingDefender = genTestMon({
		types: ["Flying"],
		item: "Iron Ball",
	});
	const teraFlyingDefender = genTestMon({
		types: ["Normal"],
		specialForm: "Tera",
		teraType: "Flying",
	});
	const flyingTeraNormalDefender = genTestMon({
		types: ["Flying"],
		specialForm: "Tera",
		teraType: "Normal",
	});
	const earthquake = createMove({ id: 89, base: 100 });
	const bulldoze = createMove({ id: 523, base: 60 });
	const field = { terrain: "Grassy" as const };

	expect(
		getBasePower(attacker, groundedDefender, earthquake, field).operator,
	).toBe(50);
	expect(
		getBasePower(attacker, flyingDefender, earthquake, field).operator,
	).toBe(100);
	expect(
		getBasePower(attacker, levitateDefender, earthquake, field).operator,
	).toBe(100);
	expect(
		getBasePower(attacker, ironBallFlyingDefender, earthquake, field).operator,
	).toBe(50);
	expect(
		getBasePower(attacker, teraFlyingDefender, earthquake, field).operator,
	).toBe(100);
	expect(
		getBasePower(attacker, flyingTeraNormalDefender, earthquake, field)
			.operator,
	).toBe(50);
	expect(
		getBasePower(attacker, groundedDefender, bulldoze, field).operator,
	).toBe(30);
	expect(getBasePower(attacker, flyingDefender, bulldoze, field).operator).toBe(
		60,
	);
});
