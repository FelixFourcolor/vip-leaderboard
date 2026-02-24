import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { pick } from "es-toolkit";
import { db } from "./db";
import { reaction, ticket, user } from "./schema";

export type UserData = {
	name: string;
	avatarUrl: string;
	color: string;
} | null;

export async function getUser(userId: string): Promise<UserData> {
	const rows = (await db)
		.select({ ...pick(user, ["name", "avatarUrl", "color"] as const) })
		.from(user)
		.where(eq(user.id, userId))
		.all();
	return rows[0] ?? null;
}

type MonthlyCount = { month: string; count: number }[];

export async function getMonthlyCount(
	userId: string,
	since?: Date,
	until?: Date,
): Promise<MonthlyCount> {
	return (await db)
		.select({
			// biome-ignore format: one line
			month: sql<string>`strftime('%Y-%m', ${ticket.timestamp}, 'unixepoch')`.as("month"),
			count: count().as("count"),
		})
		.from(reaction)
		.innerJoin(ticket, eq(ticket.id, reaction.ticketId))
		.where(
			and(
				eq(reaction.userId, userId),
				...(since ? [gte(ticket.timestamp, since)] : []),
				...(until ? [lt(ticket.timestamp, until)] : []),
			),
		)
		.groupBy(sql`month`)
		.orderBy(asc(sql`month`))
		.all();
}

export type RankingData = { userId: string; rank: number; count: number }[];

export async function getRanking(
	from = 1,
	to = 1000,
	since?: Date,
	until?: Date,
): Promise<RankingData> {
	const offset = from - 1;
	const limit = to - offset;

	const rows = (await db)
		.select({
			userId: user.id,
			count: count(reaction.ticketId),
		})
		.from(reaction)
		.innerJoin(user, eq(user.id, reaction.userId))
		.innerJoin(ticket, eq(ticket.id, reaction.ticketId))
		.where(
			and(
				...(since ? [gte(ticket.timestamp, since)] : []),
				...(until ? [lt(ticket.timestamp, until)] : []),
			),
		)
		.groupBy(user.id)
		.orderBy(desc(count(reaction.ticketId)), asc(user.id))
		.limit(limit)
		.offset(offset)
		.all();

	return rows.map((value, index) => ({ ...value, rank: index + from }));
}
