import { offset } from "@/utils/time";
import { getRanking as getRankingEndpoint } from "./endpoints";

export type RankingParams = {
	since?: string;
	until?: string;
	from?: number;
	to?: number;
};

async function getFn(params: RankingParams) {
	const { until, since, from, to } = params;
	const exclusiveUntil = until ? offset(until, { months: 1 }) : undefined;

	return getRankingEndpoint(
		from,
		to,
		since ? new Date(since) : undefined,
		exclusiveUntil ? new Date(exclusiveUntil) : undefined,
	);
}

export const VALID_RANKS = Array.from({ length: 50 }, (_, i) => i + 1);

export type RankingData = Record<string, { rank: number; count: number }>;

export async function getRanking(params: RankingParams): Promise<RankingData> {
	const ranking = await getFn(params);
	return Object.fromEntries(
		ranking.map(({ userId, count, rank }) => [userId, { count, rank }]),
	);
}
