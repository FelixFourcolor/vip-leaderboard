import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { lastUpdated } from "@/api/lastUpdated";
import { VALID_MONTHS } from "@/api/monthlyCount";
import { VALID_RANKS } from "@/api/ranking";
import { Button } from "@/components/Button";
import { RangeSlider } from "@/components/RangeSlider";
import { Toggle } from "@/components/Toggle";
import { Route } from "@/routes/index";
import { offset } from "@/utils/time";
import styles from "./Chart.module.css";
import { COLORS } from "./colors";

const cx = classNames.bind(styles);

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
