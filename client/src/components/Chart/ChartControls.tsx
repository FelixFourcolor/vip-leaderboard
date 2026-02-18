import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { useGetLastUpdated } from "@/api/hooks";
import { Button } from "@/components/Button";
import { RangeSlider, Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import { Route } from "@/routes/index";
import { monthsInRange, offset, toYyyyMm } from "@/utils/time";
import styles from "./Chart.module.css";

const cx = classNames.bind(styles);

const topDomain = [...Array(10).keys()].map((i) => i + 1);

export function ChartControls() {
	const defaultParams = useDefaultParams();
	const [params, setParams] = useChartControls();
	const { to, from, cumulative, top } = params;

	// Earliest month with meaningful data.
	// Kinda hard to define "meaningful",
	// so just hardcode a value instead of querying it.
	const domainFrom = "2020-01";
	const domainTo = toYyyyMm(useGetLastUpdated());
	const domain = useMemo(() => monthsInRange(domainFrom, domainTo), [domainTo]);

	const onChangeFrom = useCallback(
		(from: string) => setParams({ from }),
		[setParams],
	);
	const onChangeTo = useCallback(
		(to: string) => setParams({ to }),
		[setParams],
	);
	const onChangeTop = useCallback(
		(top: number) => setParams({ top }),
		[setParams],
	);

	return (
		<>
			<div className={cx("mid-panel")}>
				Top
				<Slider
					className={cx("slider")}
					domain={topDomain}
					value={top}
					onChange={onChangeTop}
					direction="vertical"
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
					selected={[from, to]}
					onChange={[onChangeFrom, onChangeTo]}
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
	const lastUpdated = toYyyyMm(useGetLastUpdated());
	return useMemo(
		() => ({
			to: lastUpdated,
			from: offset(lastUpdated, { years: -2 }),
			cumulative: false,
			top: 5,
		}),
		[lastUpdated],
	);
}
