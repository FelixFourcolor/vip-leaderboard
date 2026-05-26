import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { mapValues } from "es-toolkit";
import { type ActivityType, activityTypes } from "@/db/activity";
import { ChartPage } from "@/pages/Chart";
import type { YyyyMm } from "@/utils/time";

export type ChartOptions = {
	until?: YyyyMm;
	since?: YyyyMm;
	cumulative?: boolean;
	stacked?: boolean;
	types?: ActivityType[];
};

export const Route = createFileRoute("/chart")({
	component: ChartPage,
	validateSearch: (search): ChartOptions =>
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
