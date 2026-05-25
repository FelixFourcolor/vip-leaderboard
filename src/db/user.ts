import { and, asc, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { groupBy } from "es-toolkit";
import type { TimeSeries } from "@/components/TimeChart";
import { pick } from "@/utils/object";
import { offset, type YyyyMm } from "@/utils/time";
import { loadDb } from "./db";
import { type ActivityType, activity, user } from "./schema";

const userFields = pick(user, ["id", "name", "avatarUrl", "color"]);

export type User = typeof user.$inferSelect;
export async function getUser(userId: string): Promise<User | undefined> {
	const db = await loadDb();
	return db.select(userFields).from(user).where(eq(user.id, userId)).get();
}

type UserRankingParams = {
	since?: YyyyMm;
	until?: YyyyMm;
	types?: ActivityType[];
};
export interface UserRanking extends User {
	rank: number;
	count: number;
}
export async function getUserRanking({
	since,
	until,
	types,
}: UserRankingParams): Promise<UserRanking[]> {
	// make "until" include the last month
	until = until ? offset(until, { months: 1 }) : undefined;
	const db = await loadDb();

	const rows = db
		.select({ ...userFields, count: count(activity.date) })
		.from(activity)
		.innerJoin(user, eq(user.id, activity.userId))
		.where(
			and(
				since ? gte(activity.date, new Date(since)) : undefined,
				until ? lt(activity.date, new Date(until)) : undefined,
				types?.length ? inArray(activity.type, types) : undefined,
			),
		)
		.groupBy(user.id)
		.orderBy(desc(count(activity.date)), asc(user.id))
		.all();

	return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export interface UserMonthlyCount extends UserRanking, TimeSeries {}
export async function getUserMonthlyCount({
	since,
	until,
	types,
}: UserRankingParams): Promise<UserMonthlyCount[]> {
	// make "until" include the last month
	until = until ? offset(until, { months: 1 }) : undefined;
	const db = await loadDb();

	const rows = db
		.select({
			...userFields,
			// biome-ignore format: one line
			month: sql<string>`strftime('%Y-%m', ${activity.date}, 'unixepoch')`.as("month"),
			count: count().as("count"),
		})
		.from(activity)
		.innerJoin(user, eq(user.id, activity.userId))
		.where(
			and(
				since ? gte(activity.date, new Date(since)) : undefined,
				until ? lt(activity.date, new Date(until)) : undefined,
				types?.length ? inArray(activity.type, types) : undefined,
			),
		)
		.groupBy(activity.userId, sql`month`)
		.orderBy(asc(sql`month`))
		.all();

	const users = Object.entries(groupBy(rows, (r) => r.id)).map(([id, rows]) => {
		const { name, color, avatarUrl } = rows[0]!;
		return {
			id,
			name,
			color,
			avatarUrl,
			count: rows.reduce((sum, r) => sum + r.count, 0), // Overall total for ranking
			data: rows.map((r) => ({ x: r.month as YyyyMm, y: r.count })),
		};
	});

	return users
		.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
		.map((user, index) => ({ ...user, rank: index + 1 }));
}
