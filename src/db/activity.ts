import { count, eq, gte, lt, sql } from "drizzle-orm";
import { and } from "drizzle-orm/sqlite-core/expressions";
import { groupBy } from "es-toolkit";
import type { DataRow } from "@/components/DataBarTable";
import type { TimeSeries } from "@/components/TimeChart";
import { timeOffset, type YyyyMm } from "@/utils/time";
import { loadDb } from "./loader";
import { activity } from "./schema";

export const activityTypes = activity.type.enumValues;
export type ActivityType = (typeof activityTypes)[number];

export const activityLabels = {
	ticket: "Tickets",
	warning: "Warnings",
	ban: "Bans",
	total: "Total",
} as const satisfies Record<ActivityType | "total", string>;
export const activityIcons = {
	ticket: "✅",
	warning: "⚠️",
	ban: "🔨",
} as const satisfies Record<ActivityType, string>;
export const activityColors = {
	ticket: "#5cc639",
	warning: "#ffbf00",
	ban: "#ff6673",
	total: "#6e9cf7",
} as const satisfies Record<ActivityType | "total", string>;

type ActivityParams = {
	since?: YyyyMm;
	until?: YyyyMm;
	user?: string;
};

export interface ActivityStats extends DataRow<"count"> {
	type: ActivityType | "total";
}
export async function getActivityStats({
	since,
	until,
	user,
}: ActivityParams): Promise<ActivityStats[]> {
	// make "until" include the last month
	until = until ? timeOffset(until, { months: 1 }) : undefined;
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

	return [
		...activityTypes.map((type) => {
			const row = rows.find((r) => r.type === type);
			return {
				type,
				data: { count: row?.count ?? 0 },
			};
		}),
		{
			type: "total",
			data: { count: rows.reduce((sum, r) => sum + r.count, 0) },
		},
	];
}

export interface ActivityMonthlyCount extends TimeSeries {
	type: ActivityType;
	count: number;
}
export async function getActivityMonthlyStats({
	since,
	until,
	user,
}: ActivityParams): Promise<ActivityMonthlyCount[]> {
	// make "until" include the last month
	until = until ? timeOffset(until, { months: 1 }) : undefined;
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

	return Object.entries(groupBy(rows, (r) => r.type))
		.map(([type, rows]) => ({
			id: type,
			type: type as ActivityType,
			count: rows.reduce((sum, r) => sum + r.count, 0),
			data: rows.map((r) => ({ month: r.month as YyyyMm, value: r.count })),
		}))
		.sort(
			(a, b) => activityTypes.indexOf(a.type) - activityTypes.indexOf(b.type),
		);
}
