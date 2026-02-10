type ArrayOf<
	Length extends number,
	Value,
	acc extends Value[] = [],
> = acc["length"] extends Length
	? acc
	: ArrayOf<Length, Value, [Value, ...acc]>;

type WithBoundary<Arr extends unknown[]> = Arr extends [
	infer First,
	...infer Rest,
	infer Last,
]
	? [First | undefined, ...Rest, Last | undefined]
	: Arr;

export function* slidingWindow<
	Value,
	Size extends number,
	Boundary extends boolean = false,
	__core extends unknown[] = ArrayOf<Size, Value>,
	__eachitem = Boundary extends true ? WithBoundary<__core> : __core,
>(
	arr: Value[],
	size: Size,
	includeBoundaries: Boundary = false as Boundary,
): Generator<__eachitem> {
	if (size <= 0) {
		return;
	}
	if (includeBoundaries) {
		arr = [undefined, ...arr, undefined] as any;
	}
	for (let start = 0; start + size <= arr.length; start += 1) {
		yield arr.slice(start, start + size) as any;
	}
}
