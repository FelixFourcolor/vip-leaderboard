import { and, asc, count, desc, eq, gte, lt } from "drizzle-orm";
import { offset } from "@/utils/time";
import { loadDb } from "./db";
import { activity, user } from "./schema";
import { type UserData, userFields } from "./user";

export type RankingParams = { since?: string; until?: string };
export type UserRanking = { rank: number; count: number } & UserData;

export async function getRanking({
	since,
	until,
}: RankingParams): Promise<UserRanking[]> {
	// make "until" include the last month
	until = until ? offset(until, { months: 1 }) : undefined;
	const db = await loadDb();

	const rows = db
		.select({ ...userFields, count: count(activity.date) })
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
		.all();

	return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}
