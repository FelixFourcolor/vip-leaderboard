import { MikroORM, RequestContext, sql } from "@mikro-orm/mysql";
import { fastify } from "fastify";
import { Reaction } from "./modules/reaction.entity.js";

export async function bootstrap(port = 3001) {
	const orm = await MikroORM.init();
	const app = fastify();

	app.addHook("onRequest", (_, __, done) => {
		RequestContext.create(orm.em, done);
	});

	app.addHook("onClose", () => orm.close());

	app.get<{
		Querystring: { limit?: string; to?: string; from?: string };
	}>("/users", ({ query: { limit, from, to, ...unknowns } }, reply) => {
		if (Object.keys(unknowns).length > 0) {
			return reply.code(400).send({
				message: `Unknown query params: ${Object.keys(unknowns).join(", ")}`,
			});
		}
		const parsedLimit = limit ? parseInt(limit) : undefined;
		if (Number.isNaN(parsedLimit)) {
			return reply.code(400).send({
				message: `Invalid "limit=${limit}" param (expected integer).`,
			});
		}
		const parsedFrom = from ? Date.parse(from) : undefined;
		if (Number.isNaN(parsedFrom)) {
			return reply.code(400).send({
				message: `Invalid "from=${from}" param (expected yyyy-mm-dd).`,
			});
		}
		const parsedTo = to ? Date.parse(to) : undefined;
		if (Number.isNaN(parsedTo)) {
			return reply.code(400).send({
				message: `Invalid "to=${to}" param (expected yyyy-mm-dd).`,
			});
		}

		const query = orm.em
			.createQueryBuilder(Reaction, "r")
			.select(["u.name", sql`count(r.ticket_id) as count`])
			.join("r.user", "u")
			.join("r.ticket", "t")
			.groupBy("u.id")
			// biome-ignore lint/complexity/useLiteralKeys: sql raw string != literal key
			.orderBy({ [sql`count`]: "DESC" });
		if (parsedLimit !== undefined) {
			query.limit(parsedLimit);
		}
		if (parsedFrom !== undefined) {
			query.andWhere({ "t.timestamp": { $gte: new Date(parsedFrom) } });
		}
		if (parsedTo !== undefined) {
			query.andWhere({ "t.timestamp": { $lt: new Date(parsedTo) } });
		}
		return query.execute();
	});

	app.get<{ Querystring: { limit?: string; to?: string; from?: string } }>(
		"/users/monthly",
		async ({ query: { limit, from, to, ...unknowns } }, reply) => {
			if (Object.keys(unknowns).length > 0) {
				return reply.code(400).send({
					message: `Unknown query params: ${Object.keys(unknowns).join(", ")}`,
				});
			}
			const parsedLimit = limit ? parseInt(limit) : undefined;
			if (Number.isNaN(parsedLimit)) {
				return reply.code(400).send({
					message: `Invalid "limit=${limit}" param (expected integer).`,
				});
			}
			const parsedFrom = from ? Date.parse(from) : undefined;
			if (Number.isNaN(parsedFrom)) {
				return reply.code(400).send({
					message: `Invalid "from=${from}" param (expected yyyy-mm-dd).`,
				});
			}
			const parsedTo = to ? Date.parse(to) : undefined;
			if (Number.isNaN(parsedTo)) {
				return reply.code(400).send({
					message: `Invalid "to=${to}" param (expected yyyy-mm-dd).`,
				});
			}

			const knex = orm.em.getKnex();

			const userMonthQuery = knex("reaction as r")
				.join("ticket as t", "t.id", "r.ticket_id")
				.select(
					"r.user_id",
					knex.raw("DATE_FORMAT(t.timestamp, '%Y-%m') AS fmt_month"),
					knex.raw("COUNT(*) AS count"),
				)
				.groupBy("r.user_id", knex.raw("DATE_FORMAT(t.timestamp, '%Y-%m')"));
			if (parsedFrom !== undefined) {
				userMonthQuery.where("t.timestamp", ">=", parsedFrom);
			}
			if (parsedTo !== undefined) {
				userMonthQuery.where("t.timestamp", "<", parsedTo);
			}

			const topUsersQuery = knex("user_month")
				.select("user_id", knex.raw("SUM(count) AS total"))
				.groupBy("user_id")
				.orderBy("total", "desc");
			if (parsedLimit !== undefined) {
				topUsersQuery.limit(parsedLimit);
			}

			return knex
				.with("user_month", userMonthQuery)
				.with("top_users", topUsersQuery)
				.select("u.name", "um.fmt_month as month", "um.count", "tu.total")
				.from("top_users as tu")
				.join("user_month as um", "um.user_id", "tu.user_id")
				.join("user as u", "u.id", "um.user_id")
				.orderBy([
					{ column: "tu.total", order: "desc" },
					{ column: "um.fmt_month", order: "asc" },
				]);
		},
	);

	const url = await app.listen({ port });
	return { app, url };
}
