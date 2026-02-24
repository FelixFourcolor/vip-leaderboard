import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { groupBy } from "es-toolkit";
import { pick } from "@/utils/object";
import { offset } from "@/utils/time";
import { db } from "./db";
import type { RankingData, RankingParams } from "./ranking";
import { reaction, ticket, user } from "./schema";

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

	const userMonth = (await db).$with("user_month").as(
		(await db)
			.select({
				userId: reaction.userId,
				// biome-ignore format: one line
				month: sql<string>`strftime('%Y-%m', ${ticket.timestamp}, 'unixepoch')`.as("month"),
				count: count().as("count"),
			})
			.from(reaction)
			.innerJoin(ticket, eq(ticket.id, reaction.ticketId))
			.where(
				and(
					...(since ? [gte(ticket.timestamp, new Date(since))] : []),
					...(until ? [lt(ticket.timestamp, new Date(until))] : []),
				),
			)
			.groupBy(reaction.userId, sql`month`),
	);

	const topUsers = (await db).$with("top_users").as(
		(await db)
			.select({
				userId: userMonth.userId,
				total: sql<number>`SUM(${userMonth.count})`.as("total"),
			})
			.from(userMonth)
			.groupBy(userMonth.userId)
			.orderBy(desc(sql`total`), asc(userMonth.userId))
			.limit(to - from + 1)
			.offset(from - 1),
	);

	const rows = (await db)
		.with(userMonth, topUsers)
		.select({
			...pick(user, ["id", "name", "color", "avatarUrl"]),
			...pick(userMonth, ["month", "count"]),
			total: topUsers.total,
		})
		.from(topUsers)
		.innerJoin(userMonth, eq(userMonth.userId, topUsers.userId))
		.innerJoin(user, eq(user.id, userMonth.userId))
		.orderBy(desc(topUsers.total), asc(userMonth.month))
		.all();

	if (rows.length === 0) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(groupBy(rows, (row) => row.id)).map(
			([userId, rows], index) => {
				const { name, color, avatarUrl, total: count } = rows[0]!;
				const monthlyCount = rows.map(({ month, count }) => ({ month, count }));
				return [
					userId,
					{
						name,
						color,
						avatarUrl,
						count,
						rank: from + index,
						monthlyCount,
					},
				];
			},
		),
	);
}
