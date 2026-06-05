import type { Maybe } from "./types";

export function windowed<T>(
	arr: readonly T[],
	size: 3,
): Array<[Maybe<T>, T, Maybe<T>]>;

export function windowed<T>(arr: readonly T[], size: 2): Array<[Maybe<T>, T]>;

export function windowed<T>(arr: readonly T[], size: 2 | 3) {
	return size === 2
		? arr.map((elt, i) => [arr[i - 1], elt])
		: arr.map((elt, i) => [arr[i - 1], elt, arr[i + 1]]);
}
