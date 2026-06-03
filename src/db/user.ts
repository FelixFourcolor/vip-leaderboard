import { and, count, eq, gte, inArray, lt, max, min, sql } from "drizzle-orm";
import { groupBy } from "es-toolkit";
import type { DataRow } from "@/components/DataBarTable";
import type { TimeSeries } from "@/components/TimeChart";
import { fromEntries, pick, values } from "@/utils/object";
import { timeOffset, type YyyyMm } from "@/utils/time";
import { type ActivityType, activityTypes } from "./activity";
import { loadDb } from "./loader";
import { activity, user } from "./schema";

const userFields = pick(user, ["id", "name", "avatarUrl", "color"]);

export type User = typeof user.$inferSelect;
export async function getUser(userId: string): Promise<User | undefined> {
	const db = await loadDb();
	return db.select(userFields).from(user).where(eq(user.id, userId)).get();
}

type UserParams<T extends ActivityType = ActivityType> = {
	since?: YyyyMm;
	until?: YyyyMm;
	types?: T[];
};

export interface UserStats<T extends ActivityType = ActivityType>
	extends User,
		DataRow<T | "total"> {
	lastActiveDate: Date;
	firstActiveDate: Date;
}
export async function getUserStats<T extends ActivityType = ActivityType>({
	since,
	until,
	types,
}: UserParams<T>): Promise<UserStats<T>[]> {
	// make "until" include the last month
	until = until ? timeOffset(until, { months: 1 }) : undefined;
	const db = await loadDb();

	const rows = db
		.select({
			...userFields,
			count: count(activity.date),
			type: activity.type,
			minDate: min(activity.date),
			maxDate: max(activity.date),
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
		.groupBy(user.id, activity.type)
		.all();

	return Object.entries(groupBy(rows, (r) => r.id)).map(([id, rows]) => {
		const { name, color, avatarUrl } = rows[0]!;

		const activitiesCount = fromEntries(
			(types ?? activityTypes).map((type) => [
				type,
				rows.find((r) => r.type === type)?.count ?? 0,
			]),
		);
		const total = values(activitiesCount).reduce((sum, v) => sum + v, 0);
		const data = { ...activitiesCount, total };

		const firstActiveDate = rows
			.map((r) => r.minDate!)
			.reduce((min, d) => (d < min ? d : min));
		const lastActiveDate = rows
			.map((r) => r.maxDate!)
			.reduce((max, d) => (d > max ? d : max));

		return {
			id,
			name,
			color,
			avatarUrl,
			data,
			lastActiveDate,
			firstActiveDate,
		};
	});
}

export interface UserMonthlyCount extends User, TimeSeries {
	total: number;
}
export async function getUserMonthlyCount({
	since,
	until,
	types,
}: UserParams): Promise<UserMonthlyCount[]> {
	// make "until" include the last month
	until = until ? timeOffset(until, { months: 1 }) : undefined;
	const db = await loadDb();

	const rows = db
		.select({
			...userFields,
			// biome-ignore format: one line
			month: sql<string>`strftime('%Y-%m', ${activity.date}, 'unixepoch')`.as("month"),
			count: count().as("count"),
			minDate: min(activity.date),
			maxDate: max(activity.date),
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

		const firstActiveDate = rows
			.map((r) => r.minDate!)
			.reduce((min, d) => (d < min ? d : min));

		const lastActiveDate = rows
			.map((r) => r.maxDate!)
			.reduce((max, d) => (d > max ? d : max));

		return {
			id,
			name,
			color,
			avatarUrl,
			total,
			data,
			firstActiveDate,
			lastActiveDate,
		};
	});

	return users.sort(
		(a, b) =>
			b.total - a.total ||
			b.lastActiveDate.valueOf() - a.lastActiveDate.valueOf() ||
			b.firstActiveDate.valueOf() - a.firstActiveDate.valueOf(),
	);
}
