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

const supportedRanks: number[] = [...Array(25).keys()].map((i) => i + 1);

const defaultParams = {
	until: lastUpdated,
	since: offset(lastUpdated, { years: -2 }),
	cumulative: false,
	from: 1,
	to: 5,
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
					domain={supportedRanks}
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
	const defaults = useDefaultParams();
	const params = { ...defaults, ...Route.useSearch() };
	const navigate = Route.useNavigate();

	const setParams = useCallback(
		(params: Partial<typeof defaults>) => {
			const search = mapValues(params, (v, k) =>
				v !== defaults[k] ? v : undefined,
			) as typeof params;
			navigate({ search });
		},
		[navigate, defaults],
	);

	return [params, setParams] as const;
}

function useDefaultParams() {
	return useMemo(
		() => ({
			until: lastUpdated,
			since: offset(lastUpdated, { years: -2 }),
			cumulative: false,
			from: 1,
			to: 5,
		}),
		[],
	);
}
