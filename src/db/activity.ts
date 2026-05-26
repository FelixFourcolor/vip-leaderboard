import { count, eq, gte, lt, sql } from "drizzle-orm";
import { and } from "drizzle-orm/sqlite-core/expressions";
import { groupBy } from "es-toolkit";
import type { TimeSeries } from "@/components/TimeChart";
import { offset, type YyyyMm } from "@/utils/time";
import { loadDb } from "./db";
import { activity } from "./schema";

export const activityTypes = activity.type.enumValues;
export type ActivityType = (typeof activityTypes)[number];

export const activityLabels = {
	ticket: "Tickets",
	warning: "Warnings",
	ban: "Bans",
} satisfies Record<ActivityType, string>;
export const categoryIcons = {
	ticket: "✅",
	warning: "⚠️",
	ban: "🔨",
} satisfies Record<ActivityType, string>;

type ActivityCountParams = {
	since?: YyyyMm;
	until?: YyyyMm;
	user?: string;
};
export type ActivityCount = {
	type: ActivityType;
	count: number;
};
export async function getActivityCount({
	since,
	until,
	user,
}: ActivityCountParams): Promise<ActivityCount[]> {
	// make "until" include the last month
	until = until ? offset(until, { months: 1 }) : undefined;
	const db = await loadDb();

	const rows = db
		.select({ type: activity.type, count: count() })
		.from(activity)
		.where(
			and(
				since ? gte(activity.date, new Date(since)) : undefined,
				until ? lt(activity.date, new Date(until)) : undefined,
				user ? eq(activity.userId, user) : undefined,
			),
		)
		.groupBy(activity.type)
		.all();

	return rows.sort(
		(a, b) => activityTypes.indexOf(a.type) - activityTypes.indexOf(b.type),
	);
}

export interface ActivityMonthlyCount extends TimeSeries {
	type: ActivityType;
	count: number;
}
export async function getActivityMonthlyCount({
	since,
	until,
	user,
}: ActivityCountParams): Promise<ActivityMonthlyCount[]> {
	// make "until" include the last month
	until = until ? offset(until, { months: 1 }) : undefined;
	const db = await loadDb();

	const rows = db
		.select({
			type: activity.type,
			// biome-ignore format: one line
			month: sql<string>`strftime('%Y-%m', ${activity.date}, 'unixepoch')`.as("month"),
			count: count().as("count"),
		})
		.from(activity)
		.where(
			and(
				since ? gte(activity.date, new Date(since)) : undefined,
				until ? lt(activity.date, new Date(until)) : undefined,
				user ? eq(activity.userId, user) : undefined,
			),
		)
		.groupBy(activity.type, sql`month`)
		.all();

	const activities = Object.entries(groupBy(rows, (r) => r.type)).map(
		([type, rows]) => ({
			id: type,
			type: type as ActivityType,
			count: rows.reduce((sum, r) => sum + r.count, 0),
			data: rows.map((r) => ({ x: r.month as YyyyMm, y: r.count })),
		}),
	);

	return activities.sort(
		(a, b) => activityTypes.indexOf(a.type) - activityTypes.indexOf(b.type),
	);
}
