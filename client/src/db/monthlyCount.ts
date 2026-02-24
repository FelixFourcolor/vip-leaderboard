import { lastUpdated } from "virtual:db/last-updated";
import { windows } from "@/utils/iter";
import { monthsInRange, offset } from "@/utils/time";
import { getMonthlyCount as getMonthlyCountEndpoint } from "./endpoints";

export type MonthlyCountParams = {
	since: string;
	until: string;
	userId: string;
	cumulative: boolean;
};

export type MonthlyCount = { month: string; count: number | null }[];

// Earliest month with meaningful data.
// Kinda hard to define "meaningful",
// so just hardcode a value instead of defining an api for it.
const startDate = "2020-01";
export const VALID_MONTHS = monthsInRange(
	startDate,
	offset(lastUpdated, { months: 1 }),
);

async function getFn(params: Omit<MonthlyCountParams, "cumulative">) {
	const { userId, since, until } = params;
	const exclusiveUntil = offset(until, { months: 1 });

	return getMonthlyCountEndpoint(
		userId,
		since ? new Date(since) : undefined,
		exclusiveUntil ? new Date(exclusiveUntil) : undefined,
	);
}

export async function getMonthlyCount({
	userId,
	cumulative,
	since,
	until,
}: MonthlyCountParams): Promise<MonthlyCount> {
	const data = await getFn({ userId, since, until });

	const months = monthsInRange(since, until);
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
}
