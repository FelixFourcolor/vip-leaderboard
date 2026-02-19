import type {
	MonthlyCount as ServerMonthlyCount,
	MonthlyCountParams as ServerMonthlyCountParams,
} from "@server/api";
import { memoize } from "es-toolkit";
import { windows } from "@/utils/iter";
import { monthsInRange } from "@/utils/time";
import { createUrlParams } from "@/utils/url";

export type MonthlyCountParams = Required<ServerMonthlyCountParams> & {
	userId: string;
	cumulative: boolean;
};
export type MonthlyCount = { month: string; count: number | null }[];

export const getMonthlyCount = memoize(
	async ({
		userId,
		cumulative,
		since,
		until,
	}: MonthlyCountParams): Promise<MonthlyCount> => {
		const url = `/api/monthly-count/${userId}${createUrlParams({ since, until })}`;
		const data: ServerMonthlyCount = await fetch(url).then((res) => res.json());

		const months = monthsInRange(since, until)
			// server's "until" is exclusive
			.slice(0, -1);
		const countByMonth = Object.fromEntries(
			data.map(({ month, count }) => [month, count]),
		);

		if (!cumulative) {
			return months.map((month) => ({
				month,
				count: countByMonth[month] ?? null,
			}));
		}

		function* accumulate(): Generator<{ month: string; count: number | null }> {
			let accumulator = 0;
			for (const [month, nextMonth] of windows(months, 2)) {
				if (!month) {
					continue;
				}
				const count = countByMonth[month];
				if (count !== undefined) {
					accumulator += count;
					yield { month, count: accumulator };
					continue;
				}
				if (!nextMonth) {
					yield { month, count: accumulator };
					continue;
				}
				yield { month, count: null };
			}
		}

		return Array.from(accumulate());
	},
	{ getCacheKey: JSON.stringify },
);
