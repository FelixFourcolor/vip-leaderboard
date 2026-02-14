import classNames from "classnames/bind";
import { useGetLastUpdated } from "@/api/hooks";
import { TimeSlider } from "@/components/TimeSlider";
import { Toggle } from "@/components/Toggle";
import { useSearch } from "@/routes/index";
import { toYyyyMm } from "@/utils/time";
import styles from "./Chart.module.css";

const cx = classNames.bind(styles);

export function ChartSettings() {
	const [{ to, from, cumulative }, navigate] = useSearch();

	return (
		<div className={cx("controls")}>
			<Toggle
				value={cumulative}
				onChange={(cumulative) => navigate({ search: { cumulative } })}
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
				onChange={[
					(from) => navigate({ search: { from } }),
					(to) => navigate({ search: { to } }),
				]}
			/>
		</div>
	);
}
