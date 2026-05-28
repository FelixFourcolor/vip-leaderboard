import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { mapValues } from "es-toolkit";
import { type ActivityType, activityTypes } from "@/db/activity";
import { HomePage } from "@/pages/Home";
import type { YyyyMm } from "@/utils/time";

export interface RankingOptions {
	since?: YyyyMm;
	until?: YyyyMm;
	sortBy?: ActivityType | "total";
}

export const Route = createFileRoute("/")({
	component: HomePage,
	validateSearch: (search) =>
		mapValues(search, (v, k) => {
			if (k === "until" || k === "since") {
				return !Number.isNaN(new Date(v as any).getTime()) ? v : undefined;
			}
			if (k === "sortBy") {
				return activityTypes.includes(v as any) || v === "total"
					? v
					: undefined;
			}
			return v;
		}) as RankingOptions,
	search: { middlewares: [retainSearchParams(true)] },
});
