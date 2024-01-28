import abilities from "./ability.json";
import items from "./item.json";
export type Ability = keyof typeof abilities;
export type Item = keyof typeof items;
