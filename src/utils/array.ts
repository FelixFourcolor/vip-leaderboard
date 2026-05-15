import type { Maybe } from "./types";

export const windowed = <T, S extends 2 | 3>(
	arr: readonly T[],
	size: S,
): S extends 2
	? ReturnType<typeof windowed2<T>>
	: ReturnType<typeof windowed3<T>> =>
	(size === 2 ? windowed2 : windowed3)(arr) as any;

const windowed3 = <T>(arr: readonly T[]): Array<[Maybe<T>, T, Maybe<T>]> =>
	arr.map((elt, i) => [arr[i - 1], elt, arr[i + 1]]);

const windowed2 = <T>(arr: readonly T[]): Array<[Maybe<T>, T]> =>
	arr.map((elt, i) => [arr[i - 1], elt]);
