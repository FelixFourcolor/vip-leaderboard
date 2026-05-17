import { lastUpdated } from "virtual:db/last-updated";
import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/Button";
import { RangeSlider } from "@/components/RangeSlider";
import { Toggle } from "@/components/Toggle";
import { Route } from "@/routes/index";
import { monthsInRange, offset, toYyyyMm, type YyyyMm } from "@/utils/time";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

// Earliest month with meaningful data.
// Kinda hard to define "meaningful",
// so just hardcode a value instead of querying it
const startDate = "2020-01";
const VALID_MONTHS = monthsInRange(startDate, lastUpdated);

export function ControlPanel() {
	const [params, setParams] = useChartControls();
	const { until, since, cumulative, stacked } = params;

	const onDateChange = useCallback(
		([since, until]: readonly [YyyyMm, YyyyMm]) => setParams({ since, until }),
		[setParams],
	);

	return (
		<fieldset className={cx("control-panel")}>
			<legend>controls</legend>
			<div className={cx("toggles")}>
				<Toggle
					value={cumulative}
					onChange={(cumulative) => setParams({ cumulative })}
					className={cx("toggle")}
				>
					Cumulative
				</Toggle>
				<Toggle
					value={stacked}
					onChange={(stacked) => setParams({ stacked })}
					className={cx("toggle")}
				>
					Stacked
				</Toggle>
			</div>

			<RangeSlider
				className={cx("slider")}
				domain={VALID_MONTHS}
				selected={[since, until]}
				onChange={onDateChange}
				minDistance={1}
			/>
			<Button
				onClick={() => setParams(defaultParams)}
				disabled={isEqual(params, defaultParams)}
			>
				Reset
			</Button>
		</fieldset>
	);
}

const defaultParams = {
	until: toYyyyMm(lastUpdated),
	since: offset(lastUpdated, { years: -2, months: 1 }),
	cumulative: false,
	stacked: false,
};

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
