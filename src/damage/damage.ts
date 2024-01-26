import { getAttack } from "./attack";
import type { BattleStatus, DamageResult } from "./config";
import { getDefense } from "./defense";
import { getPower } from "./power";
import { getEffectivenessOnPokemon } from "./type";
import { getPokemonCurrentType, pipeModifierHelper } from "./utils";
const dmgRollCounts = 16;

export function getDamage(option: BattleStatus): DamageResult {
	function pipeOperator(
		pre: number,
		cur: (value: number, option: BattleStatus) => number,
	) {
		return cur(pre, option);
	}
	const preRandomResult = pipeModifierHelper(
		getBasicDamage(option),
		[modifyBySpreadDamage, modifyByWeather, modifyByCriticalHit],
		pipeOperator,
	);
	const possibleDamages = modifyByRandomNum(preRandomResult);
	const results: DamageResult["rolls"] = possibleDamages.map((damage) => {
		const damageNum = pipeModifierHelper(
			damage,
			[
				modifyBySameType,
				modifyByType,
				modifyByBurn,
				modifyByOtherDamangeModifiers,
			],
			pipeOperator,
		);
		const damagePercentage =
			Math.round((damageNum / option.defender.getStat("hp")) * 1000) / 10;
		return {
			number: damageNum,
			percentage: damagePercentage,
		};
	});
	const minKoIndex = results.findIndex((dm) => dm.percentage >= 1);

	const koChance =
		minKoIndex === 0
			? 100
			: minKoIndex === -1
			  ? 0
			  : ((dmgRollCounts - minKoIndex) / 16) * 100;

	return {
		rolls: results,
		koChance,
	};
}

function getBasicDamage(option: BattleStatus): number {
	const power = getPower(option);
	const attack = getAttack(option);
	const defense = getDefense(option);
	return Math.trunc(
		Math.trunc(
			(Math.trunc((option.attacker.level * 2) / 5 + 2) * power * attack) /
				defense,
		) /
			50 +
			2,
	);
}

function modifyBySpreadDamage(
	value: number,
	{ move, attacker, field }: Pick<BattleStatus, "move" | "field" | "attacker">,
): number {
	let modifier = 1;
	if (
		(move.target !== "selectedTarget" ||
			(attacker.id === 1024 &&
				attacker.teraType === "Stellar" &&
				move.id === 906)) &&
		field?.isDouble
	) {
		modifier = 0.75;
	}
	return Math.round(value * modifier - 0.001);
}

function modifyByWeather(
	value: number,
	{ field, move }: Pick<BattleStatus, "field" | "move">,
): number {
	let modifier = 1;
	if (field?.weather === "Rain") {
		if (move.type === "Fire") {
			modifier = 0.5;
		}
		if (move.type === "Water") {
			modifier = 1.5;
		}
	}
	if (field?.weather === "Sun") {
		if (move.type === "Fire") {
			modifier = 1.5;
		}
		if (move.type === "Water") {
			modifier = 0.5;
		}
	}
	return Math.round(value * modifier - 0.001);
}

function modifyByCriticalHit(
	value: number,
	{ move }: Pick<BattleStatus, "move">,
): number {
	const modifier = move.flags?.isCriticalHit ? 1.5 : 1;
	return Math.round(value * modifier - 0.001);
}

function modifyByRandomNum(value: number): Array<number> {
	return Array.from({ length: dmgRollCounts }, (v, i) => (85 + i) / 100).map(
		(roll) => Math.trunc(roll * value),
	);
}

function modifyBySameType(
	value: number,
	{ move, attacker }: Pick<BattleStatus, "move" | "attacker">,
): number {
	let modifier = 1;
	// Protean
	if (attacker.abilityId === 168) {
		if (
			attacker.teraType &&
			attacker.teraType !== "Stellar" &&
			attacker.types.includes(attacker.teraType)
		) {
			modifier = 2;
		} else {
			modifier = 1.5;
		}
	}
	// Pixilate
	if (attacker.abilityId === 182) {
		if (attacker.teraType === "Stellar") {
			if (attacker.types.includes("Fairy") && move.type === "Normal") {
				modifier = 2;
			} else {
				modifier = 1.2;
			}
		}
		if (attacker.teraType === "Fairy" && move.type === "Normal") {
			modifier = attacker.types.includes("Fairy") ? 2 : 1.5;
		}
		if (attacker.types.includes("Fairy") && move.type === "Normal") {
			modifier = 1.5;
		}
	}
	// Galvanize
	if (attacker.abilityId === 206) {
		if (attacker.teraType === "Stellar") {
			if (attacker.types.includes("Electric") && move.type === "Normal") {
				modifier = 2;
			} else {
				modifier = 1.2;
			}
		}
		if (attacker.teraType === "Electric" && move.type === "Normal") {
			modifier = attacker.types.includes("Electric") ? 2 : 1.5;
		}
		if (attacker.types.includes("Electric") && move.type === "Normal") {
			modifier = 1.5;
		}
	}
	// Stellar tera
	if (attacker.teraType === "Stellar") {
		if (attacker.types.includes(move.type)) {
			modifier = 2;
		} else {
			modifier = 1.2;
		}
	}
	// Adaptability
	if (attacker.abilityId === 91) {
		if (attacker.types.includes(move.type)) {
			if (attacker.teraType === move.type) {
				modifier = 2.25;
			} else {
				modifier = 2;
			}
		}
	}
	// Normal stab
	if (attacker.types.includes(move.type)) {
		if (attacker.teraType === move.type) {
			modifier = 2;
		} else {
			modifier = 1.5;
		}
	} else if (attacker.teraType === move.type) {
		modifier = 1.5;
	}
	return Math.round(value * modifier - 0.001);
}

function getTypeModifier({
	move,
	attacker,
	defender,
}: Pick<BattleStatus, "move" | "attacker" | "defender">): number {
	// tera blast from Stellar tera mon on tera mon is 2x
	if (attacker.teraType === "Stellar" && defender.teraType && move.id === 851) {
		return 2;
	}
	if (
		move.type === "Ground" &&
		attacker.item === "Iron Ball" &&
		(defender.teraType === "Flying" ||
			((!defender.teraType || defender.teraType === "Stellar") &&
				defender.types.includes("Flying")))
	) {
		return 1;
	}
	// skins
	if (attacker.abilityId === 182) {
		if (!defender.teraType || defender.teraType === "Stellar") {
			// use original type
			return getEffectivenessOnPokemon("Fairy", defender.types);
		}
		return getEffectivenessOnPokemon("Fairy", [defender.teraType]);
	}
	if (attacker.abilityId === 206) {
		if (!defender.teraType || defender.teraType === "Stellar") {
			// use original type
			return getEffectivenessOnPokemon("Electric", defender.types);
		}
		return getEffectivenessOnPokemon("Electric", [defender.teraType]);
	}
	// Flying Press
	if (move.id === 560) {
		if (defender.teraType === "Stellar") {
			return (
				getEffectivenessOnPokemon("Flying", defender.types) *
				getEffectivenessOnPokemon("Fighting", defender.types)
			);
		}
		const curDefenderType = getPokemonCurrentType(defender);
		return (
			getEffectivenessOnPokemon("Flying", curDefenderType) *
			getEffectivenessOnPokemon("Fighting", curDefenderType)
		);
	}
	// Freeze Dry
	if (move.id === 573) {
		if (defender.teraType === "Stellar") {
			if (defender.types.includes("Water")) {
				return (
					2 *
					getEffectivenessOnPokemon(
						move.type,
						defender.types.filter((type) => type === "Water"),
					)
				);
			}
		}
		if (defender.teraType === "Water") {
			return 2;
		}
	}
	// use original type when tera stellar
	if (defender.teraType === "Stellar") {
		return getEffectivenessOnPokemon(move.type, defender.types);
	}
	return getEffectivenessOnPokemon(move.type, getPokemonCurrentType(defender));
}

function modifyByType(
	value: number,
	option: Pick<BattleStatus, "move" | "attacker" | "defender">,
): number {
	const modifier = getTypeModifier(option);
	return Math.trunc(value * modifier);
}

function modifyByBurn(
	value: number,
	{ move, attacker }: Pick<BattleStatus, "move" | "attacker">,
): number {
	let modifier = 1;
	if (
		attacker.status === "Burned" &&
		move.category === "Physical" &&
		// Facade
		move.id !== 263 &&
		attacker.abilityId !== 62
	) {
		modifier = 0.5;
	}
	return Math.round(value * modifier - 0.001);
}

function modifyByOtherDamangeModifiers(
	value: number,
	option: BattleStatus,
): number {
	const modifier =
		pipeModifierHelper(
			4096 as number,
			[
				modifyByWall,
				modifyByMove,
				modifyByAttackerAbility,
				modifyByDefenderAbility,
				modifyByFriendGuard,
				modifyByAttackerItem,
				modifyByDefenderItem,
			],
			(pre, cur) => {
				return Math.round(pre * cur(option));
			},
		) / 4096;
	return Math.round(value * modifier - 0.001);
}

function modifyByWall({
	move,
	defender,
	field,
}: Pick<BattleStatus, "move" | "defender" | "field">): number {
	if (move.flags?.isCriticalHit) {
		return 1;
	}
	if (move.category === "Physical" && defender.flags?.reflect) {
		return field?.isDouble ? 0.667 : 0.5;
	}
	if (move.category === "Special" && defender.flags?.lightScreen) {
		return field?.isDouble ? 0.667 : 0.5;
	}
	return 1;
}

function modifyByMove({
	defender,
	move,
}: Pick<BattleStatus, "defender" | "move">): number {
	const effectiveness = getEffectivenessOnPokemon(
		move.type,
		getPokemonCurrentType(defender),
	);
	if (
		// 	Collision Course & Electro Drift
		(move.id === 878 || move.id === 879) &&
		effectiveness > 1
	) {
		return 1.333;
	}
	return 1;
}

function modifyByAttackerAbility({
	attacker,
	defender,
	move,
}: Pick<BattleStatus, "attacker" | "defender" | "move">): number {
	// Sniper
	if (attacker.abilityId === 97 && move.flags?.isCriticalHit) {
		return 1.5;
	}
	// Tinted Lens

	const effectiveness = getEffectivenessOnPokemon(
		move.type,
		getPokemonCurrentType(defender),
	);

	if (attacker.abilityId === 110 && effectiveness < 1) {
		return 2;
	}
	return 1;
}

function modifyByDefenderAbility({
	defender,
	move,
}: Pick<BattleStatus, "defender" | "move">): number {
	// Fluffy
	if (defender.abilityId === 218) {
		if (move.type === "Fire") {
			return 2;
		}
		if (move.flags?.isContact) {
			return 0.5;
		}
	}
	// Multiscale
	if (defender.abilityId === 136) {
		return 0.5;
	}
	// Punk Rock
	if (defender.abilityId === 244 && move.flags?.isSound) {
		return 0.5;
	}
	// Ice Scales
	if (defender.abilityId === 246 && move.category === "Special") {
		return 0.5;
	}

	// Solid Rock && Filter
	const effectiveness = getEffectivenessOnPokemon(
		move.type,
		defender.teraType ? [defender.teraType] : defender.types,
	);

	if (
		(defender.abilityId === 116 || defender.abilityId === 111) &&
		effectiveness > 1
	) {
		return 0.75;
	}
	return 1;
}

function modifyByFriendGuard({
	defender: { flags },
}: Pick<BattleStatus, "defender">): number {
	return flags?.hasFriendGuard ? 0.75 : 1;
}

function modifyByAttackerItem({
	attacker,
	defender,
	move,
}: Pick<BattleStatus, "attacker" | "defender" | "move">): number {
	if (
		attacker.item === "Expert Belt" &&
		getEffectivenessOnPokemon(move.type, getPokemonCurrentType(defender)) > 1
	) {
		return 1.2;
	}
	if (attacker.item === "Life Orb") {
		return 1.3;
	}
	if (attacker.item === "Metronome") {
		return Math.max(1 + 0.2 * (move.repeatTimes ?? 1 - 1), 2);
	}
	return 1;
}
function modifyByDefenderItem({
	defender,
	move,
}: Pick<BattleStatus, "defender" | "move">): number {
	if (
		defender.item === "Type Berry" &&
		getEffectivenessOnPokemon(move.type, getPokemonCurrentType(defender)) > 1
	) {
		return 0.5;
	}
	return 1;
}
