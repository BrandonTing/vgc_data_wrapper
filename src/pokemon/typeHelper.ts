import abilities from "../../assets/ability.json";
import items from "../../assets/item.json";
export type Ability = keyof typeof abilities;
export type Item = keyof typeof items;
