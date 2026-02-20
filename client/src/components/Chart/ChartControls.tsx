import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { lastUpdated } from "@/api/lastUpdated";
import { Button } from "@/components/Button";
import { RangeSlider } from "@/components/RangeSlider";
import { Toggle } from "@/components/Toggle";
import { Route } from "@/routes/index";
import { monthsInRange, offset } from "@/utils/time";
import styles from "./Chart.module.css";
import { COLORS } from "./colors";

const cx = classNames.bind(styles);

const availableRanks: number[] = [...Array(50).keys()].map((i) => i + 1);
const defaultParams = {
	until: lastUpdated,
	since: offset(lastUpdated, { years: -2, months: 1 }),
	cumulative: false,
	from: 1,
	to: 10,
};

export function ChartControls() {
	const [params, setParams] = useChartControls();
	const { until, since, cumulative, from, to } = params;

	// Earliest month with meaningful data.
	// Kinda hard to define "meaningful",
	// so just hardcode a value instead of defining an api for it.
	const domainFrom = "2020-01";
	const domainTo = lastUpdated;
	const domain = useMemo(() => monthsInRange(domainFrom, domainTo), []);

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
					domain={availableRanks}
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
					domain={domain}
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
	const params = { ...defaultParams, ...Route.useSearch() };
	const navigate = Route.useNavigate();

	const setParams = useCallback(
		(update: Partial<typeof params>) => {
			const search = mapValues(update, (v, k) =>
				v !== defaultParams[k] ? v : undefined,
			) as typeof update;
			navigate({ search });
		},
		[navigate],
	);

	return [params, setParams] as const;
}
