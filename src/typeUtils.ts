export type Flags<T extends string> = {
	[P in T]?: boolean;
};

export type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};
