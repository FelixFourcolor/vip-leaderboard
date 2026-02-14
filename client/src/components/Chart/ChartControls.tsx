import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { useGetLastUpdated } from "@/api/hooks";
import { TimeSlider } from "@/components/TimeSlider";
import { Toggle } from "@/components/Toggle";
import { Route } from "@/routes/index";
import { offset, toYyyyMm } from "@/utils/time";
import styles from "./Chart.module.css";

const cx = classNames.bind(styles);

export function ChartControls() {
	const [{ to, from, cumulative }, setParams] = useChartControls();

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
		</div>
	);
}

export function useChartControls() {
	const lastUpdated = toYyyyMm(useGetLastUpdated());
	const defaults = useMemo(
		() => ({
			to: lastUpdated,
			from: offset(lastUpdated, { years: -2 }),
			cumulative: false,
			top: 5,
		}),
		[lastUpdated],
	);

	const params = { ...defaults, ...Route.useSearch() };
	const navigate = Route.useNavigate();

	const setParams = useCallback(
		(newParams: Partial<typeof params>) =>
			navigate({
				search: mapValues(newParams, (v, k) =>
					v !== defaults[k] ? v : undefined,
				) as typeof newParams,
			}),
		[navigate, defaults],
	);

	return [params, setParams] as const;
}
