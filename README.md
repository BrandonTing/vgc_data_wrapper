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
| effortValues  | Stat | N | 0(for each key) | [Explain](https://www.vgcguide.com/base-stats) |
| individualValues  | Stat | N | 31(for each key) | [Explain](https://www.vgcguide.com/base-stats) |
| stat  | Stat | Y | - | Derived from baseStat, EV, IV and level. The real stat in game. |
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

export type BattleFieldStatus = {
	weather?: Weather;
	terrain?: Terrain;
	downCounts?: number; // used to calculate damage boost for Supreme Overlord
	aura?: Aura;
	ruin?: Ruin;
	isDouble?: boolean; 
};

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


## Roadmap
- usage data
  - [Smogon](https://www.smogon.com/stats/) has lots of usage information from Pokemon Showdown ready to be utilized but in txt or chaos json form.
  - Plan to add some wrapper functions to simplify the process and help developers emphasize on analyzing the data.
- tournament data
  - Plenty of online tours are hosted on Limitless, which has a public API to fetch results and teams.
  - Ideally I want to add results from official tournaments but I don't have easy way to grab results automatically for now. 