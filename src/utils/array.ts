export const windowed3 = <T>(arr: readonly T[]) =>
	arr.map((elt, i) => [arr[i - 1], elt, arr[i + 1]] as const);

export function mapReduce<T, TPrev, TNext extends TPrev>(
	array: readonly T[],
	reducer: (prev: TPrev, curr: T) => TNext,
	initial: TPrev,
) {
	const result: TNext[] = [];

	let prev = initial;
	for (const curr of array) {
		const next = reducer(prev, curr);
		result.push(next);
		prev = next;
	}

	return result;
}
