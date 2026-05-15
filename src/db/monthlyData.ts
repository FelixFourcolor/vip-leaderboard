import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { groupBy } from "es-toolkit";
import { pick } from "@/utils/object";
import { offset, type YyyyMm } from "@/utils/time";
import { loadDb } from "./db";
import type { RankingParams, UserRanking } from "./ranking";
import { activity, user } from "./schema";
import { userFields } from "./user";

export type MonthlyCount = { x: YyyyMm; y: number | null }[];
export type UserMonthlyData = { data: MonthlyCount } & UserRanking;

export async function getMonthlyData({
	since,
	until,
}: RankingParams): Promise<UserMonthlyData[]> {
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

	const topUsers = db.$with("top_users").as(
		db
			.select({
				id: monthCount.id,
				total: sql<number>`SUM(${monthCount.count})`.as("total"),
			})
			.from(monthCount)
			.groupBy(monthCount.id)
			.orderBy(desc(sql`total`), asc(monthCount.id)),
	);

	const rows = db
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

	return Object.entries(groupBy(rows, (row) => row.id)).map(
		([id, rows], index) => {
			const { name, color, avatarUrl, total: count } = rows[0]!;
			return {
				id,
				name,
				color,
				avatarUrl,
				count,
				rank: index + 1,
				data: rows.map(({ month, count }) => ({ x: month, y: count })),
			};
		},
	);
}
