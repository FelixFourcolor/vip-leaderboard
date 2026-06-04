import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { mapValues } from "es-toolkit";
import { type ActivityType, activityTypes } from "@/db/activity";
import type { UserStatsParams } from "@/db/user";
import { HomePage } from "@/pages/Home";

export interface RankingOptions extends UserStatsParams {
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
