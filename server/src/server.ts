import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { MikroORM, RequestContext, sql } from "@mikro-orm/mysql";
import { groupBy, mapValues } from "es-toolkit";
import { type FastifyReply, fastify } from "fastify";
import { match } from "ts-pattern";
import { Reaction } from "./modules/reaction.entity.js";
import { Ticket } from "./modules/ticket.entity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startServer(port = 3001) {
	const orm = await MikroORM.init();
	const app = fastify();

	app.register(fastifyStatic, {
		root: resolve(__dirname, "../../client/dist"),
	});

	app.addHook("onRequest", (_, __, done) =>
		RequestContext.create(orm.em, done),
	);
	app.addHook("onClose", () => orm.close());

	const lastUpdatedHandler = createHandler();
	app.get(
		"/api/last-updated",
		lastUpdatedHandler(() => {
			return orm.em
				.createQueryBuilder(Ticket)
				.select("timestamp")
				.orderBy({ timestamp: "DESC" })
				.limit(1)
				.execute()
				.then((tickets) => tickets[0]?.timestamp);
		}),
	);

	const rankingHandler = createHandler({
		from: "date",
		to: "date",
		top: "int",
	});
	app.get(
		"/api/ranking",
		rankingHandler(async ({ top, from, to }) => {
			const query = orm.em
				.createQueryBuilder(Reaction, "r")
				.select([
					"u.id",
					"u.name",
					"u.avatar_url AS avatarUrl",
					"u.color",
					sql`COUNT(r.ticket_id) AS count`,
				])
				.join("r.user", "u")
				.join("r.ticket", "t")
				.groupBy("u.id")
				// biome-ignore lint/complexity/useLiteralKeys: sql raw string != literal key
				.orderBy({ [sql`count`]: "DESC" });
			if (top) {
				query.limit(top);
			}
			if (from) {
				query.andWhere({ "t.timestamp": { $gte: from } });
			}
			if (to) {
				query.andWhere({ "t.timestamp": { $lt: to } });
			}

			const rows: SqlResult = await query.execute();

			return Object.fromEntries(
				rows.map(({ id, ...data }, i) => [id, { ...data, rank: i + 1 }]),
			) satisfies RankingData;

			type SqlResult = Array<{
				id: string;
				name: string;
				avatarUrl: string;
				color: string | null;
				count: number;
			}>;

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
		}),
	);

	const monthlyHandler = createHandler({
		from: "date",
		to: "date",
		user: "str",
		top: "int",
	});
	app.get(
		"/api/monthly",
		monthlyHandler(async ({ top, from, to, user }) => {
			const knex = orm.em.getKnex();

			const userMonthQuery = knex("reaction as r")
				.join("ticket as t", "t.id", "r.ticket_id")
				.select(
					"r.user_id",
					knex.raw("DATE_FORMAT(t.timestamp, '%Y-%m') AS month"),
					knex.raw("COUNT(*) AS count"),
				)
				.groupBy("r.user_id", "month");
			if (from) {
				userMonthQuery.where("t.timestamp", ">=", from.toISOString());
			}
			if (to) {
				userMonthQuery.where("t.timestamp", "<", to.toISOString());
			}

			const topUsersQuery = knex("user_month")
				.select("user_id", knex.raw("SUM(count) AS total"))
				.groupBy("user_id")
				.orderBy("total", "desc");
			if (user) {
				topUsersQuery.where("user_id", "=", user);
			} else if (top) {
				topUsersQuery.limit(top);
			}

			const query = knex
				.with("user_month", userMonthQuery)
				.with("top_users", topUsersQuery)
				.select("u.id", "um.month", "um.count")
				.from("top_users as tu")
				.join("user_month as um", "um.user_id", "tu.user_id")
				.join("user as u", "u.id", "um.user_id")
				.orderBy([
					{ column: "tu.total", order: "desc" },
					{ column: "um.month", order: "asc" },
				]);

			const rows: SqlResult = await query;

			return mapValues(
				groupBy(rows, ({ id }) => id),
				(data) => data.map(({ id, ...tickets }) => tickets),
			) satisfies MonthlyData;

			type SqlResult = Array<{ id: string; month: string; count: number }>;
			type MonthlyData = Record<
				string,
				Array<{ month: string; count: number }>
			>;
		}),
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
			// reply.header("Cache-Control", "public, max-age=86400");
			try {
				return logic(validate(request));
			} catch (e) {
				return reply.code(400).send(e);
			}
		};
	}

	return wrapper;
}
