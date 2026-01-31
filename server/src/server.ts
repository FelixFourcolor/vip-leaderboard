import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { MikroORM, RequestContext, sql } from "@mikro-orm/mysql";
import { mapValues } from "es-toolkit";
import { type FastifyReply, fastify } from "fastify";
import { match } from "ts-pattern";
import { Reaction } from "./modules/reaction.entity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer(port = 3001) {
	const orm = await MikroORM.init();
	const app = fastify();

	app.register(fastifyStatic, {
		root: path.resolve(__dirname, "../../client/dist"),
	});

	app.addHook("onRequest", (_, __, done) =>
		RequestContext.create(orm.em, done),
	);
	app.addHook("onClose", () => orm.close());

	const rankingHandler = createHandler({
		from: "date",
		to: "date",
		top: "int",
	});
	app.get(
		"/api/ranking",
		rankingHandler(({ top, from, to }) => {
			const query = orm.em
				.createQueryBuilder(Reaction, "r")
				.select(["u.name", sql`count(r.ticket_id) as count`])
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
			return query.execute();
		}),
	);

	const reportHandler = createHandler({
		from: "date",
		to: "date",
		user: "str",
		top: "int",
	});
	app.get(
		"/api/monthly-report",
		reportHandler(({ top, from, to, user }) => {
			const knex = orm.em.getKnex();

			const userMonthQuery = knex("reaction as r")
				.join("ticket as t", "t.id", "r.ticket_id")
				.select(
					"r.user_id",
					knex.raw("DATE_FORMAT(t.timestamp, '%Y-%m') AS fmt_month"),
					knex.raw("COUNT(*) AS count"),
				)
				.groupBy("r.user_id", knex.raw("DATE_FORMAT(t.timestamp, '%Y-%m')"));
			if (from) {
				userMonthQuery.where("t.timestamp", ">=", from);
			}
			if (to) {
				userMonthQuery.where("t.timestamp", "<", to);
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

			const boundsQuery =
				from && to
					? knex.select(
							knex.raw(
								"CAST(DATE_FORMAT(?, '%Y-%m-01') AS DATE) as start_month",
								[from],
							),
							knex.raw("CAST(? AS DATETIME) as end_time", [to]),
						)
					: knex("ticket").select(
							knex.raw(
								`CAST(DATE_FORMAT(${
									from ? "?" : "MIN(timestamp)"
								}, '%Y-%m-01') AS DATE) as start_month`,
								[from].filter(Boolean),
							),
							knex.raw(
								`CAST(${to ? "?" : "MAX(timestamp)"} AS DATETIME) as end_time`,
								[to].filter(Boolean),
							),
						);

			return knex
				.with("user_month", userMonthQuery)
				.with("top_users", topUsersQuery)
				.with("bounds", boundsQuery)
				.withRecursive("months", (qb) => {
					qb.select("start_month as month")
						.from("bounds")
						.unionAll((qb2) => {
							qb2
								.select(knex.raw("DATE_ADD(month, INTERVAL 1 MONTH)"))
								.from("months")
								.where(
									knex.raw(
										"DATE_ADD(month, INTERVAL 1 MONTH) < (SELECT end_time FROM bounds)",
									),
								);
						});
				})
				.select(
					"u.name",
					knex.raw("DATE_FORMAT(m.month, '%Y-%m') as month"),
					knex.raw("COALESCE(um.count, 0) as count"),
				)
				.from("top_users as tu")
				.crossJoin(knex.raw("months as m"))
				.leftJoin("user_month as um", function () {
					this.on("um.user_id", "tu.user_id").andOn(
						knex.raw("um.fmt_month = DATE_FORMAT(m.month, '%Y-%m')"),
					);
				})
				.join("user as u", "u.id", "tu.user_id")
				.orderBy([
					{ column: "tu.total", order: "desc" },
					{ column: "u.id", order: "asc" },
					{ column: "m.month", order: "asc" },
				]);
		}),
	);

	return app.listen({ port });
}

function createHandler<Schema extends Record<string, "str" | "int" | "date">>(
	schema: Schema,
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
		return mapValues(query, (v, k) =>
			match(schema[k])
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
				.exhaustive(),
		) as ValidatedArgs;
	}

	function wrapper(logic: (args: ValidatedArgs) => Promise<unknown>) {
		return (request: any, reply: FastifyReply) => {
			try {
				return logic(validate(request));
			} catch (e) {
				return reply.code(400).send(e);
			}
		};
	}

	return wrapper;
}
