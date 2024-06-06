export type Flags<T extends string> = {
	[P in T]?: boolean;
};


export type TypedExtract<T, U extends T> = Extract<T, U>