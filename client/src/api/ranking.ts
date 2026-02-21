import type {
	RankingParams,
	RankingData as ServerRankingData,
} from "@server/api";
import { createUrlParams } from "@/utils/url";
import { withCache } from "./cache";

function getFn(params: RankingParams): Promise<ServerRankingData> {
	const url = `/api/ranking${createUrlParams(params)}`;
	return fetch(url).then((res) => res.json());
}

export const VALID_RANKS = Array.from({ length: 50 }, (_, i) => i + 1);

const fetchWithCache = withCache({
	getFn: getFn,
	paramsChunkBy: ["from", "to"],
	returnChunkBy: "rank",
	domain: VALID_RANKS,
	chunkSize: 10,
});

export type RankingData = Record<string, { rank: number; count: number }>;

export async function getRanking(params: RankingParams): Promise<RankingData> {
	const ranking = await fetchWithCache(params);
	return Object.fromEntries(
		ranking.map(({ userId, count, rank }) => [userId, { count, rank }]),
	);
}
