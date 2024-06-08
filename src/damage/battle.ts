import type { Pokemon } from "../pokemon";
import type { RecursivePartial } from "../typeUtils";
import { getAttack } from "./attack";
import type {
	BattleFieldStatus,
	BattleStatus,
	DamageResult,
	Move,
} from "./config";
import { getDefense } from "./defense";
import { getPower } from "./power";
import { getEffectivenessOnPokemon } from "./type";
import {
	checkTeraWIthTypeMatch,
	getPokemonCurrentType,
	mergeFactorList,
	pipeModifierHelper,
} from "./utils";

interface IBattle extends Partial<BattleStatus> {
	getDamage: () => DamageResult;
	setField: (field: Partial<BattleFieldStatus>) => void;
	setPokemon: (type: "attacker" | "defender", pokemon: Pokemon) => void;
	swapPokemons: () => void;
}

export class Battle implements IBattle {
	field: BattleFieldStatus = {};
	attacker?: Pokemon;
	defender?: Pokemon;
	move?: Move;
	constructor(option: Partial<BattleStatus>) {
		if (option.attacker) {
			this.attacker = option.attacker;
		}
		if (option.defender) {
			this.defender = option.defender;
		}
		if (option.move) {
			this.move = option.move;
		}
		if (option.field) {
			this.field = option.field;
		}
	}
	getDamage(): DamageResult {
		if (!this.attacker || !this.defender) {
			throw new Error("Attacker or Defender is not set");
		}
		if (!this.move) {
			throw new Error("Move is not set");
		}
		return getDamage({
			attacker: this.attacker,
			defender: this.defender,
			move: this.move,
			field: this.field,
		});
	}
	setField(field: Partial<BattleFieldStatus>) {
		this.field = this.field ? Object.assign(this.field, field) : field;
	}
	setPokemon(type: "attacker" | "defender", pokemon: Pokemon) {
		this[type] = pokemon;
	}
	swapPokemons() {
		const curAttacker = this.attacker;
		this.attacker = this.defender;
		this.defender = curAttacker;
	}
}

const dmgRollCounts = 16;

export type TemporalFactor = {
	operator: number,
	factors?: RecursivePartial<DamageResult["factors"]>
}

function getDamage(option: BattleStatus): DamageResult {
	function pipeOperator(
		pre: TemporalFactor,
		cur: (temporalResult: TemporalFactor, option: BattleStatus) => TemporalFactor,
	) {
		return cur(pre, option);
	}
	const preRandomResult = pipeModifierHelper(
		getBasicDamage(option),
		[modifyBySpreadDamage, modifyByWeather, modifyByCriticalHit],
		pipeOperator,
	);
	const possibleDamages = modifyByRandomNum(preRandomResult.operator);
	let finalFactors = preRandomResult.factors
	const results: DamageResult["rolls"] = possibleDamages.map((damage, index) => {
		const damageNum = pipeModifierHelper(
			{ operator: damage, factors: preRandomResult.factors },
			[
				modifyBySameType,
				modifyByType,
				modifyByBurn,
				modifyByOtherDamangeModifiers,
			],
			pipeOperator,
		);
		if (index === 0) {
			finalFactors = mergeFactorList(finalFactors, damageNum.factors)
		}
		const damagePercentage =
			Math.round((damageNum / option.defender.getStat("hp")) * 1000) / 10;

		return {
			number: damageNum,
			percentage: damagePercentage,
		};
	});
	const minKoIndex = results.findIndex((dm) => dm.percentage >= 100);

	const koChance =
		minKoIndex === 0
			? 100
			: minKoIndex === -1
				? 0
				: ((dmgRollCounts - minKoIndex) / 16) * 100;

	return {
		rolls: results,
		koChance,
		factors: {
			attacker: {
				atk: option.move.category === "Special" ? "specialAttack" : "attack",
				statFrom: "Attacker",
				...finalFactors?.attacker
			},
			defender: {
				def: option.move.category === "Special" ? "specialDefense" : "defense",
				...finalFactors?.defender
			},
			move: finalFactors?.move ?? {},
			field: finalFactors?.field ?? {}
		}
	};
}

function getBasicDamage(option: BattleStatus): TemporalFactor {
	const power = getPower(option);
	const attack = getAttack(option);
	const defense = getDefense(option);
	const factors = mergeFactorList(power.factors, attack.factors, defense.factors)
	const operator = Math.trunc(
		Math.trunc(
			(Math.trunc((option.attacker.level * 2) / 5 + 2) * power.operator * attack.operator) /
			defense.operator,
		) /
		50 +
		2,
	);
	return {
		operator,
		factors
	}
}

function modifyBySpreadDamage(
	value: TemporalFactor,
	{ move, attacker, field }: Pick<BattleStatus, "move" | "field" | "attacker">,
): TemporalFactor {
	let modifier = 1;
	let factors: TemporalFactor['factors'] = undefined
	if (
		(
			move.target === "allAdjacent" ||
			move.target === "allAdjacentFoes" ||
			(attacker.id === 1024 &&
				checkTeraWIthTypeMatch(attacker, "Stellar") &&
				move.id === 906)) &&
		field?.isDouble
	) {
		modifier = 0.75;
		factors = {
			field: {
				isDouble: true
			}
		}
	}
	const operator = Math.round(value.operator * modifier - 0.001)
	return {
		operator,
		factors: mergeFactorList(value.factors, factors)
	};
}

function modifyByWeather(
	value: TemporalFactor,
	{ field, move }: Pick<BattleStatus, "field" | "move">,
): TemporalFactor {
	let modifier = 1;
	let factors: TemporalFactor['factors'] = undefined
	const weatherFactor: TemporalFactor['factors'] = {
		field: {
			weather: true
		}
	}
	if (field?.weather === "Rain") {
		if (move.type === "Fire") {
			modifier = 0.5;
			factors = weatherFactor
		}
		if (move.type === "Water") {
			modifier = 1.5;
			factors = weatherFactor
		}
	}
	if (field?.weather === "Sun") {
		if (move.type === "Fire") {
			modifier = 1.5;
			factors = weatherFactor
		}
		if (move.type === "Water") {
			modifier = 0.5;
			factors = weatherFactor
		}
	}
	const operator = Math.round(value.operator * modifier - 0.001)
	return {
		operator,
		factors: mergeFactorList(value.factors, factors)
	};
}

function modifyByCriticalHit(
	value: TemporalFactor,
	{ move }: Pick<BattleStatus, "move">,
): TemporalFactor {
	const modifier = move.flags?.isCriticalHit ? 1.5 : 1;
	const operator = Math.round(value.operator * modifier - 0.001);

	return {
		operator,
		factors: mergeFactorList(value.factors,
			move.flags?.isCriticalHit ? {
				move: {
					isCriticalHit: true
				}
			} : undefined
		)
	}
}

function modifyByRandomNum(value: number): Array<number> {
	return Array.from({ length: dmgRollCounts }, (v, i) => (85 + i) / 100).map(
		(roll) => Math.trunc(roll * value),
	);
}

function modifyBySameType(
	value: TemporalFactor,
	{ move, attacker }: Pick<BattleStatus, "move" | "attacker">,
): TemporalFactor {
	let modifier = 1;
	let factors: TemporalFactor["factors"] = {}
	// Protean
	if (attacker.ability === "Protean") {
		factors = mergeFactorList(factors, {
			attacker: {
				ability: true
			}
		})
		if (
			attacker.teraType &&
			attacker.teraType !== "Stellar" &&
			attacker.types.includes(attacker.teraType)
		) {
			modifier = 2;
			factors = mergeFactorList(factors, {
				attacker: {
					isTera: true,
				}
			})
		} else {
			modifier = 1.5;
		}
	}
	// Pixilate
	if (attacker.ability === "Pixilate") {
		factors = mergeFactorList(factors, {
			attacker: {
				ability: true
			}
		})

		if (checkTeraWIthTypeMatch(attacker, "Stellar")) {
			factors = mergeFactorList(factors, {
				attacker: {
					isTera: true
				}
			})

			if (attacker.types.includes("Fairy") && move.type === "Normal") {
				modifier = 2;
			} else {
				modifier = 1.2;
			}
		}
		if (checkTeraWIthTypeMatch(attacker, "Fairy") && move.type === "Normal") {
			factors = mergeFactorList(factors, {
				attacker: {
					isTera: true
				}
			})
			modifier = attacker.types.includes("Fairy") ? 2 : 1.5;
		}
		if (attacker.types.includes("Fairy") && move.type === "Normal") {
			modifier = 1.5;
		}
	}
	// Galvanize
	if (attacker.ability === "Galvanize") {
		factors = mergeFactorList(factors, {
			attacker: {
				ability: true
			}
		})
		if (checkTeraWIthTypeMatch(attacker, "Stellar")) {
			factors = mergeFactorList(factors, {
				attacker: {
					isTera: true
				}
			})

			if (attacker.types.includes("Electric") && move.type === "Normal") {
				modifier = 2;
			} else {
				modifier = 1.2;
			}
		}
		if (
			checkTeraWIthTypeMatch(attacker, "Electric") &&
			move.type === "Normal"
		) {
			factors = mergeFactorList(factors, {
				attacker: {
					isTera: true
				}
			})

			modifier = attacker.types.includes("Electric") ? 2 : 1.5;
		}
		if (attacker.types.includes("Electric") && move.type === "Normal") {
			modifier = 1.5;
		}
	}
	// Stellar tera
	if (checkTeraWIthTypeMatch(attacker, "Stellar")) {
		factors = mergeFactorList(factors, {
			attacker: {
				isTera: true
			}
		})

		if (attacker.types.includes(move.type)) {
			modifier = 2;
		} else {
			modifier = 1.2;
		}
	}
	// Adaptability
	if (attacker.ability === "Adaptability") {
		factors = mergeFactorList(factors, {
			attacker: {
				ability: true
			}
		})

		if (attacker.types.includes(move.type)) {
			if (checkTeraWIthTypeMatch(attacker, move.type)) {
				factors = mergeFactorList(factors, {
					attacker: {
						isTera: true
					}
				})

				modifier = 2.25;
			} else {
				modifier = 2;
			}
		}
	}
	// Normal stab
	if (attacker.types.includes(move.type)) {
		if (checkTeraWIthTypeMatch(attacker, move.type)) {
			factors = mergeFactorList(factors, {
				attacker: {
					isTera: true
				}
			})

			modifier = 2;
		} else {
			modifier = 1.5;
		}
	} else if (checkTeraWIthTypeMatch(attacker, move.type)) {
		factors = mergeFactorList(factors, {
			attacker: {
				isTera: true
			}
		})

		modifier = 1.5;
	}
	return { operator: Math.round(value.operator * modifier - 0.001), factors: mergeFactorList(value.factors, factors) };
}

function getTypeModifier({
	move,
	attacker,
	defender,
}: Pick<BattleStatus, "move" | "attacker" | "defender">): TemporalFactor {
	// tera blast from Stellar tera mon on tera mon is 2x
	if (
		checkTeraWIthTypeMatch(attacker, "Stellar") &&
		defender.teraType &&
		move.id === 851
	) {
		return {
			operator: 2,
			factors: {
				attacker: {
					isTera: true
				},
				defender: {
					isTera: true
				}
			}
		};
	}
	if (
		move.type === "Ground" &&
		defender.item === "Iron Ball" &&
		(checkTeraWIthTypeMatch(defender, "Flying") ||
			((!defender.isTera || defender.teraType === "Stellar") &&
				defender.types.includes("Flying")))
	) {
		return {
			operator: 1,
			factors: {
				defender: checkTeraWIthTypeMatch(defender, "Flying") ? {
					item: true,
					isTera: true
				} : undefined
			}
		};
	}
	// skins
	if (attacker.ability === "Pixilate") {
		if (!defender.isTera || defender.teraType === "Stellar") {
			// use original type
			return {
				operator: getEffectivenessOnPokemon("Fairy", defender.types),
				factors: {
					attacker: {
						ability: true
					}
				}
			};
		}
		return {
			operator: getEffectivenessOnPokemon("Fairy", [defender.teraType]),
			factors: {
				attacker: {
					ability: true,
				},
				defender: {
					isTera: true
				}
			}
		};
	}
	if (attacker.ability === "Galvanize") {
		if (!defender.isTera || defender.teraType === "Stellar") {
			// use original type
			return {
				operator: getEffectivenessOnPokemon("Electric", defender.types),
				factors: {
					attacker: {
						ability: true
					}
				}
			};

		}
		return {
			operator: getEffectivenessOnPokemon("Electric", [defender.teraType]),
			factors: {
				attacker: {
					ability: true,
				},
				defender: {
					isTera: true
				}
			}
		};
	}
	// Flying Press
	if (move.id === 560) {
		if (checkTeraWIthTypeMatch(defender, "Stellar")) {
			return {
				operator: getEffectivenessOnPokemon("Flying", defender.types) *
					getEffectivenessOnPokemon("Fighting", defender.types),
			};
		}
		const curDefenderType = getPokemonCurrentType(defender);
		return {
			operator: (
				getEffectivenessOnPokemon("Flying", curDefenderType) *
				getEffectivenessOnPokemon("Fighting", curDefenderType)
			),
			factors: {
				defender: defender.isTera ? {
					isTera: true
				} : undefined
			}
		};
	}
	// Freeze Dry
	if (move.id === 573) {
		if (checkTeraWIthTypeMatch(defender, "Stellar") || !defender.isTera) {
			if (defender.types.includes("Water")) {
				return {
					operator: (
						2 *
						getEffectivenessOnPokemon(
							move.type,
							defender.types.filter((type) => type !== "Water"),
						)
					)
				};
			}
		}
		if (checkTeraWIthTypeMatch(defender, "Water")) {
			return {
				operator: 2, factors: {
					defender: {
						isTera: true
					}
				}
			};
		}
	}
	// use original type when tera stellar
	if (checkTeraWIthTypeMatch(defender, "Stellar")) {
		return { operator: getEffectivenessOnPokemon(move.type, defender.types) };
	}
	return { operator: getEffectivenessOnPokemon(move.type, getPokemonCurrentType(defender)) };
}

function modifyByType(
	value: TemporalFactor,
	option: Pick<BattleStatus, "move" | "attacker" | "defender">,
): TemporalFactor {
	const { operator, factors } = getTypeModifier(option);
	return { operator: Math.trunc(value.operator * operator), factors: mergeFactorList(value.factors, factors) };
}

function modifyByBurn(
	value: TemporalFactor,
	{ move, attacker }: Pick<BattleStatus, "move" | "attacker">,
): TemporalFactor {
	let modifier = 1;
	let factors: TemporalFactor["factors"] = {}
	if (
		attacker.status === "Burned" &&
		move.category === "Physical" &&
		// Facade
		move.id !== 263 &&
		attacker.ability !== "Guts"
	) {
		modifier = 0.5;
		factors = mergeFactorList(factors, {
			attacker: {
				status: true,
				ability: true
			}
		})
	}
	return { operator: Math.round(value.operator * modifier - 0.001), factors: mergeFactorList(value.factors, factors) };
}

// FIXME
function modifyByOtherDamangeModifiers(
	value: TemporalFactor,
	option: BattleStatus,
): TemporalFactor {
	const modifier =
		pipeModifierHelper(
			{ operator: 4096, factors: value.factors } as TemporalFactor,
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
				const { operator, factors } = cur(option)
				return { operator: Math.round(pre.operator * operator), factors: mergeFactorList(pre.factors, factors) };
			},
		);

	return { operator: Math.round(value.operator * modifier.operator / 4096 - 0.001), factors: modifier.factors };
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
	if (attacker.ability === "Sniper" && move.flags?.isCriticalHit) {
		return 1.5;
	}

	// Tinted Lens
	const effectiveness = getEffectivenessOnPokemon(
		move.type,
		getPokemonCurrentType(defender),
	);
	if (attacker.ability === "Tinted Lens" && effectiveness < 1) {
		return 2;
	}
	return 1;
}

function modifyByDefenderAbility({
	defender,
	move,
}: Pick<BattleStatus, "defender" | "move">): number {
	// Fluffy
	if (defender.ability === "Fluffy") {
		if (move.type === "Fire") {
			return 2;
		}
		if (move.flags?.isContact) {
			return 0.5;
		}
	}
	// Multiscale
	if (defender.ability === "Multiscale") {
		return 0.5;
	}
	// Punk Rock
	if (defender.ability === "Punk Rock" && move.flags?.isSound) {
		return 0.5;
	}
	// Ice Scales
	if (defender.ability === "Ice Scales" && move.category === "Special") {
		return 0.5;
	}

	// Solid Rock && Filter
	const effectiveness = getEffectivenessOnPokemon(
		move.type,
		defender.teraType ? [defender.teraType] : defender.types,
	);
	if (
		(defender.ability === "Solid Rock" || defender.ability === "Filter") &&
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
	if (attacker.item?.includes("Metronome-")) {
		const times = Number(attacker.item.split("Metronome-")[1] ?? "1")
		return Math.min(1 + 0.2 * (times - 1), 2);
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


export function createFactorHelper(commonFactor: TemporalFactor["factors"]) {
	return function getFactor(operator: number, additionalFactor?: TemporalFactor["factors"]): TemporalFactor {
		return {
			operator,
			factors: mergeFactorList(commonFactor, additionalFactor)
		}
	}
}