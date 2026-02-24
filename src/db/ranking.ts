import { and, asc, count, desc, eq, gte, lt } from "drizzle-orm";
import { pick } from "@/utils/object";
import { offset } from "@/utils/time";
import { db } from "./db";
import { reaction, ticket, user } from "./schema";
import type { UserData } from "./user";

export type RankingParams = {
	since?: string;
	until?: string;
	from?: number;
	to?: number;
};

export type RankingData = Record<
	string,
	{ rank: number; count: number } & UserData
>;

export async function getRanking({
	from = 1,
	to = 1000,
	since,
	until,
}: RankingParams): Promise<RankingData> {
	// make "until" include the last month
	until = until ? offset(until, { months: 1 }) : undefined;

	const rows = (await db)
		.select({
			...pick(user, ["color", "name", "avatarUrl"] as const),
			userId: user.id,
			count: count(reaction.ticketId),
		})
		.from(reaction)
		.innerJoin(user, eq(user.id, reaction.userId))
		.innerJoin(ticket, eq(ticket.id, reaction.ticketId))
		.where(
			and(
				...(since ? [gte(ticket.timestamp, new Date(since))] : []),
				...(until ? [lt(ticket.timestamp, new Date(until))] : []),
			),
		)
		.groupBy(user.id)
		.orderBy(desc(count(reaction.ticketId)), asc(user.id))
		.limit(to - from + 1)
		.offset(from - 1)
		.all();

	return Object.fromEntries(
		rows.map(({ userId, count, ...userData }, index) => [
			userId,
			{
				rank: index + from,
				count,
				...userData,
			},
		]),
	);
}
