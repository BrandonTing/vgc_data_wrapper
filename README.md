# vgc_data_wrapper

```
import {Pokemon, Battle} from 'vgc_data_wrapper'

const flutterMane = new Pokemon({
    id: 987,
    types: ["Fairy", "Ghost"],
    stats: {
        specialAttack: 155,
    },
})
const incineroar = new Pokemon({
    id: 727,
    types: ["Dark", "Fire"],
    stats: {
        hp: 170,
        specialDefense: 110,
    },
})
const moonblast = {
    type: "Fairy",
    base: 95,
    category: "Special",
}

const battle = new Battle({
    attacker: flutterMane,
    defender: incineroar,
    move: moonblast
})

const damageResult = battle.getDamage();
// { rolls: Array<{ number: number, percentage: number}>, koChange: number }
{
  rolls: [
    {
      number: 76,
      percentage: 44.7,
    }, {
      number: 76,
      percentage: 44.7,
    }, {
      number: 78,
      percentage: 45.9,
    }, {
      number: 78,
      percentage: 45.9,
    }, {
      number: 79,
      percentage: 46.5,
    }, {
      number: 81,
      percentage: 47.6,
    }, {
      number: 81,
      percentage: 47.6,
    }, {
      number: 82,
      percentage: 48.2,
    }, {
      number: 82,
      percentage: 48.2,
    }, {
      number: 84,
      percentage: 49.4,
    }, {
      number: 85,
      percentage: 50,
    }, {
      number: 85,
      percentage: 50,
    }, {
      number: 87,
      percentage: 51.2,
    }, {
      number: 87,
      percentage: 51.2,
    }, {
      number: 88,
      percentage: 51.8,
    }, {
      number: 90,
      percentage: 52.9,
    }
  ],
  koChance: 0,
}

```