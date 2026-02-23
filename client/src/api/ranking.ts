import type {
	RankingParams,
	RankingData as ServerRankingData,
} from "@server/api";
import { offset } from "@/utils/time";
import { createUrlParams } from "@/utils/url";
import { withCache } from "./cache";

function getFn(params: RankingParams): Promise<ServerRankingData> {
	const { until, ...otherParams } = params;
	const exclusiveUntil = until ? offset(until, { months: 1 }) : undefined;
	const urlParams = createUrlParams({ ...otherParams, until: exclusiveUntil });
	const url = `/api/ranking${urlParams}`;
	return fetch(url).then((res) => res.json());
}

export const VALID_RANKS = Array.from({ length: 100 }, (_, i) => i + 1);

const fetchWithCache = withCache({
	getFn,
	paramsChunkBy: ["from", "to"],
	returnChunkBy: "rank",
	domain: VALID_RANKS,
	chunkSize: 50,
});

export type RankingData = Record<string, { rank: number; count: number }>;

export async function getRanking(params: RankingParams): Promise<RankingData> {
	const ranking = await fetchWithCache(params);
	return Object.fromEntries(
		ranking.map(({ userId, count, rank }) => [userId, { count, rank }]),
	);
}
