import { Moves } from "./data";


export function convertMoves() {
    const converted = Object.entries(Moves).reduce(
        (pre, [key, val]) => {
            pre[key] = {
                type: val.type,
                basePower: val.basePower,
                category: val.category,
                name: val.name,
                id: val.num
            };
            return pre;
        },
        {},
    );
    Bun.write(
        "./data/sd/moves.json",
        JSON.stringify(converted, null, 2),
    );
}