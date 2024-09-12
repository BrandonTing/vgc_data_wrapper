import { Abilities } from "./data";

export function convertAbilities() {
	const converted = Object.entries(Abilities).reduce((pre, [key, val]) => {
		pre[key] = {
			name: val.name,
			id: val.num,
		};
		return pre;
	}, {});
	Bun.write("./data/sd/abilities.json", JSON.stringify(converted, null, 2));
}
