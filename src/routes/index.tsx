import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { type } from "arktype";
import { isEmptyObject, mapValues } from "es-toolkit";
import { activityTypes } from "@/db/schema";
import { ChartPage } from "@/Pages/Chart";

const validate = type({
	"until?": "string | undefined",
	"since?": "string | undefined",
	"cumulative?": "boolean | undefined",
	"stacked?": "boolean | undefined",
	"types?": "string[]",
}).narrow(({ until, since, cumulative, stacked, types, ...extraneous }) => {
	if (!isEmptyObject(extraneous)) {
		return false;
	}
	if (until) {
		const untilDate = new Date(until);
		if (Number.isNaN(untilDate.getTime())) {
			return false;
		}
	}
	if (since) {
		const sinceDate = new Date(since);
		if (Number.isNaN(sinceDate.getTime())) {
			return false;
		}
	}
	if (since && until && new Date(since) > new Date(until)) {
		return false;
	}
	for (const t of types ?? []) {
		if (!activityTypes.includes(t as any)) {
			return false;
		}
	}
	return true;
});

export const Route = createFileRoute("/")({
	component: ChartPage,
	validateSearch: (search) =>
		mapValues(search, (v, k) => {
			const result = validate({ [k]: v });
			if (result instanceof type.errors) {
				return undefined;
			}
			return result[k];
		}),
	search: {
		middlewares: [retainSearchParams(true)],
	},
});
