import { dirname, resolve } from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { groupBy, mapValues } from "es-toolkit";
import { type FastifyReply, fastify } from "fastify";
import { match } from "ts-pattern";
import { createPool } from "./db.js";
import { reaction, ticket, user } from "./schema.js";

export async function startServer(port = 3001) {
	const { db, pool } = createPool();
	const app = fastify();

	app.register(fastifyStatic, {
		root: resolve(dirname(fileURLToPath(import.meta.url)), "../../client/dist"),
	});
	app.addHook("onClose", () => pool.end());

	const lastUpdatedHandler = createHandler();
	app.get(
		"/api/last-updated",
		lastUpdatedHandler((): Promise<Date> => {
			return db
				.select({ timestamp: ticket.timestamp })
				.from(ticket)
				.orderBy(desc(ticket.timestamp))
				.limit(1)
				.then((rows) => rows[0]!.timestamp);
		}),
	);

	const rankingHandler = createHandler({
		since: "date",
		until: "date",
		from: "int",
		to: "int",
	});
	type RankingData = Record<
		string,
		{
			name: string;
			avatarUrl: string;
			color: string | null;
			rank: number;
			count: number;
		}
	>;
	app.get(
		"/api/ranking",
		rankingHandler(async ({ from = 1, to, since, until }) => {
			const query = db
				.select({
					...pick(user, ["id", "name", "avatarUrl", "color"]),
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

			const rows = await query;

			return Object.fromEntries(
				rows.map(({ id, ...data }, i) => [id, { ...data, rank: i + 1 }]),
			) satisfies RankingData;
		}),
	);

	const monthlyHandler = rankingHandler.merge({ user: "str" });
	type MonthlyData = Record<string, Array<{ month: string; count: number }>>;
	app.get(
		"/api/monthly",
		monthlyHandler(async ({ from = 1, to, since, until, user: userId }) => {
			const userMonth = db.$with("user_month").as(
				db
					.select({
						userId: reaction.userId,
						// biome-ignore format: don't break the line
						month: sql<string>`DATE_FORMAT(${ticket.timestamp}, '%Y-%m')`.as("month"),
						count: count().as("count"),
					})
					.from(reaction)
					.innerJoin(ticket, eq(ticket.id, reaction.ticketId))
					.where(
						and(
							...(since ? [gte(ticket.timestamp, since)] : []),
							...(until ? [lt(ticket.timestamp, until)] : []),
						),
					)
					.groupBy(reaction.userId, sql`month`),
			);

			const topUsers = db.$with("top_users").as(() => {
				const query = db
					.select({
						userId: userMonth.userId,
						total: sql<number>`SUM(${userMonth.count})`.as("total"),
					})
					.from(userMonth)
					.groupBy(userMonth.userId)
					.orderBy(desc(sql`total`), asc(userMonth.userId))
					.$dynamic();
				if (userId) {
					query.where(eq(userMonth.userId, userId));
				} else {
					const offset = from - 1;
					if (to) {
						query.limit(to - offset);
					}
					if (from) {
						query.offset(offset);
					}
				}
				return query;
			});

			const rows = await db
				.with(userMonth, topUsers)
				.select({ id: user.id, ...pick(userMonth, ["month", "count"]) })
				.from(topUsers)
				.innerJoin(userMonth, eq(userMonth.userId, topUsers.userId))
				.innerJoin(user, eq(user.id, userMonth.userId))
				.orderBy(desc(topUsers.total), asc(userMonth.month));

			return mapValues(
				groupBy(rows, (row) => row.id),
				(rows) => rows.map((row) => pick(row, ["month", "count"])),
			) satisfies MonthlyData;
		}),
	);

	return app.listen({ port });
}

type Schema = Record<string, "str" | "int" | "date">;
function createHandler<S extends Schema>(schema = {} as S) {
	type ValidatedArgs = {
		[K in keyof S]?: S[K] extends "int"
			? number
			: S[K] extends "date"
				? Date
				: S[K] extends "str"
					? string
					: never;
	};

	function merge<T extends Schema>(other: T) {
		return createHandler<S & T>({ ...schema, ...other });
	}

	function validate({ query }: { query: Record<string, string> }) {
		return mapValues(query, (v, k) => {
			const expectedType = schema[k];
			return match(expectedType)
				.with(undefined, () => {
					throw new Error(`Unknown param: ${k}`);
				})
				.with("str", () => v)
				.with("int", () => {
					const validated = parseInt(v);
					if (Number.isNaN(validated)) {
						throw new Error(`Invalid value for param ${k}; expected integer.`);
					}
					return validated;
				})
				.with("date", () => {
					const validated = new Date(v);
					if (Number.isNaN(validated.getTime())) {
						throw new Error(`Invalid value for param ${k}; expected date.`);
					}
					return validated;
				})
				.exhaustive();
		}) as ValidatedArgs;
	}

	function wrapper(logic: (args: ValidatedArgs) => Promise<unknown>) {
		return async (request: any, reply: FastifyReply) => {
			if (env.NODE_ENV === "production") {
				reply.header("Cache-Control", "public, max-age=86400");
			}

			let validated: ValidatedArgs;
			try {
				validated = validate(request);
			} catch (e) {
				return reply.code(400).send(e);
			}

			return logic(validated).catch(() =>
				reply.code(500).send({
					statusCode: 500,
					error: "internal server error",
					reason: "incompetence",
				}),
			);
		};
	}

	return Object.assign(wrapper, { merge });
}

// reimplementation of es-toolkit's pick, the original doesn't work with drizzle
function pick<T, const K extends keyof T>(obj: T, keys: readonly K[]) {
	return Object.fromEntries(keys.map((key) => [key, obj[key]])) as Pick<T, K>;
}
