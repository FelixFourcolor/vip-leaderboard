import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { pick } from "es-toolkit";
import { fastify } from "fastify";
import type { MonthlyCount, RankingData, UserData } from "./api.js";
import { createPool } from "./db.js";
import { basicHandler, rankingHandler, timeHandler } from "./queryHandler.js";
import { reaction, ticket, user } from "./schema.js";

export async function startServer(port = 3001) {
	const { db, pool } = createPool();
	const app = fastify();

	app.register(fastifyStatic, {
		root: resolve(dirname(fileURLToPath(import.meta.url)), "../../client/dist"),
	});
	app.addHook("onClose", () => pool.end());

	app.get(
		"/api/last-updated",
		basicHandler((): Promise<Date> => {
			return db
				.select({ timestamp: ticket.timestamp })
				.from(ticket)
				.orderBy(desc(ticket.timestamp))
				.limit(1)
				.then((rows) => rows[0]!.timestamp);
		}),
	);

	app.get(
		"/api/user/:userId",
		basicHandler((_, { userId }): Promise<UserData> => {
			return db
				.select({ ...pick(user, ["name", "avatarUrl", "color"] as const) })
				.from(user)
				.where(eq(user.id, userId!))
				.then((rows) => rows[0] ?? null);
		}),
	);

	app.get(
		"/api/monthly-count/:userId",
		timeHandler(({ since, until }, { userId }) => {
			return db
				.select({
					// biome-ignore format: one line
					month: sql<string>`DATE_FORMAT(${ticket.timestamp}, '%Y-%m')`.as("month"),
					count: count().as("count"),
				})
				.from(reaction)
				.innerJoin(ticket, eq(ticket.id, reaction.ticketId))
				.where(
					and(
						eq(reaction.userId, userId!),
						...(since ? [gte(ticket.timestamp, since)] : []),
						...(until ? [lt(ticket.timestamp, until)] : []),
					),
				)
				.groupBy(sql`month`)
				.orderBy(asc(sql`month`)) satisfies Promise<MonthlyCount>;
		}),
	);

	app.get(
		"/api/ranking",
		rankingHandler(({ from = 1, to, since, until }) => {
			const query = db
				.select({
					id: user.id,
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
				.$dynamic();

			const offset = from - 1;
			if (to) {
				query.limit(to - offset);
			}
			if (from) {
				query.offset(offset);
			}

			return query.then((rows): RankingData => {
				return Object.fromEntries(
					rows.map(({ id, count }, i) => [id, { count, rank: i + from }]),
				);
			});
		}),
	);

	return app.listen({ port });
}
