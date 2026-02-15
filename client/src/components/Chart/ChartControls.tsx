import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { useGetLastUpdated } from "@/api/hooks";
import { Button } from "@/components/Button";
import { TimeSlider } from "@/components/TimeSlider";
import { Toggle } from "@/components/Toggle";
import { Route } from "@/routes/index";
import { offset, toYyyyMm } from "@/utils/time";
import styles from "./Chart.module.css";

const cx = classNames.bind(styles);

export function ChartControls() {
	const defaultParams = useDefaultParams();
	const [params, setParams] = useChartControls();
	const { to, from, cumulative } = params;

	return (
		<div className={cx("controls")}>
			<Toggle
				value={cumulative}
				onChange={(cumulative) => setParams({ cumulative })}
				className={cx("toggle")}
			>
				Cumulative
			</Toggle>
			<TimeSlider
				className={cx("slider")}
				domain={[
					// earliest month with meaningful data
					// kinda hard to define "meaningful",
					// so just hardcode a value instead of querying it
					"2020-01",
					toYyyyMm(useGetLastUpdated()),
				]}
				selected={[from, to]}
				onChange={[(from) => setParams({ from }), (to) => setParams({ to })]}
			/>
			{
				<Button
					onClick={() => setParams(defaultParams)}
					disabled={isEqual(params, defaultParams)}
				>
					Reset
				</Button>
			}
		</div>
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
