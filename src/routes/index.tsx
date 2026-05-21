import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { mapValues } from "es-toolkit";
import { type ActivityType, activityTypes } from "@/db/schema";
import { ChartPage } from "@/pages/Chart";
import type { YyyyMm } from "@/utils/time";

export type SearchParams = {
	until?: YyyyMm;
	since?: YyyyMm;
	cumulative?: boolean;
	stacked?: boolean;
	types?: ActivityType[];
};

export const Route = createFileRoute("/")({
	component: ChartPage,
	validateSearch: (search): SearchParams =>
		mapValues(search, (v, k) => {
			if (k === "until" || k === "since") {
				return !Number.isNaN(new Date(v as any).getTime()) ? v : undefined;
			}
			if (k === "cumulative" || k === "stacked") {
				return typeof v === "boolean" ? v : undefined;
			}
			if (k === "types") {
				return Array.isArray(v) && v.every((t) => activityTypes.includes(t))
					? v
					: undefined;
			}
			return undefined;
		}) as any,
	search: { middlewares: [retainSearchParams(true)] },
});
