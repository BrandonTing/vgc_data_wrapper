export type Flags<T extends string> = {
	[P in T]?: boolean;
};

export type TypedExtract<T, U extends T> = Extract<T, U>

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};
