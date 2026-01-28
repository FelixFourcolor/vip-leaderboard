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

	const url = await app.listen({ port });
	return { app, url };
}
