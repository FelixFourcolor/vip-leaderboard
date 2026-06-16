import { and, count, eq, gte, inArray, lt, max, min, sql } from "drizzle-orm";
import { groupBy } from "es-toolkit";
import type { DataRow } from "@/components/DataBarTable";
import type { TimeSeries } from "@/components/TimeChart";
import { fromEntries, pick, values } from "@/utils/object";
import { type YyyyMm, yyyyMmOffset } from "@/utils/time";
import type { Maybe } from "@/utils/types";
import { type ActivityType, activityTypes } from "./activity";
import { loadDb } from "./loader";
import { activity, user } from "./schema";

const userFields = pick(user, ["id", "name", "avatarUrl", "color"]);

export type User = typeof user.$inferSelect;
export async function getUser(userId: string): Promise<Maybe<User>> {
	const db = await loadDb();
	return db.select(userFields).from(user).where(eq(user.id, userId)).get();
}

interface UserActivity {
	lastActiveDate: Date;
	firstActiveDate: Date;
}
export const userSortBy =
	<U extends UserActivity>(getValue: (user: U) => number) =>
	(a: U, b: U) =>
		getValue(b) - getValue(a) ||
		b.lastActiveDate.valueOf() - a.lastActiveDate.valueOf() ||
		b.firstActiveDate.valueOf() - a.firstActiveDate.valueOf();

export interface UserStatsParams {
	since?: YyyyMm;
	until?: YyyyMm;
}
export interface UserStats
	extends User,
		UserActivity,
		DataRow<ActivityType | "total"> {}
export async function getUserStats({
	since,
	until,
}: UserStatsParams): Promise<UserStats[]> {
	// make "until" include the last month
	until = until ? yyyyMmOffset(until, { months: 1 }) : undefined;
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
			),
		)
		.groupBy(user.id, activity.type)
		.all();

	return Object.entries(groupBy(rows, (r) => r.id)).map(([id, rows]) => {
		const { name, color, avatarUrl } = rows[0]!;

		const activitiesCount = fromEntries(
			activityTypes.map((type) => [
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

export interface UserMonthlyCountParams extends UserStatsParams {
	types?: ActivityType[];
}
export interface UserMonthlyCount extends User, TimeSeries {
	total: number;
}
export async function getUserMonthlyCount({
	since,
	until,
	types,
}: UserMonthlyCountParams): Promise<UserMonthlyCount[]> {
	// make "until" include the last month
	until = until ? yyyyMmOffset(until, { months: 1 }) : undefined;
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
		const data = rows.map((r) => ({
			month: r.month as YyyyMm,
			value: r.count,
		}));

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

	return users.sort(userSortBy((u) => u.total));
}
