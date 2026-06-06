import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { mapValues } from "es-toolkit";
import type { TransformOptions } from "@/components/TimeChart";
import { activityTypes } from "@/db/activity";
import type { UserMonthlyCountParams } from "@/db/user";
import { ChartPage } from "@/pages/Chart";

export interface ChartOptions
	extends UserMonthlyCountParams,
		TransformOptions {}

export const Route = createFileRoute("/chart")({
	component: ChartPage,
	validateSearch: (search) =>
		mapValues(search, (v, k) => {
			if (k === "until" || k === "since") {
				return !Number.isNaN(new Date(v as any).getTime()) ? v : undefined;
			}
			if (["cumulative", "stacked", "bump"].includes(k)) {
				return typeof v === "boolean" ? v : undefined;
			}
			if (k === "types") {
				return Array.isArray(v) && v.every((t) => activityTypes.includes(t))
					? v
					: undefined;
			}
			return v;
		}) as ChartOptions,
	search: { middlewares: [retainSearchParams(true)] },
});
