import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { groupBy } from "es-toolkit";
import type { TimeSeries } from "@/components/TimeChart";
import { pick, values } from "@/utils/object";
import { offset, type YyyyMm } from "@/utils/time";
import { type ActivityType, activityTypes } from "./activity";
import { loadDb } from "./db";
import { activity, user } from "./schema";

const userFields = pick(user, ["id", "name", "avatarUrl", "color"]);

export type User = typeof user.$inferSelect;
export async function getUser(userId: string): Promise<User | undefined> {
	const db = await loadDb();
	return db.select(userFields).from(user).where(eq(user.id, userId)).get();
}

type UserStatsParams<T extends ActivityType = ActivityType> = {
	since?: YyyyMm;
	until?: YyyyMm;
	types?: T[];
};
export interface UserStats<T extends ActivityType = ActivityType> extends User {
	data: Record<T | "total", number>;
}
export async function getUserStats<T extends ActivityType = ActivityType>({
	since,
	until,
	types,
}: UserStatsParams<T>): Promise<UserStats<T>[]> {
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

	return Object.entries(groupBy(rows, (r) => r.id)).map(([id, userRows]) => {
		const { name, color, avatarUrl } = userRows[0]!;

		const activitiesCount = Object.fromEntries(
			(types ?? activityTypes).map((type) => [
				type,
				userRows.find((r) => r.type === type)?.count ?? 0,
			]),
		) as Record<T, number>;
		const total = values(activitiesCount).reduce((sum, v) => sum + v, 0);
		const data = { ...activitiesCount, total };

		return { id, name, color, avatarUrl, data };
	});
}

export interface UserMonthlyStats extends TimeSeries {
	total: number;
}
export async function getUserMonthlyStats({
	since,
	until,
	types,
}: UserStatsParams): Promise<UserMonthlyStats[]> {
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
		const total = rows.reduce((sum, r) => sum + r.count, 0);
		const data = rows.map((r) => ({ x: r.month as YyyyMm, y: r.count }));
		return { id, name, color, avatarUrl, total, data };
	});

	return users.sort(
		(a, b) =>
			b.total - a.total ||
			(() => {
				// in loader/data-save.ts we already removed all inactive users,
				// so the data array is never empty
				const aLastActiveDate = a.data.at(-1)!.x;
				const bLastActiveDate = b.data.at(-1)!.x;
				return bLastActiveDate.localeCompare(aLastActiveDate);
			})() ||
			(() => {
				const aFirstActiveDate = a.data.at(0)!.x;
				const bFirstActiveDate = b.data.at(0)!.x;
				return bFirstActiveDate.localeCompare(aFirstActiveDate);
			})(),
	);
}
