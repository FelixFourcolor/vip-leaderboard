import type { RankingParams, UserData } from "@server/api";
import {
	getMonthlyCount,
	type MonthlyCount,
	type MonthlyCountParams,
} from "./monthlyCount";
import { getRanking, type RankingData } from "./ranking";
import { getUser } from "./user";

export type MonthlyRankingParams = Required<
	RankingParams & Omit<MonthlyCountParams, "userId">
>;
export type MonthlyRanking = RankingData &
	Record<string, UserData & { monthlyCount: MonthlyCount }>;

export async function getMonthlyRanking({
	cumulative,
	...params
}: MonthlyRankingParams): Promise<MonthlyRanking> {
	const ranking = await getRanking(params);
	const userIds = Object.keys(ranking);

	const usersPromise = Promise.all(userIds.map(getUser));
	const monthlyCountsPromise = Promise.all(
		userIds.map((userId) => getMonthlyCount({ userId, cumulative, ...params })),
	);
	const [users, monthlyCounts] = await Promise.all([
		usersPromise,
		monthlyCountsPromise,
	]);

	return Object.fromEntries(
		userIds.map((userId, i) => [
			userId,
			{ ...ranking[userId]!, ...users[i]!, monthlyCount: monthlyCounts[i]! },
		]),
	);
}
