import { lastUpdated } from "virtual:db/last-updated";
import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/Button";
import { RangeSlider } from "@/components/RangeSlider";
import { Toggle } from "@/components/Toggle";
import { Route } from "@/routes/index";
import { monthsInRange, offset, toYyyyMm } from "@/utils/time";
import styles from "./Chart.module.css";
import { COLORS } from "./colors";

const cx = classNames.bind(styles);

const defaultParams = {
	until: toYyyyMm(lastUpdated),
	since: offset(lastUpdated, { years: -2, months: 1 }),
	cumulative: false,
	from: 1,
	to: 10,
};

const VALID_RANKS = Array.from({ length: 50 }, (_, i) => i + 1);

// Earliest month with meaningful data.
// Kinda hard to define "meaningful",
// so just hardcode a value instead of defining an api for it.
const startDate = "2020-01";
const VALID_MONTHS = monthsInRange(
	startDate,
	offset(lastUpdated, { months: 1 }),
);

export function ChartControls() {
	const [params, setParams] = useChartControls();
	const { until, since, cumulative, from, to } = params;

	const onChangeRankRange = useCallback(
		([from, to]: [number, number]) => setParams({ from, to }),
		[setParams],
	);
	const onChangeDateRange = useCallback(
		([since, until]: [string, string]) => setParams({ since, until }),
		[setParams],
	);
	return (
		<>
			<div className={cx("mid-panel")}>
				<span className={cx("label")}>Ranks</span>
				<RangeSlider
					className={cx("slider")}
					domain={VALID_RANKS}
					selected={[from, to]}
					onChange={onChangeRankRange}
					direction="vertical"
					maxDistance={COLORS.length - 1}
				/>
			</div>
			<div className={cx("bottom-panel")}>
				<Toggle
					value={cumulative}
					onChange={(cumulative) => setParams({ cumulative })}
					className={cx("toggle")}
				>
					Cumulative
				</Toggle>
				<RangeSlider
					className={cx("slider")}
					domain={VALID_MONTHS.slice(0, -1)}
					selected={[since, until]}
					onChange={onChangeDateRange}
					minDistance={1}
				/>
				<Button
					onClick={() => setParams(defaultParams)}
					disabled={isEqual(params, defaultParams)}
				>
					Reset
				</Button>
			</div>
		</>
	);
}

export function useChartControls() {
	const search = Route.useSearch();
	const params = useMemo(() => ({ ...defaultParams, ...search }), [search]);

	const navigate = Route.useNavigate();

	const setParams = useCallback(
		(update: Partial<typeof params>) => {
			const search = mapValues(update, (v, k) =>
				v !== defaultParams[k] ? v : undefined,
			) as typeof update;
			navigate({ search, replace: true });
		},
		[navigate],
	);

	return [params, setParams] as const;
}
