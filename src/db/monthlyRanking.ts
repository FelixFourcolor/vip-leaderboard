import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { groupBy } from "es-toolkit";
import { pick } from "@/utils/object";
import { offset } from "@/utils/time";
import { loadDb } from "./db";
import type { RankingData, RankingParams } from "./ranking";
import { activity, user } from "./schema";
import { userFields } from "./user";

type MonthlyCount = { month: string; count: number | null }[];

export type MonthlyRanking = Record<
	string,
	{ monthlyCount: MonthlyCount } & RankingData[string]
>;

export async function getMonthlyData({
	from = 1,
	to = 1000,
	since,
	until,
}: RankingParams): Promise<MonthlyRanking> {
	// make "until" include the last month
	until = until ? offset(until, { months: 1 }) : undefined;
	const db = await loadDb();

	const monthCount = db.$with("month_count").as(
		db
			.select({
				id: activity.userId,
				// biome-ignore format: one line
				month: sql<string>`strftime('%Y-%m', ${activity.date}, 'unixepoch')`.as("month"),
				count: count().as("count"),
			})
			.from(activity)
			.where(
				and(
					...(since ? [gte(activity.date, new Date(since))] : []),
					...(until ? [lt(activity.date, new Date(until))] : []),
				),
			)
			.groupBy(activity.userId, sql`month`),
	);

	const topUsers = (await db).$with("top_users").as(
		(await db)
			.select({
				id: monthCount.id,
				total: sql<number>`SUM(${monthCount.count})`.as("total"),
			})
			.from(monthCount)
			.groupBy(monthCount.id)
			.orderBy(desc(sql`total`), asc(monthCount.id))
			.limit(to - from + 1)
			.offset(from - 1),
	);

	const rows = (await db)
		.with(monthCount, topUsers)
		.select({
			...userFields,
			...pick(monthCount, ["month", "count"]),
			total: topUsers.total,
		})
		.from(topUsers)
		.innerJoin(monthCount, eq(monthCount.id, topUsers.id))
		.innerJoin(user, eq(user.id, monthCount.id))
		.orderBy(desc(topUsers.total), asc(monthCount.month))
		.all();

	if (rows.length === 0) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(groupBy(rows, (row) => row.id)).map(([id, rows], index) => {
			const { name, color, avatarUrl, total: count } = rows[0]!;
			const monthlyCount = rows.map(({ month, count }) => ({ month, count }));
			return [
				id,
				{
					id,
					name,
					color,
					avatarUrl,
					count,
					rank: from + index,
					monthlyCount,
				},
			];
		}),
	);
}
