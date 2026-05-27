# vgc_data_wrapper

*Documents are still WIP. If faced any problem please leave an issue.* 

## Purpose
Damage calculator is not a new thing in VGC world, but AFAIK most of the implementations are tightly coupled with designated UI logic, which makes other developers hard to reuse the calculation part and difficult to refactor (which is exactly why I start this project). It's becomes a problem when we want to build a localize version (i.e. avoid English) or just want an independent calculator component in the application. 
During the process, it becomes clear that lots of resources in VGC are scatted everywhere. For example, meta data from Pokemon Showdown can be found at Smogon site while meta data from tournament comes from other source. Hence I aim to build this package as an all-in-1 tool kit, which is kinda too ambitious for now. 

## Installation

```
// npm
npm i vgc_data_wrapper
// yarn
yarn add vgc_data_wrapper
// pnpm
pnpm add vgc_data_wrapper
// bun
bun add vgc_data_wrapper
```

## How to use

### General Usage: Setup a battle and let pokemons fight.
```
import { Pokemon, Battle, createMove } from 'vgc_data_wrapper'

<!-- You can manually set essential infomation to start calculation. Unset properties will be set with default values.  -->
const flutterMane = new Pokemon({
    types: ["Fairy", "Ghost"],
    stats: {
        specialAttack: 155,
    },
})

<!-- Or you can create a new Pokemon instance without any input and then init with id, which will fetch related infomation from PokeAPI.  -->
const incineroar = new Pokemon()
await incineroar.initWithId(727)


<!-- Move doesn't have a class since its doesn't need own method. Even base power calculation is related with field status or pokemon. -->
const moonblast = createMove({
    type: "Fairy",
    base: 95,
    category: "Special",
})

const battle = new Battle({
    attacker: flutterMane,
    defender: incineroar,
    move: moonblast
})

const damageResult = battle.getDamage();
<!-- { rolls: Array<{ number: number, percentage: number}>, koChange: number } -->
```

### API explain 
#### Pokemon

|  Property | Type | Optional  | Default Value | Description |
|  ----  | ----  | ----  | ----  | ----  |
| id  | number | Y | - | Pokemon ID from national dex | 
| level  | number | N | 50 | Affect stat & damage calculation; |
| types  | [Type] / [Type, Type] | N | ["Normal"] |  Fire, Water, etc. |
| baseStat  | Stat | N | 100(for each key) | [Explain](https://www.vgcguide.com/base-stats) |
| statRuleset  | `champions` \| `mainSeries` | N | `champions` | Stat formula mode. Champions is the default. |
| effortValues  | Stat | N | 0(for each key) | Stat investment values. In `champions` mode this is treated as ability points (0-32 each, total <= 66). In `mainSeries` mode this uses normal EV semantics. |
| individualValues  | Stat | N | 31(for each key) | [Explain](https://www.vgcguide.com/base-stats) |
| stat  | Stat | Y | - | Derived from baseStat, IV, level, and effortValues with ruleset-specific formula. |
| statStage  | StatStages | N | 0(for each key)  | Pokemon can boost or drop stat and affect result of damage calc. The multiplier is based on the fraction 2/2 while each boost adds to the top & each drop adds to the bottom |
| nature  | Nature | Y | - | Boost 1 stat by 1.1 or lower 1 stat by 0.9 |
| weight  | number | N | 0 | Affect some damage calcs like Grass knot |
| ability  | Ability | Y | - | Ability list is stored at data/ability.json |
| item  | Item | Y | - | Item list is stored at data/item.json |
| teraType  | Type & `Stellar` | Y | - | null mean not in tera form. |
| gender  | `Male` & `Female` & `Unknown` | N | `Unknown` | Affect Rivalry calc |
| status  | Status | N | `Healthy` | Status condition, ex: Burned, Poisoned, etc. |
| flags  | PokemonFlags | Y | - | Certain conditions that affects calculation, ex. Helping Hand, Power Spot, Light Screen, etc. |

##### Methods
|  Name | Param | Return | Description |
|  ----  | ----  | ---- | ----  |
|  getStats | - | Stat | Get all stats for pokemon. If stats are not manually set initially, full stat will be derived from base stat, EV, IV and nature. |
|  getStat | key: keyof Stat | number | Get certain stat(hp, atk, etc.) from pokemon. If stat is not set, then stat will be calculated from BS, EV, IV and nature. |
|  setFlag | flags: Flag | - | Update flags for pokemon. Ex, light screen is set up |
|  toggleTera | (true, type) / (false) | -  | tera or cancel tera for this pokemon |
|  initWIthId | (id: number, options?: Options) | - | Using this method to init pokemon base stat, weight and other properties by fetching from PokeAPI. Advanced options can be passed in as second argument. |
|  setNature | nature: Nature | - | update nature |

* Other properties can be updated directly without using specific method for now. 

##### EV/Nature optimizer: `optimizeEVAndNature`

Use this helper when you want to keep a Pokémon's final stats exactly the same while reducing EV cost (and optionally changing nature).

```ts
import { Pokemon, optimizeEVAndNature } from "vgc_data_wrapper";

const pokemon = new Pokemon({
	statRuleset: "champions", // also supports "mainSeries"
	baseStat: {
		hp: 95,
		attack: 115,
		defense: 90,
		specialAttack: 80,
		specialDefense: 90,
		speed: 60,
	},
	effortValues: {
		defense: 11,
	},
});

const result = optimizeEVAndNature(pokemon, {
	statAcceptReduction: ["specialAttack"], // optional, non-HP only
});

if (result.foundImprovement) {
	console.log(result.savedEffortValues); // EVs saved
	console.log(result.optimized.effortValues);
	console.log(result.optimized.nature);
}
```

Notes:
- Preserves all six final stats exactly.
- If `statAcceptReduction` is provided, listed non-HP stats may be optimized to lower final values (`<=` original).
- Optimizes EV + nature only (IVs are not optimized).
- Respects the Pokémon's active `statRuleset` (`champions` or `mainSeries`).
- Returns deterministic output via fixed tie-break rules.
- Throws if manual `stats` are inconsistent with derived stats.
- Throws if `statAcceptReduction` includes `hp`.

##### Stat & StatStages
```
const statProps = [
	"hp",
	"attack",
	"defense",
	"specialAttack",
	"specialDefense",
	"speed",
] as const;

export type Stat = {
	[key in (typeof statProps)[number]]: number;
};

type StatStages = Omit<Stat, "hp">;
```

##### Nature
```
type Nature = {
	plus?: keyof StatStages;
	minus?: keyof StatStages;
};
```

#### Battle

|  Property | Type | Optional  | Default Value | Description |
|  ----  | ----  | ----  | ----  | ----  |
| attacker  | Pokemon | N | - | Pokemon attacking | 
| defender  | Pokemon | N | - | Pokemon defending | 
| move  | Move | N | - | Move used when calculate damage |
| field  | BattleFieldStatus | Y | {} | Flags related to whole field like weather, aura, etc. |

##### Methods
|  Name | Param | Return | Description |
|  ----  | ----  | ---- | ----  |
|  getDamage | - | DamageResult | Get damage results from given attacker, defender, move and field |
|  setField | field: Partial<Field> | void | update field, ex. change weather. |
|  setPokemon | (type: "attacker" \| "defender", pokemon: Pokemon ) | - | set attacker/defender |
|  swapPokemons | - | -  | swap attacker and defender |

##### Move
```

type MoveCategory = "Special" | "Physical";

type MoveTarget = "selectedTarget" | "allAdjacentFoes" | "allAdjacent";

export type Move = {
	id: number; // default 0
	base: number; // default 0
	type: Type;  // default Normal
	flags?: Flags<
		| "hasRecoil"
		| "hasSecondary"
		| "isContact"
		| "isPunch"
		| "isSound"
		| "isSlicing"
		| "isBite"
		| "isPulse"
		| "isMultihit"
		| "isPriority"
		| "isCriticalHit"
	>;
	target: MoveTarget; // default selectedTarget
	category: MoveCategory; // default Physical
	repeatTimes?: number;
};
```
##### BattleFieldStatus
```

type Weather = "Sun" | "Rain" | "Sand" | "Snow";

type Terrain = "Electric" | "Grassy" | "Misty" | "Psychic";

type Aura = "Fairy" | "Dark";

type Ruin = "Tablets" | "Sword" | "Vessel" | "Beads";

export type BattleFieldStatus = Partial<{
	weather: Weather;
	terrain: Terrain;
	aura: Array<Aura>;
	ruin: Array<Ruin>;
	isDouble: boolean;
}>;

```
##### DamageResult
```
export type DamageResult = {
	rolls: Array<{
		number: number;       // how much the move do to defender
		percentage: number;   // how much % the move do to defender
	}>;
	koChance: number;       // How likely the move will ko defender
};
```
#### createMove
|  Name | Param | Return | Description |
|  ----  | ----  | ---- | ----  |
|  createMove | move: Partial<Move> | Move | Helper function to generate move. Provides default values for base, target, type, category and id |
#### getEffectivenessOnPokemon
|  Name | Param | Return | Description |
|  ----  | ----  | ---- | ----  |
|  getEffectivenessOnPokemon | (moveType: Type, pokemonTypes: Array<Type>) | number | Calculate how certain move is effectivve on target pokemon. |


#### Reverse requirement APIs
The package also provides two helper APIs for reverse damage planning:

- `getMinDefRequirement`: find the minimum defensive investment needed to survive a target threshold.
- `getMinAtkRequirement`: find the minimum offensive investment needed to KO a target threshold.

Both APIs:
- reuse the same forward damage pipeline (`Battle#getDamage`) for validation,

Input shape note
- The requirement APIs take the same core battle inputs used by forward damage calculation (`attacker`, `defender`, `move`) plus optional `field` and a `target`.
- In other words, it is effectively a reverse-search wrapper around a subset of `Battle` inputs.

```ts
type RequirementInput = {
  attacker: Pokemon;
  defender: Pokemon;
  move: Move;
  field?: BattleFieldStatus; // optional, same semantics as Battle field
  target:
    | { type: "guaranteed" }
    | { type: "chance"; value: number }
    | { type: "guaranteed-2hit" };
};
```

- are synchronous,
- support both `mainSeries` and `champions` stat rulesets,
- support threshold targets:
  - `{ type: "guaranteed" }`
  - `{ type: "chance", value: number }`
  - `{ type: "guaranteed-2hit" }`
- Foul Play note:
  - defensive reverse requirements (`getMinDefRequirement`) are supported.
  - offensive reverse requirements (`getMinAtkRequirement`) are intentionally not recommended for Foul Play, because damage scales from the target's Attack stat rather than the user's offensive EV.
  - for offensive Foul Play planning against common sets, keep the target set fixed and use `Battle#getDamage` directly.

Example: defensive requirement (mainSeries)
```
import { Pokemon, createMove, getMinDefRequirement } from "vgc_data_wrapper";

const attacker = new Pokemon({
  statRuleset: "mainSeries",
  level: 50,
  types: ["Fire"],
  baseStat: {
    hp: 90,
    attack: 120,
    defense: 90,
    specialAttack: 90,
    specialDefense: 90,
    speed: 90,
  },
  effortValues: { hp: 0, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
  nature: { plus: "attack", minus: "specialAttack" },
});

const defender = new Pokemon({
  statRuleset: "mainSeries",
  level: 50,
  types: ["Grass"],
  baseStat: {
    hp: 95,
    attack: 80,
    defense: 95,
    specialAttack: 80,
    specialDefense: 95,
    speed: 60,
  },
});

const move = createMove({ type: "Fire", base: 100, category: "Physical" });

const result = getMinDefRequirement({
  attacker,
  defender,
  move,
  field: { weather: "Sun" },
  target: { type: "chance", value: 75 },
});

// result.satisfied === true/false
// if true, result.investment includes minimum hp/defense values
```

Example: offensive requirement (champions)
```
import { Pokemon, createMove, getMinAtkRequirement } from "vgc_data_wrapper";

const attacker = new Pokemon({
  statRuleset: "champions",
  level: 50,
  types: ["Electric"],
  baseStat: {
    hp: 80,
    attack: 70,
    defense: 70,
    specialAttack: 125,
    specialDefense: 80,
    speed: 110,
  },
  nature: { plus: "specialAttack", minus: "attack" },
});

const defender = new Pokemon({
  statRuleset: "champions",
  level: 50,
  types: ["Water"],
  baseStat: {
    hp: 100,
    attack: 70,
    defense: 90,
    specialAttack: 70,
    specialDefense: 95,
    speed: 60,
  },
  nature: { plus: "specialDefense", minus: "attack" },
});

const move = createMove({ type: "Electric", base: 90, category: "Special" });

const result = getMinAtkRequirement({
  attacker,
  defender,
  move,
  target: { type: "guaranteed-2hit" },
});

// result.satisfied === true/false
// if true, result.investment includes minimum specialAttack value
```


## Roadmap
- usage data
  - [Smogon](https://www.smogon.com/stats/) has lots of usage information from Pokemon Showdown ready to be utilized but in txt or chaos json form.
  - Plan to add some wrapper functions to simplify the process and help developers emphasize on analyzing the data.
- tournament data
  - Plenty of online tours are hosted on Limitless, which has a public API to fetch results and teams.
  - Ideally I want to add results from official tournaments but I don't have easy way to grab results automatically for now. 
