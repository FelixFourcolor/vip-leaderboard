import { env } from "node:process";
import { mapValues } from "es-toolkit";
import type { FastifyReply } from "fastify";
import { match } from "ts-pattern";

export const basicHandler = createHandler({});
export const timeHandler = createHandler({ since: "date", until: "date" });
export const rankingHandler = timeHandler.merge({ from: "int", to: "int" });

type Schema = Record<string, "str" | "int" | "date">;
function createHandler<S extends Schema>(schema: S) {
	type ValidatedQuery = {
		[K in keyof S]?: S[K] extends "int"
			? number
			: S[K] extends "date"
				? Date
				: S[K] extends "str"
					? string
					: never;
	};

	const inferIn: {
		[K in keyof S]?: S[K] extends "int" ? number : string;
	} = null!;

	function merge<T extends Schema>(other: T) {
		return createHandler<S & T>({ ...schema, ...other });
	}

	function validateQuery(query: Record<string, string>) {
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
		}) as ValidatedQuery;
	}

	function wrapper(
		logic: (
			query: ValidatedQuery,
			params: Record<string, string>,
		) => Promise<unknown>,
	) {
		return async (request: any, reply: FastifyReply) => {
			reply.header("Cache-Control", "public, max-age=86400");

			let validatedQuery: ValidatedQuery;
			try {
				validatedQuery = validateQuery(request.query);
			} catch (e) {
				return reply.code(400).send(e);
			}

			return logic(validatedQuery, request.params).catch((e) =>
				reply.code(500).send({
					statusCode: 500,
					error: "internal server error",
					diagnosis: env.NODE_ENV === "production" ? "incompetence" : e.message,
				}),
			);
		};
	}

	return Object.assign(wrapper, { merge, inferIn });
}
