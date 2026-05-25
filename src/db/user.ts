import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { groupBy } from "es-toolkit";
import type { TimeSeries } from "@/components/TimeChart";
import { pick } from "@/utils/object";
import { offset, type YyyyMm } from "@/utils/time";
import type { ActivityType } from "./activity";
import { loadDb } from "./db";
import { activity, user } from "./schema";

const userFields = pick(user, ["id", "name", "avatarUrl", "color"]);

export type User = typeof user.$inferSelect;
export async function getUser(userId: string): Promise<User | undefined> {
	const db = await loadDb();
	return db.select(userFields).from(user).where(eq(user.id, userId)).get();
}

type UserRankingParams<T extends ActivityType = ActivityType> = {
	since?: YyyyMm;
	until?: YyyyMm;
	types?: T[];
	sortBy?: T | "total";
};
export type UserRanking<T extends ActivityType = ActivityType> = User & {
	[K in T]: number;
} & { total: number };
export async function getUserRanking<T extends ActivityType = ActivityType>({
	since,
	until,
	types,
	sortBy = "total",
}: UserRankingParams<T>): Promise<UserRanking<T>[]> {
	// make "until" include the last month
	until = until ? offset(until, { months: 1 }) : undefined;
	const db = await loadDb();

	const rows = db
		.select({ ...userFields, count: count(activity.date), type: activity.type })
		.from(activity)
		.innerJoin(user, eq(user.id, activity.userId))
		.where(
			and(
				since ? gte(activity.date, new Date(since)) : undefined,
				until ? lt(activity.date, new Date(until)) : undefined,
				types?.length ? inArray(activity.type, types) : undefined,
			),
		)
		.groupBy(user.id, activity.type)
		.all();

	const users = Object.entries(groupBy(rows, (r) => r.id)).map(
		([id, userRows]) => {
			const { name, color, avatarUrl } = userRows[0]!;
			return userRows.reduce(
				(acc, { type, count }) =>
					Object.assign(acc, { [type]: count, total: acc.total + count }),
				{ id, name, color, avatarUrl, total: 0 } as UserRanking,
			);
		},
	);

	return users.sort(
		(a, b) => b[sortBy] - a[sortBy] || a.id.localeCompare(b.id),
	);
}

export type UserMonthlyCount = TimeSeries & { total: number };
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
		.all();

	const users = Object.entries(groupBy(rows, (r) => r.id)).map(([id, rows]) => {
		const { name, color, avatarUrl } = rows[0]!;
		return {
			id,
			name,
			color,
			avatarUrl,
			total: rows.reduce((sum, r) => sum + r.count, 0),
			data: rows.map((r) => ({ x: r.month as YyyyMm, y: r.count })),
		};
	});

	return users.sort((a, b) => b.total - a.total || a.id.localeCompare(b.id));
}
