import { and, asc, count, desc, eq, gte, lt } from "drizzle-orm";
import { pick } from "@/utils/object";
import { offset } from "@/utils/time";
import { db } from "./db";
import { activity, user } from "./schema";
import type { UserData } from "./user";

export type RankingParams = {
	since?: string;
	until?: string;
	from?: number;
	to?: number;
};

export type RankingData = Record<
	string,
	{ rank: number; count: number } & UserData
>;

export async function getRanking({
	from = 1,
	to = 1000,
	since,
	until,
}: RankingParams): Promise<RankingData> {
	// make "until" include the last month
	until = until ? offset(until, { months: 1 }) : undefined;

	const rows = (await db)
		.select({
			...pick(user, ["color", "name", "avatarUrl"]),
			id: user.id,
			count: count(activity.date),
		})
		.from(activity)
		.innerJoin(user, eq(user.id, activity.userId))
		.where(
			and(
				...(since ? [gte(activity.date, new Date(since))] : []),
				...(until ? [lt(activity.date, new Date(until))] : []),
			),
		)
		.groupBy(user.id)
		.orderBy(desc(count(activity.date)), asc(user.id))
		.limit(to - from + 1)
		.offset(from - 1)
		.all();

	return Object.fromEntries(
		rows.map(({ id, ...data }, index) => [id, { ...data, rank: index + from }]),
	);
}
