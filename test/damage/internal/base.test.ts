import { expect, test } from "bun:test";
import { createMove } from "../../../src";
import { getBasePower } from "../../../src/damage/basePower";
import { type Move } from "../../../src/damage/config";
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
	const testHydroSteam = createMove({
		id: 875,
		base: 80,
	});
	const basePowerHydroSteam = getBasePower(
		testPokemon,
		testPokemon,
		testHydroSteam,
		{
			weather: "Sun",
		},
	);
	expect(basePowerHydroSteam).toEqual({
		operator: 120,
		factors: {
			field: {
				weather: true
			}
		}
	});

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
				terrain: true
			}
		}
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
				terrain: true
			}
		}
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
				terrain: true
			}
		}
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
				terrain: true
			}
		}
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
				terrain: true
			}
		}
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
			field: {
				weather: true
			}
		}
	});
	// rain
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Rain" });
	expect(basePower).toEqual({
		operator: 100,
		factors: {
			field: {
				weather: true
			}
		}
	});
	// sand
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Sand" });
	expect(basePower).toEqual({
		operator: 100,
		factors: {
			field: {
				weather: true
			}
		}
	});
	// snow
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Snow" });
	expect(basePower).toEqual({
		operator: 100,
		factors: {
			field: {
				weather: true
			}
		}
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
		operator: 100, factors: {
			attacker: {
				isTera: true
			}
		}
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
