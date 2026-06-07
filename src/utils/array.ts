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

export function mapReduce<T, TPrev, TNext extends TPrev>(
	array: readonly T[],
	reducer: (prev: TPrev, curr: T) => TNext,
	initial: TPrev,
): TNext[] {
	const result: TNext[] = [];

	let prev = initial;
	for (const curr of array) {
		const next = reducer(prev, curr);
		result.push(next);
		prev = next;
	}

	return result;
}
