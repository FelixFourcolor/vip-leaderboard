import { omit } from "es-toolkit";

export function withCache<
	Params extends Record<string, any>,
	const ParamsChunkBy extends keyof Params,
	const ReturnChunkBy extends keyof Result,
	Result extends { [K in ReturnChunkBy]: Params[ParamsChunkBy] },
>({
	getFn,
	paramsChunkBy: [paramsFromKey, paramsToKey],
	returnChunkBy,
	domain: valueByIndex,
	chunkSize,
}: {
	getFn: (params: Params) => Promise<Result[]>;
	paramsChunkBy: readonly [from: ParamsChunkBy, to: ParamsChunkBy];
	returnChunkBy: ReturnChunkBy;
	domain: Array<Params[ParamsChunkBy]>;
	chunkSize: number;
}): (params: Params) => Promise<Result[]> {
	const cache = new Map<string, Result[]>();
	const pendingResults = new Map<string, Promise<Result[]>>();

	const indexByValue: Record<
		Params[ParamsChunkBy] | Result[ReturnChunkBy],
		number
	> = Object.fromEntries(valueByIndex.map((value, index) => [value, index]));

	function chunkBounds(chunk: number): {
		[paramsFromKey]: Params[ParamsChunkBy];
		[paramsToKey]: Params[ParamsChunkBy];
	} {
		const fromIndex = chunk * chunkSize;
		const toIndex = Math.min(fromIndex + chunkSize, valueByIndex.length);

		return {
			[paramsFromKey]: valueByIndex[fromIndex]!,
			[paramsToKey]: valueByIndex[toIndex - 1]!,
		};
	}

	function neededChunks(params: Pick<Params, ParamsChunkBy>): number[] {
		const fromIndex = indexByValue[params[paramsFromKey]]!;
		const toIndex = indexByValue[params[paramsToKey]]!;

		const start = Math.floor(fromIndex / chunkSize);
		const end = Math.floor(toIndex / chunkSize);

		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	}

	async function loadChunk(
		params: Omit<Params, ParamsChunkBy>,
		chunk: number,
	): Promise<Result[]> {
		const key = JSON.stringify({ ...params, chunk });
		const cached = cache.get(key);
		if (cached) {
			return cached;
		}

		const pending = pendingResults.get(key);
		if (pending) {
			return pending;
		}

		const promise = getFn({ ...params, ...chunkBounds(chunk) } as any);
		pendingResults.set(key, promise);
		promise
			.then((res) => {
				cache.set(key, res);
				return res;
			})
			.finally(() => pendingResults.delete(key));
		return promise;
	}

	return async (params) => {
		const chunks = await Promise.all(
			neededChunks(params).map((chunk) =>
				loadChunk(omit(params, [paramsFromKey, paramsToKey]), chunk),
			),
		);

		const paramFromIndex = indexByValue[params[paramsFromKey]];
		const paramToIndex = indexByValue[params[paramsToKey]];

		return chunks.flat().filter(({ [returnChunkBy]: returnValue }) => {
			const returnIndex = indexByValue[returnValue];
			return paramFromIndex <= returnIndex && returnIndex <= paramToIndex;
		});
	};
}
