import abilities from "../../data/ability.json";
import items from "../../data/item.json";
export type Ability = keyof typeof abilities;
export type Item = keyof typeof items;
