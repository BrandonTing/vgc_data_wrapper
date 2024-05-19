import { Items } from "./data";


export function convertItems() {
    const converted = Object.entries(Items).reduce(
        (pre, [key, val]) => {
            pre[key] = {
                name: val.name,
                id: val.num
            };
            return pre;
        },
        {},
    );
    Bun.write(
        "./data/sd/items.json",
        JSON.stringify(converted, null, 2),
    );
}