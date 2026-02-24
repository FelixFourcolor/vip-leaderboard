export function windows3<T>(
	arr: T[],
): Array<[T | undefined, T, T | undefined]> {
	return arr.map((item, idx) => [arr[idx - 1], item, arr[idx + 1]]);
}
