import { expect, test } from "bun:test";
import { getBasePower } from "../../src/damage/basePower";
import { type Move } from "../../src/damage/config";
import { genTestMon, genTestMove } from "./utils";

test("correctly calculate base power", () => {
	const testPokemon = genTestMon();
	const testMove: Move = genTestMove();
	const basePower = getBasePower(testPokemon, testPokemon, testMove);
	expect(basePower).toBe(100);
});

test("correctly calculate base power for terrain related moves", () => {
	const testPokemon = genTestMon();
	const testHydroSteam = genTestMove({
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
	expect(basePowerHydroSteam).toBe(120);

	const testPsyblade = genTestMove({
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
	expect(basePowerPsyblade).toBe(120);

	const testMistyExplosion = genTestMove({
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
	expect(basePowerMistyExplosion).toBe(150);

	const testEarthQuake = genTestMove({
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
	expect(baseEarthQuake).toBe(50);
	const testBulldoze = genTestMove({
		id: 523,
		base: 60,
	});
	const baseBulldoze = getBasePower(testPokemon, testPokemon, testBulldoze, {
		terrain: "Grassy",
	});
	expect(baseBulldoze).toBe(30);

	const testTerrainPulse = genTestMove({
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
	expect(baseTerrainPulse).toBe(100);
});

test("correctly calculate base power for speed related moves", () => {
	const testFastPokemon = genTestMon({
		stat: {
			speed: 300,
		},
	});
	const testSlowPokemon = genTestMon({
		stat: {
			speed: 50,
		},
	});
	const testElectricBall = genTestMove({
		id: 486,
	});
	let basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall).toBe(150);

	testFastPokemon.stat.speed = 175;
	basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall).toBe(120);

	testFastPokemon.stat.speed = 125;
	basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall).toBe(80);

	testFastPokemon.stat.speed = 75;
	basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall).toBe(60);

	testFastPokemon.stat.speed = 25;
	basePowerElectricBall = getBasePower(
		testFastPokemon,
		testSlowPokemon,
		testElectricBall,
	);
	expect(basePowerElectricBall).toBe(40);

	testFastPokemon.stat.speed = 300;
	const testGyroBall = genTestMove({
		id: 360,
	});
	let basePowerGyroBall = getBasePower(
		testSlowPokemon,
		testFastPokemon,
		testGyroBall,
	);
	expect(basePowerGyroBall).toBe(150);

	testFastPokemon.stat.speed = 200;
	basePowerGyroBall = getBasePower(
		testSlowPokemon,
		testFastPokemon,
		testGyroBall,
	);
	expect(basePowerGyroBall).toBe(100);
});

test("correctly calculate base power for Grass knot and Low kick", () => {
	const testPokemon = genTestMon();
	const lowKick = genTestMove({
		id: 67,
	});
	const grassKnot = genTestMove({
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
	expect(basePowerLowKick).toBe(120);
	expect(basePowerGrassknot).toBe(120);

	testHaavyPokemon.weight = 199;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick).toBe(100);
	expect(basePowerGrassknot).toBe(100);

	testHaavyPokemon.weight = 99;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick).toBe(80);
	expect(basePowerGrassknot).toBe(80);

	testHaavyPokemon.weight = 49;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick).toBe(60);
	expect(basePowerGrassknot).toBe(60);

	testHaavyPokemon.weight = 24;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick).toBe(40);
	expect(basePowerGrassknot).toBe(40);

	testHaavyPokemon.weight = 9;
	basePowerLowKick = getBasePower(testPokemon, testHaavyPokemon, lowKick);
	basePowerGrassknot = getBasePower(testPokemon, testHaavyPokemon, grassKnot);
	expect(basePowerLowKick).toBe(20);
	expect(basePowerGrassknot).toBe(20);
});

test("correctly calculate base power for heavy slam & heat crash", () => {
	const testDefender = genTestMon({
		weight: 10,
	});
	const testAttacker = genTestMon({
		weight: 15,
	});
	const heavySlam = genTestMove({
		id: 484,
	});
	const heatcrash = genTestMove({
		id: 535,
	});
	let basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	let basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam).toBe(40);
	expect(basePowerHeatCrash).toBe(40);

	testAttacker.weight = 25;
	basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam).toBe(60);
	expect(basePowerHeatCrash).toBe(60);

	testAttacker.weight = 35;
	basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam).toBe(80);
	expect(basePowerHeatCrash).toBe(80);

	testAttacker.weight = 45;
	basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam).toBe(100);
	expect(basePowerHeatCrash).toBe(100);

	testAttacker.weight = 50;
	basePowerHeavySlam = getBasePower(testAttacker, testDefender, heavySlam);
	basePowerHeatCrash = getBasePower(testAttacker, testDefender, heatcrash);
	expect(basePowerHeavySlam).toBe(120);
	expect(basePowerHeatCrash).toBe(120);
});

test("base power of weather ball", () => {
	const testMon = genTestMon();
	const weatherBall = genTestMove({ id: 311, base: 50 });
	let basePower = getBasePower(testMon, testMon, weatherBall);
	expect(basePower).toBe(50);
	// sun
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Sun" });
	expect(basePower).toBe(100);
	// rain
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Rain" });
	expect(basePower).toBe(100);
	// sand
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Sand" });
	expect(basePower).toBe(100);
	// snow
	basePower = getBasePower(testMon, testMon, weatherBall, { weather: "Snow" });
	expect(basePower).toBe(100);
});

test("base power of tera blast", () => {
	const testMon = genTestMon();
	const teraBlast = genTestMove({ id: 851, base: 80 });
	let basePower = getBasePower(testMon, testMon, teraBlast);
	expect(basePower).toBe(80);
	const testTeraStellarMon = genTestMon({ teraType: "Stellar" });
	basePower = getBasePower(testTeraStellarMon, testMon, teraBlast);
	expect(basePower).toBe(100);
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
	const powerTrip = genTestMove({ id: 500 });
	const storedPower = genTestMove({ id: 681 });
	const basePowerPowerTrip = getBasePower(testMon, testMon, powerTrip);
	const basePowerStoredPower = getBasePower(testMon, testMon, storedPower);
	const expected = 20 + (6 + 5 + 4) * 20;
	expect(basePowerPowerTrip).toBe(expected);
	expect(basePowerStoredPower).toBe(expected);
});
