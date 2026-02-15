import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { groupBy, mapValues } from "es-toolkit";
import { type FastifyReply, fastify } from "fastify";
import { match } from "ts-pattern";
import { createPool } from "./db.js";
import { reaction, ticket, user } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startServer(port = 3001) {
	const { db, pool } = createPool();
	const app = fastify();

	app.register(fastifyStatic, {
		root: resolve(__dirname, "../../client/dist"),
	});
	app.addHook("onClose", () => pool.end());

	const lastUpdatedHandler = createHandler();
	app.get(
		"/api/last-updated",
		lastUpdatedHandler((): Promise<Date | undefined> => {
			return db
				.select({ timestamp: ticket.timestamp })
				.from(ticket)
				.orderBy(desc(ticket.timestamp))
				.limit(1)
				.then((rows) => rows[0]?.timestamp);
		}),
	);

	const rankingHandler = createHandler({
		from: "date",
		to: "date",
		top: "int",
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
		rankingHandler(async ({ top, from, to }): Promise<RankingData> => {
			const query = db
				.select({
					id: user.id,
					name: user.name,
					avatarUrl: user.avatarUrl,
					color: user.color,
					count: count(reaction.ticketId),
				})
				.from(reaction)
				.innerJoin(user, eq(user.id, reaction.userId))
				.innerJoin(ticket, eq(ticket.id, reaction.ticketId))
				.where(
					and(
						...(from ? [gte(ticket.timestamp, from)] : []),
						...(to ? [lt(ticket.timestamp, to)] : []),
					),
				)
				.groupBy(user.id)
				.orderBy(desc(count(reaction.ticketId)), asc(user.id))
				.$dynamic();
			if (top) {
				query.limit(top);
			}

			const rows = await query;

			return Object.fromEntries(
				rows.map(({ id, ...data }, i) => [id, { ...data, rank: i + 1 }]),
			);
		}),
	);

	const monthlyHandler = createHandler({
		from: "date",
		to: "date",
		user: "str",
		top: "int",
	});
	type MonthlyData = Record<string, Array<{ month: string; count: number }>>;
	app.get(
		"/api/monthly",
		monthlyHandler(
			async ({ top, from, to, user: userId }): Promise<MonthlyData> => {
				const userMonth = db.$with("user_month").as(
					db
						.select({
							userId: reaction.userId,
							month: sql<string>`DATE_FORMAT(${ticket.timestamp}, '%Y-%m')`.as(
								"month",
							),
							count: count().as("count"),
						})
						.from(reaction)
						.innerJoin(ticket, eq(ticket.id, reaction.ticketId))
						.where(
							and(
								...(from ? [gte(ticket.timestamp, from)] : []),
								...(to ? [lt(ticket.timestamp, to)] : []),
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
						.orderBy(desc(sql`total`))
						.$dynamic();
					if (userId) {
						query.where(eq(userMonth.userId, userId));
					} else if (top) {
						query.limit(top);
					}
					return query;
				});

				const rows = await db
					.with(userMonth, topUsers)
					.select({
						id: user.id,
						month: userMonth.month,
						count: userMonth.count,
					})
					.from(topUsers)
					.innerJoin(userMonth, eq(userMonth.userId, topUsers.userId))
					.innerJoin(user, eq(user.id, userMonth.userId))
					.orderBy(desc(topUsers.total), asc(user.id), asc(userMonth.month));

				return mapValues(
					groupBy(rows, ({ id }) => id),
					(data) => data.map(({ id, ...tickets }) => tickets),
				);
			},
		),
	);

	return app.listen({ port });
}

function createHandler<Schema extends Record<string, "str" | "int" | "date">>(
	schema: Schema = {} as Schema,
) {
	type ValidatedArgs = {
		[K in keyof Schema]?: Schema[K] extends "int"
			? number
			: Schema[K] extends "date"
				? Date
				: Schema[K] extends "str"
					? string
					: never;
	};

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
		return (request: any, reply: FastifyReply) => {
			reply.header("Cache-Control", "public, max-age=86400");
			try {
				return logic(validate(request));
			} catch (e) {
				return reply.code(400).send(e);
			}
		};
	}

	return wrapper;
}
