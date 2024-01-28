export type Flags<T extends string> = {
	[P in T]?: boolean;
};
