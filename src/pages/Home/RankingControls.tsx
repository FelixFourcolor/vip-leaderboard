import { lastUpdated } from "virtual:db/last-updated";
import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/Button";
import { RangeSlider } from "@/components/RangeSlider";
import { VALID_MONTHS } from "@/db/time";
import { type RankingOptions, Route } from "@/routes/index";
import { offset, toYyyyMm, type YyyyMm } from "@/utils/time";
import type { Pair } from "@/utils/types";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

export function RankingControls() {
	const [options, setOptions] = useRankingControls();
	const { until, since } = options;

	const onDateChange = useCallback(
		([since, until]: Pair<YyyyMm>) => setOptions({ since, until }),
		[setOptions],
	);

	return (
		<div className={cx("controls")}>
			<RangeSlider
				className={cx("slider")}
				domain={VALID_MONTHS}
				selected={[since, until]}
				onChange={onDateChange}
				minDistance={0}
			/>
			<Button
				onClick={() => setOptions(defaultOptions)}
				disabled={isEqual(options, defaultOptions)}
			>
				Reset
			</Button>
		</div>
	);
}

const defaultOptions = {
	until: toYyyyMm(lastUpdated),
	since: offset(lastUpdated, { years: -2, months: 1 }),
	sortBy: "total",
} satisfies Required<RankingOptions>;

export function useRankingControls() {
	const search = Route.useSearch();
	const options = useMemo(() => ({ ...defaultOptions, ...search }), [search]);

	const navigate = Route.useNavigate();
	const setOptions = useCallback(
		(options: RankingOptions) => {
			const search = mapValues(options, (v, k) =>
				isEqual(v, defaultOptions[k]) ? undefined : v,
			) as RankingOptions;
			navigate({ search, replace: true });
		},
		[navigate],
	);

	return [options, setOptions] as const;
}
